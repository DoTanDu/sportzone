const { get, query, run } = require('../config/db');
const { getPagination, formatPaginationResponse } = require('../utils/pagination');

// Thống kê tổng quan bảng điều khiển Quản trị viên
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Tổng doanh thu đơn hàng đã thanh toán hoặc đã giao
    const revenueStat = await get(
      `SELECT COALESCE(SUM(total_amount), 0) AS total_revenue 
       FROM orders 
       WHERE payment_status = 'paid' OR order_status = 'delivered'`
    );

    // 2. Tổng số lượng đơn hàng
    const orderStat = await get('SELECT COUNT(id) AS total_orders FROM orders');

    // 3. Tổng số khách hàng
    const customerStat = await get("SELECT COUNT(id) AS total_customers FROM users WHERE role = 'customer'");

    // 4. Cảnh báo các biến thể sắp hết hàng trong kho (dưới 10 món)
    const lowStockVariants = await query(
      `SELECT pv.id, pv.sku_variant, pv.size, pv.color, pv.stock_quantity, p.name AS product_name
       FROM product_variants pv
       JOIN products p ON pv.product_id = p.id
       WHERE pv.stock_quantity <= 10 AND pv.is_active = 1
       ORDER BY pv.stock_quantity ASC
       LIMIT 10`
    );

    // 5. Top sản phẩm thể thao bán chạy nhất
    const topSellingProducts = await query(
      `SELECT id, name, sku, thumbnail_url, base_price, sold_count
       FROM products
       WHERE is_active = 1
       ORDER BY sold_count DESC
       LIMIT 5`
    );

    // 6. Đơn hàng mới nhất cần xử lý
    const recentOrders = await query(
      `SELECT id, order_code, receiver_name, total_amount, payment_status, order_status, created_at
       FROM orders
       ORDER BY created_at DESC
       LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        total_revenue: revenueStat.total_revenue,
        total_orders: orderStat.total_orders,
        total_customers: customerStat.total_customers,
        low_stock_variants: lowStockVariants,
        top_selling_products: topSellingProducts,
        recent_orders: recentOrders
      }
    });
  } catch (err) {
    next(err);
  }
};

// Quản lý danh sách đơn hàng cho Quản trị viên (có phân trang an toàn)
const getAdminOrders = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query.page, req.query.limit);
    const { status } = req.query;

    let whereClause = '';
    let params = [];

    if (status && status.trim() !== '') {
      whereClause = 'WHERE order_status = ?';
      params.push(status.trim());
    }

    const countRes = await get(`SELECT COUNT(id) AS total FROM orders ${whereClause}`, params);
    const total = countRes ? countRes.total : 0;

    const orders = await query(
      `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json(formatPaginationResponse(orders, total, page, limit));
  } catch (err) {
    next(err);
  }
};

