const { get, query, run } = require('../config/db');
const { getPagination, formatPaginationResponse } = require('../utils/pagination');

// 1. Khách hàng gửi đánh giá sản phẩm
const createReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { product_id, rating, comment = '', order_id = null } = req.body;

    const prodId = parseInt(product_id, 10);
    const starRating = parseInt(rating, 10);

    if (isNaN(prodId) || isNaN(starRating) || starRating < 1 || starRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Thông tin đánh giá không hợp lệ (điểm đánh giá từ 1 đến 5 sao).'
      });
    }

    const product = await get('SELECT id, name FROM products WHERE id = ? AND is_active = 1', [prodId]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm này.' });
    }

    // Kiểm tra xem khách hàng này đã từng mua sản phẩm này chưa (để gắn cờ is_verified_buyer)
    const purchaseCheck = await get(
      `SELECT oi.id 
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN product_variants pv ON oi.product_variant_id = pv.id
       WHERE o.user_id = ? AND pv.product_id = ? AND o.order_status IN ('delivered', 'processing', 'shipping', 'confirmed')`,
      [userId, prodId]
    );

    const isVerifiedBuyer = purchaseCheck ? 1 : 0;

    const result = await run(
      `INSERT INTO reviews (product_id, user_id, order_id, rating, comment, is_verified_buyer, status)
       VALUES (?, ?, ?, ?, ?, ?, 'approved')`,
      [prodId, userId, order_id || null, starRating, comment ? comment.trim() : null, isVerifiedBuyer]
    );

    res.status(201).json({
      success: true,
      message: 'Cảm ơn bạn đã gửi đánh giá cho sản phẩm!',
      data: {
        id: result.id,
        product_id: prodId,
        rating: starRating,
        comment,
        is_verified_buyer: isVerifiedBuyer,
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
};

// 2. Lấy danh sách đánh giá của sản phẩm cho trang chi tiết
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await query(
      `SELECT r.id, r.rating, r.comment, r.created_at, r.is_verified_buyer, u.full_name AS user_name, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND r.status = 'approved'
       ORDER BY r.created_at DESC`,
      [productId]
    );

    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
};

// 3. Admin: Lấy danh sách toàn bộ đánh giá để kiểm duyệt
const getAdminReviews = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query.page, req.query.limit);
    const { status } = req.query;

    let whereClause = '';
    let params = [];

    if (status && status.trim() !== '') {
      whereClause = 'WHERE r.status = ?';
      params.push(status.trim());
    }

    const countRes = await get(`SELECT COUNT(r.id) AS total FROM reviews r ${whereClause}`, params);
    const total = countRes ? countRes.total : 0;

    const reviews = await query(
      `SELECT r.*, p.name AS product_name, p.slug AS product_slug, u.full_name AS user_name, u.email AS user_email
       FROM reviews r
       JOIN products p ON r.product_id = p.id
       JOIN users u ON r.user_id = u.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json(formatPaginationResponse(reviews, total, page, limit));
  } catch (err) {
    next(err);
  }
};

// 4. Admin: Duyệt hoặc từ chối đánh giá
const updateReviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái đánh giá không hợp lệ.' });
    }

    await run('UPDATE reviews SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: `Đã cập nhật trạng thái đánh giá sang: ${status}` });
  } catch (err) {
    next(err);
  }
};

// 5. Admin: Xóa đánh giá vi phạm
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM reviews WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xóa đánh giá thành công.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getAdminReviews,
  updateReviewStatus,
  deleteReview
};
