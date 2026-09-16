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

    const order = await get('SELECT id, order_code FROM orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng này.' });
    }

    // Cập nhật trạng thái
    await run(
      'UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [order_status, id]
    );

    // Ghi vào dòng thời gian (Timeline)
    const adminName = req.user ? req.user.full_name : 'Quản trị viên';
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

module.exports = {
  getDashboardStats,
  getAdminOrders,
  updateOrderStatus,
  getAllAdminProducts,
  createProduct,
  updateProduct,
  updateVariantStock,
  deleteProduct
};