// Cập nhật trạng thái đơn hàng và lưu log timeline
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { order_status, note = '' } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'returned'];
    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái đơn hàng không hợp lệ.'
      });
    }

    const order = await get('SELECT id, order_code, order_status FROM orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng này.' });
    }

    const oldStatus = order.order_status;
    const adminName = req.user ? req.user.full_name : 'Quản trị viên';

    // Nếu đơn chuyển sang 'cancelled' hoặc 'returned' mà trước đó chưa hủy/trả -> Hoàn kho
    if (['cancelled', 'returned'].includes(order_status) && !['cancelled', 'returned'].includes(oldStatus)) {
      const items = await query(
        'SELECT product_variant_id, quantity FROM order_items WHERE order_id = ?',
        [id]
      );

      for (const item of items) {
        if (item.product_variant_id) {
          const variant = await get(
            'SELECT product_id, stock_quantity FROM product_variants WHERE id = ?',
            [item.product_variant_id]
          );

          if (variant) {
            await run(
              'UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?',
              [item.quantity, item.product_variant_id]
            );
            await run(
              'UPDATE products SET sold_count = MAX(0, sold_count - ?) WHERE id = ?',
              [item.quantity, variant.product_id]
            );
            await run(
              `INSERT INTO inventory_logs (product_variant_id, change_type, quantity_change, previous_quantity, new_quantity, reference_id, note, created_by)
               VALUES (?, 'order_cancel_restock', ?, ?, ?, ?, ?, ?)`,
              [
                item.product_variant_id,
                item.quantity,
                variant.stock_quantity,
                variant.stock_quantity + item.quantity,
                order.order_code,
                `Hoàn kho khi đổi trạng thái đơn sang ${order_status}`,
                adminName
              ]
            );
          }
        }
      }
    }

    // Cập nhật trạng thái
    await run(
      'UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [order_status, id]
    );

    // Ghi vào dòng thời gian (Timeline)
    await run(
      'INSERT INTO order_timeline (order_id, status, note, created_by) VALUES (?, ?, ?, ?)',
      [id, order_status, note || `Cập nhật trạng thái sang: ${order_status}`, adminName]
    );

    res.json({
      success: true,
      message: `Đã cập nhật đơn hàng ${order.order_code} sang trạng thái: ${order_status}`
    });
  } catch (err) {
    next(err);
  }
};

// Lấy danh sách sản phẩm đầy đủ phục vụ bảng quản lý Admin (kèm biến thể)
const getAllAdminProducts = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query.page, req.query.limit);
    const { search } = req.query;

    let whereSql = '';
    let params = [];

    if (search && search.trim() !== '') {
      whereSql = 'WHERE p.name LIKE ? OR p.sku LIKE ?';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    const countRes = await get(`SELECT COUNT(p.id) AS total FROM products p ${whereSql}`, params);
    const total = countRes ? countRes.total : 0;

    const products = await query(
      `SELECT 
        p.id, p.name, p.slug, p.sku, p.base_price, p.is_featured, p.is_active, p.thumbnail_url, p.sold_count,
        c.name AS category_name, b.name AS brand_name,
        COUNT(v.id) AS variant_count,
        COALESCE(SUM(v.stock_quantity), 0) AS total_stock
       FROM products p
       JOIN categories c ON p.category_id = c.id
       JOIN brands b ON p.brand_id = b.id
       LEFT JOIN product_variants v ON p.id = v.product_id
       ${whereSql}
       GROUP BY p.id
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Lấy chi tiết các biến thể cho từng sản phẩm
    for (const prod of products) {
      prod.variants = await query(
        'SELECT id, sku_variant, size, color, price, stock_quantity FROM product_variants WHERE product_id = ?',
        [prod.id]
      );
    }

    res.json(formatPaginationResponse(products, total, page, limit));
  } catch (err) {
    next(err);
  }
};

// Tạo sản phẩm mới kèm các biến thể (size, màu, tồn kho)
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      category_id,
      brand_id,
      sku,
      base_price,
      short_description = '',
      description = '',
      thumbnail_url = '',
      is_featured = 0,
      variants = []
    } = req.body;

    if (!name || !category_id || !brand_id || !sku || !base_price) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ tên sản phẩm, danh mục, thương hiệu, mã SKU và giá bán.'
      });
    }

    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now().toString().slice(-4);

    const result = await run(
      `INSERT INTO products (
        category_id, brand_id, name, slug, sku, short_description, description,
        thumbnail_url, base_price, is_featured, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        category_id,
        brand_id,
        name.trim(),
        slug,
        sku.trim().toUpperCase(),
        short_description.trim(),
        description.trim(),
        thumbnail_url.trim() || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
        Number(base_price),
        is_featured ? 1 : 0
      ]
    );

    const productId = result.id;

    // Tạo các biến thể ban đầu
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        const vSku = `${sku.trim().toUpperCase()}-${(v.size || 'STD').replace(/\s+/g, '')}`;
        await run(
          `INSERT INTO product_variants (product_id, sku_variant, size, color, price, stock_quantity, is_active)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [productId, vSku, v.size || null, v.color || null, Number(v.price || base_price), parseInt(v.stock_quantity || 10, 10)]
        );
      }
    } else {
      // Biến thể mặc định tiêu chuẩn nếu không nhập
      await run(
        `INSERT INTO product_variants (product_id, sku_variant, size, color, price, stock_quantity, is_active)
         VALUES (?, ?, 'Tiêu chuẩn', 'Mặc định', ?, 20, 1)`,
        [productId, `${sku.trim().toUpperCase()}-STD`, Number(base_price)]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Thêm sản phẩm thể thao mới thành công!',
      data: { id: productId, name, slug }
    });
  } catch (err) {
    next(err);
  }
};

// Cập nhật thông tin sản phẩm
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, base_price, short_description, description, is_featured, is_active, thumbnail_url } = req.body;

    const product = await get('SELECT id FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    }

    await run(
      `UPDATE products SET 
        name = COALESCE(?, name),
        base_price = COALESCE(?, base_price),
        short_description = COALESCE(?, short_description),
        description = COALESCE(?, description),
        is_featured = COALESCE(?, is_featured),
        is_active = COALESCE(?, is_active),
        thumbnail_url = COALESCE(?, thumbnail_url),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, base_price, short_description, description, is_featured, is_active, thumbnail_url, id]
    );

    res.json({ success: true, message: 'Cập nhật thông tin sản phẩm thành công!' });
  } catch (err) {
    next(err);
  }
};

