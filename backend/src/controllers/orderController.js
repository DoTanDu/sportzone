const { get, query, run, transaction } = require('../config/db');
const { getPagination, formatPaginationResponse } = require('../utils/pagination');

// Tạo mã đơn hàng độc nhất
const generateOrderCode = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `DH${dateStr}${randomSuffix}`;
};

// Đặt hàng an toàn sử dụng SQL Transaction (chống bán vượt tồn kho, chống tràn/âm data)
const createOrder = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const {
      receiver_name,
      receiver_phone,
      shipping_address,
      items,
      coupon_code,
      payment_method = 'cod',
      note = ''
    } = req.body;

    // 1. Kiểm tra đầu vào cơ bản
    if (!receiver_name || !receiver_phone || !shipping_address) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng của bạn đang trống, không thể đặt hàng.'
      });
    }

    // Giới hạn số lượng mặt hàng trong 1 đơn (Chống payload DoS tràn DB)
    if (items.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng loại mặt hàng vượt quá giới hạn cho phép (tối đa 50 mặt hàng/đơn).'
      });
    }

    // 2. Thực hiện toàn bộ quy trình đặt hàng trong 1 Transaction ACID
    const orderResult = await transaction(async ({ get, run, query }) => {
      let subtotal = 0;
      const verifiedItems = [];

      for (const item of items) {
        const variantId = parseInt(item.variant_id, 10);
        const qty = parseInt(item.quantity, 10);

        if (isNaN(variantId) || isNaN(qty) || qty <= 0 || qty > 1000) {
          throw new Error('Số lượng sản phẩm đặt mua không hợp lệ.');
        }

        // Lấy thông tin biến thể & kiểm tra tồn kho tức thời
        const variant = await get(
          `SELECT pv.id, pv.product_id, pv.price, pv.stock_quantity, pv.size, pv.color, p.name AS product_name
           FROM product_variants pv
           JOIN products p ON pv.product_id = p.id
           WHERE pv.id = ? AND pv.is_active = 1 AND p.is_active = 1`,
          [variantId]
        );

        if (!variant) {
          throw new Error(`Mặt hàng (Mã #${variantId}) không tồn tại hoặc đã ngừng kinh doanh.`);
        }

        if (variant.stock_quantity < qty) {
          throw new Error(
            `Sản phẩm "${variant.product_name}" (Size: ${variant.size || 'Mặc định'}) chỉ còn ${variant.stock_quantity} trong kho, không đủ số lượng ${qty} bạn yêu cầu.`
          );
        }

        // Cập nhật trừ kho nguyên tử (Atomic Update có điều kiện chống Race Condition)
        const updateStock = await run(
          'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
          [qty, variantId, qty]
        );

        if (updateStock.changes === 0) {
          throw new Error(`Sản phẩm "${variant.product_name}" vừa có khách khác đặt trước, không đủ tồn kho.`);
        }

        // Tăng số lượng đã bán của sản phẩm chính
        await run('UPDATE products SET sold_count = sold_count + ? WHERE id = ?', [qty, variant.product_id]);

        const lineTotal = variant.price * qty;
        subtotal += lineTotal;

        verifiedItems.push({
          product_variant_id: variant.id,
          product_name: variant.product_name,
          variant_label: `Size: ${variant.size || 'N/A'}${variant.color ? ' - Màu: ' + variant.color : ''}`,
          unit_price: variant.price,
          quantity: qty,
          total_price: lineTotal
        });
      }

      // 3. Xử lý mã giảm giá (nếu có)
      let discountAmount = 0;
      let couponId = null;

      if (coupon_code && coupon_code.trim() !== '') {
        const coupon = await get(
          `SELECT * FROM coupons WHERE code = ? AND is_active = 1`,
          [coupon_code.trim().toUpperCase()]
        );

        if (coupon) {
          const now = new Date();
          const startDate = new Date(coupon.start_date);
          const endDate = new Date(coupon.end_date);

          if (now >= startDate && now <= endDate && coupon.used_count < coupon.usage_limit && subtotal >= coupon.min_order_value) {
            couponId = coupon.id;
            if (coupon.discount_type === 'percentage') {
              discountAmount = (subtotal * coupon.discount_value) / 100;
              if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
                discountAmount = coupon.max_discount_amount;
              }
            } else if (coupon.discount_type === 'fixed_amount') {
              discountAmount = coupon.discount_value;
            }

            // Tăng số lượt đã dùng của coupon
            await run('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [coupon.id]);
          }
        }
      }

      const shippingFee = subtotal >= 500000 ? 0 : 30000; // Miễn phí vận chuyển cho đơn từ 500k
      const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);
      const orderCode = generateOrderCode();

      // 4. Lưu đơn hàng vào bảng orders
      const orderInsert = await run(
        `INSERT INTO orders (
          order_code, user_id, receiver_name, receiver_phone, shipping_address,
          subtotal, shipping_fee, discount_amount, coupon_id, total_amount,
          payment_method, payment_status, order_status, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'pending', ?)`,
        [
          orderCode,
          userId,
          receiver_name.trim(),
          receiver_phone.trim(),
          shipping_address.trim(),
          subtotal,
          shippingFee,
          discountAmount,
          couponId,
          totalAmount,
          payment_method,
          note ? note.trim() : null
        ]
      );

      const orderId = orderInsert.id;

      // 5. Lưu chi tiết sản phẩm đơn hàng
      for (const item of verifiedItems) {
        await run(
          `INSERT INTO order_items (order_id, product_variant_id, product_name, variant_label, unit_price, quantity, total_price)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [orderId, item.product_variant_id, item.product_name, item.variant_label, item.unit_price, item.quantity, item.total_price]
        );
      }

      // 6. Ghi log lịch sử hành trình đơn hàng
      await run(
        `INSERT INTO order_timeline (order_id, status, note, created_by)
         VALUES (?, 'pending', 'Khách hàng đặt đơn hàng mới thành công', 'Hệ thống')`,
        [orderId]
      );

      // 7. Dọn sạch giỏ hàng của user/session sau khi đặt thành công
      if (userId) {
        const cart = await get('SELECT id FROM carts WHERE user_id = ?', [userId]);
        if (cart) {
          await run('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
        }
      }

      return {
        order_id: orderId,
        order_code: orderCode,
        total_amount: totalAmount,
        subtotal,
        shipping_fee: shippingFee,
        discount_amount: discountAmount,
        items_count: verifiedItems.length
      };
    });

    res.status(201).json({
      success: true,
      message: 'Đặt hàng dụng cụ thể thao thành công!',
      data: orderResult
    });
  } catch (err) {
    next(err);
  }
};

// Tra cứu hành trình đơn hàng theo mã đơn
const getOrderTracking = async (req, res, next) => {
  try {
    const { code } = req.params;

    const order = await get(
      `SELECT * FROM orders WHERE order_code = ?`,
      [code.trim()]
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy đơn hàng với mã "${code}".`
      });
    }

    const items = await query(
      `SELECT oi.*, pv.image_url, p.thumbnail_url
       FROM order_items oi
       LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
       LEFT JOIN products p ON pv.product_id = p.id
       WHERE oi.order_id = ?`,
      [order.id]
    );

    const timeline = await query(
      `SELECT * FROM order_timeline WHERE order_id = ? ORDER BY created_at ASC`,
      [order.id]
    );

    res.json({
      success: true,
      data: {
        ...order,
        items,
        timeline
      }
    });
  } catch (err) {
    next(err);
  }
};

// Lấy danh sách đơn hàng của người dùng đã đăng nhập (có phân trang an toàn)
const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, offset } = getPagination(req.query.page, req.query.limit);

    const countRes = await get('SELECT COUNT(id) AS total FROM orders WHERE user_id = ?', [userId]);
    const total = countRes ? countRes.total : 0;

    const orders = await query(
      `SELECT id, order_code, subtotal, shipping_fee, discount_amount, total_amount, 
              payment_method, payment_status, order_status, created_at
       FROM orders 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    res.json(formatPaginationResponse(orders, total, page, limit));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getOrderTracking,
  getUserOrders
};
