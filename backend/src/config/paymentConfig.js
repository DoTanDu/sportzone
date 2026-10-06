const dotenv = require('dotenv');
dotenv.config();

/**
 * Cấu hình thông tin thanh toán VietQR và MoMo
 * Cho phép ghi đè linh hoạt qua biến môi trường (.env)
 */
const paymentConfig = {
  vietqr: {
    // Mã ngân hàng theo chuẩn Napas/VietQR (TCB: Techcombank, VCB: Vietcombank, MB: MBBank, v.v.)
    bankId: process.env.VIETQR_BANK_ID || 'TCB',
    bankName: process.env.VIETQR_BANK_NAME || 'Techcombank (Ngân hàng TMCP Kỹ Thương Việt Nam)',
    accountNo: process.env.VIETQR_ACCOUNT_NO || '19072002464014',
    accountName: process.env.VIETQR_ACCOUNT_NAME || 'SPORTZONE',
    // Template hiển thị: 'compact2' (chuẩn đầy đủ logo và thông tin), 'compact', 'qr_only'
    template: process.env.VIETQR_TEMPLATE || 'compact2'
  },
  momo: {
    phone: process.env.MOMO_PHONE || '0363332841',
    accountName: process.env.MOMO_ACCOUNT_NAME || process.env.MOMO_NAME || 'Đỗ Tấn Du'
  }
};

/**
 * Sinh URL mã QR VietQR động theo chuẩn QuickLink NAPAS 24/7 (VietQR.io)
 * Tự động gắn số tiền chính xác và mã đơn hàng làm nội dung chuyển khoản
 * 
 * @param {Object} params
 * @param {number} params.amount Số tiền thanh toán của đơn hàng
 * @param {string} params.orderCode Mã đơn hàng
 * @param {string} [params.accountName] Tên tài khoản người nhận
 * @returns {string} URL ảnh mã QR động
 */
function generateVietQRUrl({ amount, orderCode, accountName = paymentConfig.vietqr.accountName }) {
  const { bankId, accountNo, template } = paymentConfig.vietqr;
  const roundedAmount = Math.max(0, Math.round(Number(amount) || 0));
  const cleanOrderCode = encodeURIComponent((orderCode || '').trim());
  const cleanAccountName = encodeURIComponent((accountName || '').trim().toUpperCase());

  // Link Quicklink VietQR chính thức theo chuẩn ngân hàng Việt Nam
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${roundedAmount}&addInfo=${cleanOrderCode}&accountName=${cleanAccountName}`;
}

/**
 * Sinh URL mã MoMo QR động
 * 
 * @param {Object} params
 * @param {number} params.amount Số tiền
 * @param {string} params.orderCode Mã đơn hàng
 * @returns {string} URL ảnh mã QR MoMo
 */
function generateMomoQRUrl({ amount, orderCode }) {
  const { phone, accountName } = paymentConfig.momo;
  const roundedAmount = Math.max(0, Math.round(Number(amount) || 0));
  const cleanOrderCode = (orderCode || '').trim();
  const momoData = `2|99|${phone}|${accountName}||0|0|${roundedAmount}|${cleanOrderCode}|transfer_myqr`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(momoData)}`;
}

/**
 * Lấy thông tin cấu hình công khai phục vụ frontend
 */
function getPublicPaymentConfig() {
  return {
    vietqr: {
      bankId: paymentConfig.vietqr.bankId,
      bankName: paymentConfig.vietqr.bankName,
      accountNo: paymentConfig.vietqr.accountNo,
      accountName: paymentConfig.vietqr.accountName,
      template: paymentConfig.vietqr.template
    },
    momo: {
      phone: paymentConfig.momo.phone,
      accountName: paymentConfig.momo.accountName
    }
  };
}

module.exports = {
  paymentConfig,
  generateVietQRUrl,
  generateMomoQRUrl,
  getPublicPaymentConfig
};