// Cập nhật nhanh số lượng tồn kho của biến thể
const updateVariantStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock_quantity, price } = req.body;

    const variant = await get('SELECT id, product_id FROM product_variants WHERE id = ?', [id]);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy biến thể này.' });
    }

    const qty = parseInt(stock_quantity, 10);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ success: false, message: 'Số lượng tồn kho không hợp lệ.' });
    }

    if (price !== undefined) {
      await run('UPDATE product_variants SET stock_quantity = ?, price = ? WHERE id = ?', [qty, Number(price), id]);
    } else {
      await run('UPDATE product_variants SET stock_quantity = ? WHERE id = ?', [qty, id]);
    }

    res.json({ success: true, message: 'Cập nhật kho hàng thành công!' });
  } catch (err) {
    next(err);
  }
};

// Xóa hoặc ẩn sản phẩm
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Đổi trạng thái is_active = 0 để tránh mất dữ liệu liên quan đơn hàng cũ
    await run('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã ẩn sản phẩm khỏi cửa hàng thành công.' });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// QUẢN LÝ MÃ GIẢM GIÁ (COUPONS) CHO ADMIN
// ==========================================
const getAdminCoupons = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query.page, req.query.limit);
    const countRes = await get('SELECT COUNT(id) AS total FROM coupons');
    const total = countRes ? countRes.total : 0;

    const coupons = await query(
      'SELECT * FROM coupons ORDER BY id DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.json(formatPaginationResponse(coupons, total, page, limit));
  } catch (err) {
    next(err);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      description = '',
      discount_type = 'percentage',
      discount_value,
      min_order_value = 0,
      max_discount_amount = null,
      usage_limit = 100,
      start_date,
      end_date
    } = req.body;

    if (!code || !discount_value || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền mã giảm giá, mức giảm, ngày bắt đầu và ngày kết thúc.'
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await get('SELECT id FROM coupons WHERE code = ?', [cleanCode]);
    if (existing) {
      return res.status(400).json({ success: false, message: `Mã giảm giá "${cleanCode}" đã tồn tại.` });
    }

    const result = await run(
      `INSERT INTO coupons (
        code, description, discount_type, discount_value, min_order_value, max_discount_amount,
        usage_limit, start_date, end_date, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        cleanCode,
        description.trim(),
        discount_type,
        Number(discount_value),
        Number(min_order_value || 0),
        max_discount_amount ? Number(max_discount_amount) : null,
        parseInt(usage_limit || 100, 10),
        start_date,
        end_date
      ]
    );

    res.status(201).json({
      success: true,
      message: `Tạo mã giảm giá "${cleanCode}" thành công!`,
      data: { id: result.id, code: cleanCode }
    });
  } catch (err) {
    next(err);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      description,
      discount_value,
      min_order_value,
      max_discount_amount,
      usage_limit,
      end_date,
      is_active
    } = req.body;

    const coupon = await get('SELECT id FROM coupons WHERE id = ?', [id]);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá này.' });
    }

    await run(
      `UPDATE coupons SET
        description = COALESCE(?, description),
        discount_value = COALESCE(?, discount_value),
        min_order_value = COALESCE(?, min_order_value),
        max_discount_amount = COALESCE(?, max_discount_amount),
        usage_limit = COALESCE(?, usage_limit),
        end_date = COALESCE(?, end_date),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [description, discount_value, min_order_value, max_discount_amount, usage_limit, end_date, is_active, id]
    );

    res.json({ success: true, message: 'Cập nhật mã giảm giá thành công!' });
  } catch (err) {
    next(err);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Tuyệt đối không xóa vĩnh viễn, chỉ chuyển trạng thái is_active = 0 (Tạm ẩn) để bảo toàn dữ liệu
    await run('UPDATE coupons SET is_active = 0 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã chuyển mã giảm giá sang trạng thái tạm ẩn.' });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// QUẢN LÝ DANH MỤC & THƯƠNG HIỆU CHO ADMIN
