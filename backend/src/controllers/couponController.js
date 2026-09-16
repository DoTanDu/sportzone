const { get } = require('../config/db');

// Kiểm tra mã giảm giá và tính toán số tiền chiết khấu
const validateCoupon = async (req, res, next) => {
  try {
    const { code, order_amount = 0 } = req.body;

    if (!code || code.trim() === '') {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const amount = Number(order_amount);

    const coupon = await get(
      `SELECT * FROM coupons 
       WHERE code = ? AND is_active = 1`,
      [cleanCode]
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa.'
      });
    }

    const now = new Date();
    const startDate = new Date(coupon.start_date);
    const endDate = new Date(coupon.end_date);

    if (now < startDate || now > endDate) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá đã hết hạn sử dụng.'
      });
    }

    if (coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá đã hết lượt sử dụng.'
      });
    }

    if (amount < coupon.min_order_value) {
      return res.status(400).json({
        success: false,
        message: `Mã này chỉ áp dụng cho đơn hàng từ ${Number(coupon.min_order_value).toLocaleString('vi-VN')} VNĐ trở lên.`
      });
    }

    // Tính toán số tiền giảm
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (amount * coupon.discount_value) / 100;
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else if (coupon.discount_type === 'fixed_amount') {
      discountAmount = coupon.discount_value;
    }

    // Số tiền giảm không thể vượt quá giá trị đơn hàng
    if (discountAmount > amount) {
      discountAmount = amount;
    }

    res.json({
      success: true,
      message: 'Áp dụng mã giảm giá thành công!',
      data: {
        coupon_id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_amount: Math.round(discountAmount),
        final_amount: Math.max(0, Math.round(amount - discountAmount))
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  validateCoupon
};
