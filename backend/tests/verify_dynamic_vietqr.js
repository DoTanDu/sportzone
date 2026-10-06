const http = require('http');
const jwt = require('jsonwebtoken');

const PORT = 5003;
process.env.PORT = PORT;
process.env.NODE_ENV = 'test';

const app = require('../src/server');
const { get, query, run } = require('../src/config/db');

// Helper gửi request HTTP
const request = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: `/api${path}`,
        method,
        headers: reqHeaders
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, text: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
};

async function runTests() {
  const server = app.listen(PORT, async () => {
    console.log(`\n==================================================`);
    console.log(`🧪 KIỂM THỬ TÍNH NĂNG MÃ QR ĐỘNG VIETQR & MOMO`);
    console.log(`==================================================\n`);

    try {
      // 1. Lấy hoặc tạo user test để lấy JWT token
      let user = await get('SELECT id, email, full_name FROM users WHERE role = "customer" LIMIT 1');
      if (!user) {
        user = await get('SELECT id, email, full_name FROM users LIMIT 1');
      }

      const secret = process.env.JWT_SECRET || 'sports_store_super_secret_jwt_key_2026';
      const token = jwt.sign(
        { id: user.id, email: user.email, role: 'customer', full_name: user.full_name },
        secret,
        { expiresIn: '1h' }
      );
      const authHeaders = { Authorization: `Bearer ${token}` };

      // 2. Lấy biến thể sản phẩm có sẵn trong kho
      const variant = await get('SELECT id, price, stock_quantity FROM product_variants WHERE stock_quantity >= 2 LIMIT 1');
      if (!variant) {
        throw new Error('Không có sản phẩm khả dụng trong kho để test!');
      }

      console.log(`1. Chuẩn bị biến thể sản phẩm #${variant.id} (Đơn giá: ${Number(variant.price).toLocaleString('vi-VN')} đ)...`);

      // 3. Test Đặt hàng qua VietQR Pay
      console.log('2. Đặt hàng mới với phương thức "banking" (VietQR Pay)...');
      const orderRes = await request('POST', '/orders', {
        receiver_name: 'Nguyễn Văn Test VietQR',
        receiver_phone: '0901234567',
        shipping_address: 'Tầng 10, Tòa nhà Bitexco, Q.1, TP.HCM',
        payment_method: 'banking',
        items: [{ variant_id: variant.id, quantity: 1 }]
      }, authHeaders);

      if (orderRes.status !== 201) {
        throw new Error('Đặt hàng thất bại: ' + JSON.stringify(orderRes.body));
      }

      const orderData = orderRes.body.data;
      console.log(`   ✅ Đặt hàng thành công! Mã đơn: ${orderData.order_code}`);
      console.log(`   - Tổng tiền: ${Number(orderData.total_amount).toLocaleString('vi-VN')} đ`);
      console.log(`   - Trạng thái thanh toán: ${orderData.payment_status}`);
      console.log(`   - URL VietQR Động: ${orderData.vietqr_url}`);

      // Kiểm tra tính chất ĐỘNG của mã VietQR
      if (!orderData.vietqr_url || !orderData.vietqr_url.includes('img.vietqr.io')) {
        throw new Error('Mã VietQR không phải link QuickLink động chuẩn VietQR.io!');
      }
      if (!orderData.vietqr_url.includes(orderData.order_code)) {
        throw new Error(`VietQR URL không chứa mã đơn hàng động (${orderData.order_code})!`);
      }
      if (!orderData.vietqr_url.includes(Math.round(orderData.total_amount).toString())) {
        throw new Error(`VietQR URL không chứa số tiền động (${orderData.total_amount})!`);
      }
      console.log('   ✅ PASS: Mã VietQR là MÃ ĐỘNG chứa chính xác số tiền và mã đơn hàng!\n');

      // 4. Test API kiểm tra trạng thái thanh toán (phục vụ Polling frontend)
      console.log('3. Kiểm tra API Polling trạng thái thanh toán (/api/orders/:code/payment-status)...');
      const statusBefore = await request('GET', `/orders/${orderData.order_code}/payment-status`);
      if (statusBefore.status !== 200) {
        throw new Error('API payment-status trả về lỗi: ' + JSON.stringify(statusBefore.body));
      }
      console.log(`   - is_paid ban đầu: ${statusBefore.body.data.is_paid}`);
      console.log(`   - payment_status ban đầu: ${statusBefore.body.data.payment_status}`);
      if (statusBefore.body.data.is_paid !== false || statusBefore.body.data.payment_status !== 'unpaid') {
        throw new Error('Trạng thái đơn mới tạo phải là unpaid!');
      }
      console.log('   ✅ PASS: Trạng thái ban đầu chính xác là "unpaid"!\n');

      // 5. Test API Xác nhận thanh toán (Xác nhận tiền về tài khoản)
      console.log('4. Kiểm tra API Xác nhận thanh toán (/api/orders/:code/confirm-payment)...');
      const confirmRes = await request('POST', `/orders/${orderData.order_code}/confirm-payment`, {
        note: 'Khách hàng quét mã VietQR thành công qua Techcombank Mobile'
      });
      if (confirmRes.status !== 200) {
        throw new Error('API confirm-payment thất bại: ' + JSON.stringify(confirmRes.body));
      }
      console.log(`   - Kết quả xác nhận: ${confirmRes.body.message}`);
      console.log(`   - payment_status sau xác nhận: ${confirmRes.body.data.payment_status}`);
      if (confirmRes.body.data.payment_status !== 'paid') {
        throw new Error('Sau khi xác nhận, payment_status phải là "paid"!');
      }
      console.log('   ✅ PASS: Xác nhận thanh toán thành công chuyển sang "paid"!\n');

      // 6. Test lại Polling sau khi đã thanh toán
      console.log('5. Kiểm tra lại API Polling sau khi đã thanh toán...');
      const statusAfter = await request('GET', `/orders/${orderData.order_code}/payment-status`);
      if (!statusAfter.body.data.is_paid || statusAfter.body.data.payment_status !== 'paid') {
        throw new Error('Polling phải trả về is_paid = true!');
      }
      console.log('   ✅ PASS: Polling phản hồi is_paid = true ngay lập tức!\n');

      // 7. Test Tra cứu đơn hàng (Tracking)
      console.log('6. Tra cứu hành trình đơn hàng (/api/orders/track/:code)...');
      const trackRes = await request('GET', `/orders/track/${orderData.order_code}`);
      if (trackRes.status !== 200) {
        throw new Error('Tra cứu đơn hàng thất bại: ' + JSON.stringify(trackRes.body));
      }
      const trackData = trackRes.body.data;
      console.log(`   - Trạng thái đơn: ${trackData.order_status}`);
      console.log(`   - Trạng thái thanh toán: ${trackData.payment_status}`);
      console.log(`   - Timeline có ${trackData.timeline.length} mốc sự kiện`);
      const paymentLog = trackData.timeline.find(t => t.note && t.note.includes('Techcombank Mobile'));
      if (!paymentLog) {
        throw new Error('Timeline chưa ghi nhận lịch sử xác nhận thanh toán!');
      }
      console.log(`   - Ghi nhận Timeline: "${paymentLog.note}"`);
      console.log('   ✅ PASS: Lịch sử thanh toán được lưu trữ toàn vẹn trong Timeline!\n');

      // 8. Test Phương thức MoMo QR Động
      console.log('7. Thử nghiệm đặt hàng bằng MoMo QR Động...');
        const otherVariant = await get('SELECT id FROM product_variants WHERE id != ? AND stock_quantity >= 2 LIMIT 1', [variant.id]);
        const targetVariantId = otherVariant ? otherVariant.id : variant.id;

        const momoOrderRes = await request('POST', '/orders', {
          receiver_name: 'Khách Hàng MoMo',
          receiver_phone: '0987654321',
          shipping_address: 'Quận Bình Thạnh, TP.HCM',
          payment_method: 'momo',
          items: [{ variant_id: targetVariantId, quantity: 2 }]
        }, authHeaders);

      if (momoOrderRes.status !== 201) {
        throw new Error('Đặt hàng MoMo thất bại: ' + JSON.stringify(momoOrderRes.body));
      }
      const momoData = momoOrderRes.body.data;
      console.log(`   - Mã đơn MoMo: ${momoData.order_code}`);
      console.log(`   - MoMo QR URL: ${momoData.momo_qr_url}`);
      if (!momoData.momo_qr_url || !momoData.momo_qr_url.includes(momoData.order_code)) {
        throw new Error('MoMo QR URL không chứa mã đơn hàng động!');
      }
      console.log('   ✅ PASS: Mã MoMo QR Động được sinh tự động chính xác!\n');

      console.log('==================================================');
      console.log('🎉 TẤT CẢ CÁC BÀI TEST THANH TOÁN MÃ QR ĐỘNG ĐỀU ĐẠT CHUẨN XUẤT SẮC!');
      console.log('==================================================\n');

      server.close();
      process.exit(0);
    } catch (err) {
      console.error('❌ LỖI KIỂM THỬ:', err.message);
      server.close();
      process.exit(1);
    }
  });
}

runTests();