// ==========================================
const createCategory = async (req, res, next) => {
  try {
    const { name, icon = 'fa-medal', image_url = '', parent_id = null } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Tên danh mục không được để trống.' });

    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now().toString().slice(-3);

    const result = await run(
      'INSERT INTO categories (name, slug, icon, image_url, parent_id, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      [name.trim(), slug, icon.trim(), image_url.trim(), parent_id || null]
    );

    res.status(201).json({ success: true, message: 'Thêm danh mục mới thành công!', data: { id: result.id, name, slug } });
  } catch (err) {
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, icon, is_active } = req.body;
    await run(
      'UPDATE categories SET name = COALESCE(?, name), icon = COALESCE(?, icon), is_active = COALESCE(?, is_active) WHERE id = ?',
      [name, icon, is_active, id]
    );
    res.json({ success: true, message: 'Cập nhật danh mục thành công!' });
  } catch (err) {
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await run('UPDATE categories SET is_active = 0 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã ẩn danh mục thành công.' });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// QUẢN LÝ KHÁCH HÀNG (USERS) CHO ADMIN
// ==========================================
const getAdminUsers = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query.page, req.query.limit);
    const countRes = await get("SELECT COUNT(id) AS total FROM users WHERE role = 'customer'");
    const total = countRes ? countRes.total : 0;

    const users = await query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.status, u.created_at,
              COUNT(o.id) AS total_orders,
              COALESCE(SUM(o.total_amount), 0) AS total_spent
       FROM users u
       LEFT JOIN orders o ON u.id = o.user_id AND o.payment_status = 'paid'
       WHERE u.role = 'customer'
       GROUP BY u.id
       ORDER BY u.id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json(formatPaginationResponse(users, total, page, limit));
  } catch (err) {
    next(err);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'banned'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái người dùng không hợp lệ.' });
    }

    await run('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: `Đã cập nhật trạng thái người dùng thành: ${status}` });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getAdminOrders,
  updateOrderStatus,
  getAllAdminProducts,
  createProduct,
  updateProduct,
  updateVariantStock,
  deleteProduct,
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  createCategory,
  updateCategory,
  deleteCategory,
  getAdminUsers,
  updateUserStatus
};
