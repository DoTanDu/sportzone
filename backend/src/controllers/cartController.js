const { query, get, run } = require('../config/db');

// Helper tìm hoặc tạo giỏ hàng theo user_id hoặc session_id kèm tự động Merge khi đăng nhập
const getOrCreateCart = async (userId, sessionId) => {
  let cart = null;

  if (userId) {
    // 1. Tìm giỏ hàng theo user_id
    cart = await get('SELECT id FROM carts WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);

    if (!cart) {
      // Nếu chưa có giỏ theo user, kiểm tra xem session vãng lai hiện tại có giỏ không để chuyển cho user
      if (sessionId) {
        cart = await get('SELECT id FROM carts WHERE session_id = ? AND user_id IS NULL ORDER BY id DESC LIMIT 1', [sessionId]);
        if (cart) {
          await run('UPDATE carts SET user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [userId, cart.id]);
        }
      }
      if (!cart) {
        const result = await run(
          'INSERT INTO carts (user_id, session_id) VALUES (?, ?)',
          [userId, sessionId || null]
        );
        return result.id;
      }
    } else {
      // Giỏ của user đã có trong hệ thống.
      if (sessionId) {
        // Nếu trước khi đăng nhập, khách có nhặt đồ vào giỏ vãng lai, gộp vào giỏ của user
        const guestCart = await get('SELECT id FROM carts WHERE session_id = ? AND user_id IS NULL AND id != ? ORDER BY id DESC LIMIT 1', [sessionId, cart.id]);
        if (guestCart) {
          const guestItems = await query('SELECT product_variant_id, quantity FROM cart_items WHERE cart_id = ?', [guestCart.id]);
          for (const item of guestItems) {
            const existing = await get('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_variant_id = ?', [cart.id, item.product_variant_id]);
            if (existing) {
              await run('UPDATE cart_items SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [item.quantity, existing.id]);
            } else {
              await run('INSERT INTO cart_items (cart_id, product_variant_id, quantity) VALUES (?, ?, ?)', [cart.id, item.product_variant_id, item.quantity]);
            }
          }
          // Xóa giỏ vãng lai sau khi gộp xong
          await run('DELETE FROM cart_items WHERE cart_id = ?', [guestCart.id]);
          await run('DELETE FROM carts WHERE id = ?', [guestCart.id]);
        }
      }
    }
    return cart.id;
  }

  // 2. Trường hợp Khách vãng lai (Chưa đăng nhập hoặc vừa ĐĂNG XUẤT ra):
  // Chỉ tìm giỏ hàng vãng lai (BẮT BUỘC user_id IS NULL). Tuyệt đối KHÔNG gán giỏ của tài khoản cho khách vãng lai!
  if (sessionId) {
    cart = await get('SELECT id FROM carts WHERE session_id = ? AND user_id IS NULL ORDER BY updated_at DESC, id DESC LIMIT 1', [sessionId]);

    if (!cart) {
      const result = await run(
        'INSERT INTO carts (user_id, session_id) VALUES (NULL, ?)',
        [sessionId]
      );
      return result.id;
    }
    return cart.id;
  }

  const result = await run('INSERT INTO carts (user_id, session_id) VALUES (NULL, NULL)');
  return result.id;
};

// Lấy thông tin chi tiết giỏ hàng
const getCart = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.query.session_id;

    if (!userId && !sessionId) {
      return res.json({ success: true, data: { items: [], subtotal: 0, total_items: 0 } });
    }

    const cartId = await getOrCreateCart(userId, sessionId);

    const items = await query(
      `SELECT 
        ci.id AS cart_item_id,
        ci.quantity,
        pv.id AS variant_id,
        pv.sku_variant,
        pv.size,
        pv.color,
        pv.price,
        pv.compare_at_price,
        pv.stock_quantity,
        p.id AS product_id,
        p.name AS product_name,
        p.slug AS product_slug,
        COALESCE(pv.image_url, p.thumbnail_url) AS image_url,
        (ci.quantity * pv.price) AS line_total
       FROM cart_items ci
       JOIN product_variants pv ON ci.product_variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       WHERE ci.cart_id = ? AND pv.is_active = 1 AND p.is_active = 1
       ORDER BY ci.id DESC`,
      [cartId]
    );

    let subtotal = 0;
    let totalItems = 0;
    items.forEach(item => {
      subtotal += item.line_total;
      totalItems += item.quantity;
    });

    res.json({
      success: true,
      data: {
        cart_id: cartId,
        items,
        subtotal,
        total_items: totalItems
      }
    });
  } catch (err) {
    next(err);
  }
};

// Thêm sản phẩm biến thể vào giỏ hàng
const addToCart = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.body.session_id;
    const { variant_id, quantity = 1 } = req.body;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Số lượng thêm vào giỏ không hợp lệ.' });
    }

    // Kiểm tra biến thể và tồn kho
    const variant = await get(
      `SELECT pv.id, pv.stock_quantity, p.name 
       FROM product_variants pv 
       JOIN products p ON pv.product_id = p.id 
       WHERE pv.id = ? AND pv.is_active = 1`,
      [variant_id]
    );

    if (!variant) {
      return res.status(404).json({ success: false, message: 'Biến thể sản phẩm không tồn tại.' });
    }

    const cartId = await getOrCreateCart(userId, sessionId);

    // Kiểm tra xem mặt hàng đã có trong giỏ chưa
    const existingItem = await get(
      'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_variant_id = ?',
      [cartId, variant_id]
    );

    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    const newQty = currentQtyInCart + qty;

    if (newQty > variant.stock_quantity) {
      return res.status(400).json({
        success: false,
        message: `Sản phẩm "${variant.name}" trong kho chỉ còn ${variant.stock_quantity} món (Bạn đã có ${currentQtyInCart} trong giỏ).`
      });
    }

    if (existingItem) {
      await run(
        'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newQty, existingItem.id]
      );
    } else {
      await run(
        'INSERT INTO cart_items (cart_id, product_variant_id, quantity) VALUES (?, ?, ?)',
        [cartId, variant_id, qty]
      );
    }

    res.json({
      success: true,
      message: 'Đã thêm sản phẩm thể thao vào giỏ hàng thành công.'
    });
  } catch (err) {
    next(err);
  }
};

// Cập nhật số lượng mặt hàng trong giỏ
const updateCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (isNaN(qty) || qty <= 0) {
      // Nếu số lượng <= 0, tự động xóa khỏi giỏ
      await run('DELETE FROM cart_items WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Đã xóa mặt hàng khỏi giỏ hàng.' });
    }

    const cartItem = await get(
      `SELECT ci.id, pv.stock_quantity, p.name
       FROM cart_items ci
       JOIN product_variants pv ON ci.product_variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       WHERE ci.id = ?`,
      [id]
    );

    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Mặt hàng trong giỏ không tồn tại.' });
    }

    if (qty > cartItem.stock_quantity) {
      return res.status(400).json({
        success: false,
        message: `Số lượng yêu cầu vượt quá tồn kho hiện có (${cartItem.stock_quantity}).`
      });
    }

    await run('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [qty, id]);

    res.json({ success: true, message: 'Đã cập nhật số lượng thành công.' });
  } catch (err) {
    next(err);
  }
};

// Xóa mặt hàng khỏi giỏ
const removeCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM cart_items WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xóa mặt hàng khỏi giỏ.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem
};
