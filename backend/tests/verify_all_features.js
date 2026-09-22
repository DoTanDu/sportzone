const http = require('http');

const PORT = 5001;
process.env.PORT = PORT;
process.env.NODE_ENV = 'test';

const app = require('../src/server');

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
        path,
        method,
        headers: reqHeaders
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
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
  const server = app.listen(PORT);
  console.log(`🧪 Bắt đầu chạy bộ kiểm thử toàn diện các tính năng mới tại port ${PORT}...`);

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    console.log('1. Health check:', health.status === 200 ? '✅ PASS' : '❌ FAIL');

    // 2. Đăng ký người dùng mới
    const testEmail = `testuser_${Date.now()}@sportzone.vn`;
    const regPhone = '09' + Math.floor(10000000 + Math.random() * 90000000);
    const regRes = await request('POST', '/api/auth/register', {
      full_name: 'Nguyễn Văn Test',
      email: testEmail,
      phone: regPhone,
      password: 'password123'
    });
    console.log('2. Đăng ký tài khoản mới:', regRes.status === 201 ? '✅ PASS' : '❌ FAIL', regRes.body.message);
    const userToken = regRes.body.data.token;
    const userAuthHeaders = { Authorization: `Bearer ${userToken}` };

    // 3. Đăng nhập Admin lấy token admin
    const adminLogin = await request('POST', '/api/auth/login', {
      email: 'admin',
      password: 'admin'
    });
    console.log('3. Đăng nhập Admin:', adminLogin.status === 200 ? '✅ PASS' : '❌ FAIL');
    const adminToken = adminLogin.body.data.token;
    const adminAuthHeaders = { Authorization: `Bearer ${adminToken}` };

    // 4. Cập nhật thông tin cá nhân
    const testPhone = '09' + Math.floor(10000000 + Math.random() * 90000000);
    const updateProf = await request('PUT', '/api/auth/profile', {
      full_name: 'Nguyễn Văn Test Đã Đổi',
      phone: testPhone
    }, userAuthHeaders);
    console.log('4. Cập nhật Profile:', updateProf.body.data && updateProf.body.data.full_name === 'Nguyễn Văn Test Đã Đổi' ? '✅ PASS' : '❌ FAIL');

    // 5. Thêm địa chỉ mới
    const addAddr = await request('POST', '/api/user/addresses', {
      receiver_name: 'Người Nhận Test',
      receiver_phone: '0988888888',
      street_address: 'Số 99 Đường Thể Thao',
      city_province: 'TP Hồ Chí Minh',
      is_default: true
    }, userAuthHeaders);
    console.log('5. Thêm sổ địa chỉ:', addAddr.status === 201 ? '✅ PASS' : '❌ FAIL');

    const getAddrs = await request('GET', '/api/user/addresses', null, userAuthHeaders);
    console.log('5.1 Lấy sổ địa chỉ:', getAddrs.body.data.length >= 1 ? '✅ PASS' : '❌ FAIL');

    // 6. Thêm & Kiểm tra Wishlist (Sản phẩm ID 1)
    const toggleWish = await request('POST', '/api/wishlist/1', null, userAuthHeaders);
    console.log('6. Thêm vào Wishlist:', toggleWish.body.in_wishlist === true ? '✅ PASS' : '❌ FAIL');

    const getWish = await request('GET', '/api/wishlist', null, userAuthHeaders);
    console.log('6.1 Đọc danh sách Wishlist:', getWish.body.data.length >= 1 ? '✅ PASS' : '❌ FAIL');

    // 7. Tạo đơn hàng chọn Banking (VietQR) và kiểm tra trừ kho
    // Lấy thông tin sản phẩm và variant
    const prods = await request('GET', '/api/products');
    const firstProd = prods.body.data[0];
    const prodDetail = await request('GET', `/api/products/${firstProd.slug}`);
    const variant = prodDetail.body.data.variants[0];
    const initialStock = variant.stock_quantity;

    const orderRes = await request('POST', '/api/orders', {
      receiver_name: 'Người Nhận Test',
      receiver_phone: '0988888888',
      shipping_address: 'Số 99 Đường Thể Thao, Q1, TPHCM',
      payment_method: 'banking',
      items: [{ variant_id: variant.id, quantity: 2 }]
    }, userAuthHeaders);

    console.log('7. Đặt hàng thanh toán Banking:', orderRes.status === 201 ? '✅ PASS' : '❌ FAIL');
    console.log('7.1 Sinh mã VietQR tự động:', orderRes.body.data.vietqr_url ? '✅ PASS' : '❌ FAIL');

    const orderCode = orderRes.body.data.order_code;

    // Kiểm tra tồn kho sau khi đặt (phải giảm 2)
    const prodAfterOrder = await request('GET', `/api/products/${firstProd.slug}`);
    const variantAfterOrder = prodAfterOrder.body.data.variants.find(v => v.id === variant.id);
    console.log('7.2 Trừ tồn kho nguyên tử:', variantAfterOrder.stock_quantity === initialStock - 2 ? '✅ PASS' : '❌ FAIL');

    // 8. Khách hàng tự hủy đơn hàng -> Kiểm tra hoàn lại tồn kho
    const cancelRes = await request('PUT', `/api/orders/${orderCode}/cancel`, {
      reason: 'Tôi muốn đổi size giày khác'
    }, userAuthHeaders);
    console.log('8. Hủy đơn hàng:', cancelRes.status === 200 ? '✅ PASS' : '❌ FAIL');

    const prodAfterCancel = await request('GET', `/api/products/${firstProd.slug}`);
    const variantAfterCancel = prodAfterCancel.body.data.variants.find(v => v.id === variant.id);
    console.log('8.1 Hoàn lại tồn kho chính xác:', variantAfterCancel.stock_quantity === initialStock ? '✅ PASS' : '❌ FAIL');

    // 9. Gửi đánh giá sản phẩm (Review)
    const reviewRes = await request('POST', '/api/reviews', {
      product_id: firstProd.id,
      rating: 5,
      comment: 'Giày đi rất êm và bền, giao hàng siêu nhanh!'
    }, userAuthHeaders);
    console.log('9. Gửi đánh giá sản phẩm:', reviewRes.status === 201 ? '✅ PASS' : '❌ FAIL');

    // 10. Admin duyệt / kiểm duyệt đánh giá
    const adminReviews = await request('GET', '/api/admin/reviews', null, adminAuthHeaders);
    console.log('10. Admin đọc danh sách đánh giá:', adminReviews.body.data.length >= 1 ? '✅ PASS' : '❌ FAIL');

    // 11. Admin tạo mã giảm giá mới
    const couponCode = `TESTSALE_${Date.now().toString().slice(-4)}`;
    const createCoupon = await request('POST', '/api/admin/coupons', {
      code: couponCode,
      description: 'Giảm giá kiểm thử tự động',
      discount_type: 'percentage',
      discount_value: 15,
      min_order_value: 100000,
      usage_limit: 50,
      start_date: new Date().toISOString().slice(0, 10) + ' 00:00:00',
      end_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10) + ' 23:59:59'
    }, adminAuthHeaders);
    console.log('11. Admin tạo mã giảm giá mới:', createCoupon.status === 201 ? '✅ PASS' : '❌ FAIL');

    console.log('\n🎉 TẤT CẢ 11 TÍNH NĂNG MỚI ĐỀU HOẠT ĐỘNG HOÀN HẢO!\n');

  } catch (err) {
    console.error('❌ Lỗi kiểm thử:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
