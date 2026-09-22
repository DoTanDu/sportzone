const { get, query, run } = require('../config/db');

// 1. Lấy danh sách sản phẩm yêu thích của người dùng
const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const items = await query(
      `SELECT 
        w.id AS wishlist_id,
        w.created_at AS added_at,
        p.id AS product_id,
        p.name,
        p.slug,
        p.sku,
        p.thumbnail_url,
        p.base_price,
        p.is_active,
        c.name AS category_name,
        b.name AS brand_name,
        COALESCE(SUM(v.stock_quantity), 0) AS total_stock
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       JOIN brands b ON p.brand_id = b.id
       LEFT JOIN product_variants v ON p.id = v.product_id AND v.is_active = 1
       WHERE w.user_id = ?
       GROUP BY p.id
       ORDER BY w.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: items,
      count: items.length
    });
  } catch (err) {
    next(err);
  }
};

// 2. Thêm hoặc Bỏ yêu thích sản phẩm (Toggle)
const toggleWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = parseInt(req.params.productId, 10);

    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ.' });
    }

    const product = await get('SELECT id, name FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm này.' });
    }

    const existing = await get(
      'SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existing) {
      await run('DELETE FROM wishlists WHERE id = ?', [existing.id]);
      return res.json({
        success: true,
        in_wishlist: false,
        message: `Đã xóa "${product.name}" khỏi danh sách yêu thích.`
      });
    } else {
      await run(
        'INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)',
        [userId, productId]
      );
      return res.json({
        success: true,
        in_wishlist: true,
        message: `Đã thêm "${product.name}" vào danh sách yêu thích.`
      });
    }
  } catch (err) {
    next(err);
  }
};

// 3. Lấy danh sách ID các sản phẩm người dùng đã thích (phục vụ hiển thị icon tim)
const getWishlistIds = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return res.json({ success: true, data: [] });
    }

    const rows = await query('SELECT product_id FROM wishlists WHERE user_id = ?', [userId]);
    const ids = rows.map(r => r.product_id);
    res.json({ success: true, data: ids });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWishlist,
  toggleWishlist,
  getWishlistIds
};
