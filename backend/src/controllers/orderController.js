const { get, query, run, transaction } = require('../config/db');
const { getPagination, formatPaginationResponse } = require('../utils/pagination');

// Bộ đệm chống spam / double-click đặt trùng đơn
const recentOrdersCache = new Map();

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
    const sessionId = req.headers['x-session-id'] || req.body.session_id;
    const {
      receiver_name,
      receiver_phone,
      shipping_address,
      items,
      coupon_code,
      payment_method = 'cod',
      note = ''
    } = req.body;

    // Bắt buộc người dùng phải đăng nhập tài khoản mới được thanh toán
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập tài khoản trước khi tiến hành thanh toán đơn hàng.'
      });
    }

    // Chống double-click tạo 2 đơn trùng lặp
    const idempotencyKey = `${userId || req.headers['x-session-id'] || receiver_phone}_${JSON.stringify(items || [])}`;
    const now = Date.now();
    if (recentOrdersCache.has(idempotencyKey)) {
      const lastTime = recentOrdersCache.get(idempotencyKey);
      if (now - lastTime < 5000) {
        return res.status(429).json({
          success: false,
          message: 'Đơn hàng của bạn đang được xử lý, vui lòng không nhấn đặt hàng liên tục!'
        });
      }
    }
    recentOrdersCache.set(idempotencyKey, now);
    if (recentOrdersCache.size > 1000) {
      for (const [k, time] of recentOrdersCache.entries()) {
        if (now - time > 60000) recentOrdersCache.delete(k);
      }
    }

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
            // Kiểm tra xem khách hàng này đã dùng mã này trước đó chưa
            if (userId) {
              const alreadyUsed = await get(
                'SELECT id FROM coupon_usages WHERE user_id = ? AND coupon_id = ?',
                [userId, coupon.id]
              );
              if (alreadyUsed) {
                throw new Error(`Bạn đã sử dụng mã giảm giá "${coupon.code}" cho đơn hàng trước.`);
              }
            }

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

      // Lưu lịch sử sử dụng voucher theo user
      if (couponId && userId) {
        await run(
          'INSERT INTO coupon_usages (coupon_id, user_id, order_id) VALUES (?, ?, ?)',
          [couponId, userId, orderId]
        );
      }

      // 5. Lưu chi tiết sản phẩm đơn hàng & ghi log biến động kho
      for (const item of verifiedItems) {
        await run(
          `INSERT INTO order_items (order_id, product_variant_id, product_name, variant_label, unit_price, quantity, total_price)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [orderId, item.product_variant_id, item.product_name, item.variant_label, item.unit_price, item.quantity, item.total_price]
        );

        // Ghi log biến động xuất kho bán hàng
        const currVariant = await get('SELECT stock_quantity FROM product_variants WHERE id = ?', [item.product_variant_id]);
        const currentStock = currVariant ? currVariant.stock_quantity : 0;
        await run(
          `INSERT INTO inventory_logs (product_variant_id, change_type, quantity_change, previous_quantity, new_quantity, reference_id, note)
           VALUES (?, 'order_sale', ?, ?, ?, ?, ?)`,
          [item.product_variant_id, -item.quantity, currentStock + item.quantity, currentStock, orderCode, `Bán theo đơn ${orderCode}`]
        );
      }

      // 6. Ghi log lịch sử hành trình đơn hàng
      await run(
        `INSERT INTO order_timeline (order_id, status, note, created_by)
         VALUES (?, 'pending', 'Khách hàng đặt đơn hàng mới thành công', 'Hệ thống')`,
        [orderId]
      );

      // 7. Tạo mã QR thanh toán động (VietQR hoặc MoMo)
      let vietQrUrl = null;
      let momoQrUrl = null;
      let momoPayload = null;

      if (payment_method === 'banking') {
        const bankAccount = '19072002464014';
        const bankName = 'TCB'; // Ngân hàng Techcombank
        const accountHolder = 'Sportzone';
        vietQrUrl = 'assets/images/qr_vietqr.png';

        await run(
          `INSERT INTO payment_transactions (order_id, gateway, transaction_code, amount, status, payment_url)
           VALUES (?, 'vietqr', ?, ?, 'pending', ?)`,
          [orderId, orderCode, totalAmount, vietQrUrl]
        );
      } else if (payment_method === 'momo') {
        const momoPhone = '0987654321';
        const momoReceiver = 'Sportzone';
        momoQrUrl = 'assets/images/qr_momo.png';
        momoPayload = {
          phone: momoPhone,
          receiver: momoReceiver,
          amount: totalAmount,
          order_code: orderCode,
          qr_url: momoQrUrl,
          deep_link: `momo://?action=payWithApp&amount=${totalAmount}&note=${encodeURIComponent(orderCode)}`
        };

        await run(
          `INSERT INTO payment_transactions (order_id, gateway, transaction_code, amount, status, payment_url)
           VALUES (?, 'momo', ?, ?, 'pending', ?)`,
          [orderId, orderCode, totalAmount, momoQrUrl]
        );
      }

      // 8. Dọn sạch giỏ hàng của user/session sau khi đặt thành công
      let targetCart = null;
      if (userId) {
        targetCart = await get('SELECT id FROM carts WHERE user_id = ?', [userId]);
      } else if (sessionId) {
        targetCart = await get('SELECT id FROM carts WHERE session_id = ? ORDER BY updated_at DESC LIMIT 1', [sessionId]);
      }
      if (targetCart) {
        await run('DELETE FROM cart_items WHERE cart_id = ?', [targetCart.id]);
      }

      return {
        order_id: orderId,
        order_code: orderCode,
        total_amount: totalAmount,
        subtotal,
        shipping_fee: shippingFee,
        discount_amount: discountAmount,
        items_count: verifiedItems.length,
        payment_method,
        vietqr_url: vietQrUrl,
        momo_qr_url: momoQrUrl,
        momo_payload: momoPayload
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
      `SELECT oi.*, pv.image_url, p.thumbnail_url, p.id AS product_id, p.slug AS product_slug
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

    const transaction = await get(
      `SELECT * FROM payment_transactions WHERE order_id = ? ORDER BY id DESC LIMIT 1`,
      [order.id]
    );

    res.json({
      success: true,
      data: {
        ...order,
        items,
        timeline,
        payment_transaction: transaction
      }
    });
  } catch (err) {
    next(err);
  }
};

// Lấy danh sách đơn hàng của người dùng đã đăng nhập (kèm sản phẩm đại diện)
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

    // Kèm theo danh sách chi tiết các mặt hàng cho từng đơn
    for (const ord of orders) {
      ord.items = await query(
        `SELECT oi.*, p.id AS product_id, p.slug AS product_slug, COALESCE(pv.image_url, p.thumbnail_url) AS image_url
         FROM order_items oi
         LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
         LEFT JOIN products p ON pv.product_id = p.id
         WHERE oi.order_id = ?`,
        [ord.id]
      );
    }

    res.json(formatPaginationResponse(orders, total, page, limit));
  } catch (err) {
    next(err);
  }
};

// Khách hàng tự hủy đơn hàng (chỉ khi đơn hàng còn ở trạng thái pending)
const cancelUserOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { code } = req.params;
    const { reason = 'Khách hàng thay đổi ý định' } = req.body;

    const order = await get(
      'SELECT id, order_code, order_status, user_id FROM orders WHERE order_code = ?',
      [code.trim()]
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng này.' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền hủy đơn hàng này.' });
    }

    if (order.order_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng đang ở trạng thái "${order.order_status}", không thể tự hủy. Vui lòng liên hệ hotline hỗ trợ.`
      });
    }

    await transaction(async ({ run, query, get }) => {
      // 1. Cập nhật trạng thái đơn sang cancelled
      await run(
        "UPDATE orders SET order_status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [order.id]
      );

      // 2. Lấy danh sách sản phẩm để hoàn kho
      const items = await query(
        'SELECT product_variant_id, quantity FROM order_items WHERE order_id = ?',
        [order.id]
      );

      for (const item of items) {
        if (item.product_variant_id) {
          const variant = await get(
            'SELECT product_id, stock_quantity FROM product_variants WHERE id = ?',
            [item.product_variant_id]
          );

          if (variant) {
            // Cộng lại kho
            await run(
              'UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?',
              [item.quantity, item.product_variant_id]
            );

            // Giảm sold_count của sản phẩm
            await run(
              'UPDATE products SET sold_count = CASE WHEN sold_count >= ? THEN sold_count - ? ELSE 0 END WHERE id = ?',
              [item.quantity, item.quantity, variant.product_id]
            );

            // Ghi log hoàn kho
            await run(
              `INSERT INTO inventory_logs (product_variant_id, change_type, quantity_change, previous_quantity, new_quantity, reference_id, note, created_by)
               VALUES (?, 'order_cancel_restock', ?, ?, ?, ?, ?, 'Khách hàng')`,
              [
                item.product_variant_id,
                item.quantity,
                variant.stock_quantity,
                variant.stock_quantity + item.quantity,
                order.order_code,
                `Hoàn kho do khách hủy đơn: ${reason}`
              ]
            );
          }
        }
      }

      // 3. Ghi vào timeline
      await run(
        `INSERT INTO order_timeline (order_id, status, note, created_by)
         VALUES (?, 'cancelled', ?, 'Khách hàng')`,
        [order.id, `Khách hủy đơn hàng: ${reason}`]
      );
    });

    res.json({
      success: true,
      message: `Đơn hàng ${order.order_code} đã được hủy thành công và hoàn trả tồn kho.`
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getOrderTracking,
  getUserOrders,
  cancelUserOrder
};
