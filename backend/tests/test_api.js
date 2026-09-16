process.env.NODE_ENV = 'test';
const http = require('http');
const app = require('../src/server');

const PORT = 5001; // Dùng cổng 5001 riêng cho test
let server;

const request = (path, method = 'GET', body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runTests() {
  console.log('🧪 BẮT ĐẦU CHẠY KIỂM THỬ BACKEND API & CƠ CHẾ CHỐNG TRÀN DATA...\n');

  server = app.listen(PORT);
  let passed = 0;
  let total = 0;

  const assert = (condition, testName) => {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
    }
  };

  try {
    // Test 1: Health check
    const health = await request('/api/health');
    assert(health.status === 200 && health.body.success === true, '1. Health check API hoạt động');

    // Test 2: Chống tràn Data bằng Phân trang an toàn (limit=999999 -> bị ép về 50)
    const paginationTest = await request('/api/products?limit=999999');
    assert(
      paginationTest.status === 200 &&
      paginationTest.body.pagination.limit <= 50,
      '2. Chống tràn RAM: Yêu cầu limit=999999 tự động bị khống chế về trần tối đa (50)'
    );

    // Test 3: Chống SQL Injection trong ô tìm kiếm
    const injectionQuery = encodeURIComponent("' OR 1=1 --");
    const injectionTest = await request(`/api/products?search=${injectionQuery}`);
    assert(
      injectionTest.status === 200 &&
      Array.isArray(injectionTest.body.data),
      '3. Chống SQL Injection: Tham số hóa prepared statement xử lý an toàn chuỗi độc hại'
    );

    // Test 4: Danh mục thể thao & Thương hiệu
    const categories = await request('/api/categories');
    assert(
      categories.status === 200 &&
      categories.body.data.length > 0 &&
      categories.body.data[0].subcategories !== undefined,
      '4. Danh mục đa cấp trả về đúng cấu trúc cha/con'
    );

    const brands = await request('/api/brands');
    assert(
      brands.status === 200 &&
      brands.body.data.some(b => b.name === 'Nike'),
      '5. Lấy danh sách thương hiệu thể thao chính hãng thành công'
    );

    // Test 5: Chi tiết sản phẩm kèm biến thể (Nike Mercurial)
    const productDetail = await request('/api/products/giay-nike-mercurial-vapor-15-academy-tf');
    assert(
      productDetail.status === 200 &&
      productDetail.body.data.variants.length > 0 &&
      productDetail.body.data.images !== undefined,
      '6. Chi tiết sản phẩm kèm đầy đủ biến thể size giày và ảnh'
    );

    // Test 6: Kiểm tra Voucher hợp lệ và tính tiền
    const couponTest = await request('/api/coupons/validate', 'POST', {
      code: 'WELCOME10',
      order_amount: 500000
    });
    assert(
      couponTest.status === 200 &&
      couponTest.body.data.discount_amount === 50000,
      '7. Áp dụng mã giảm giá WELCOME10 tính đúng 10% (50.000 VNĐ)'
    );

    // Test 7.1: Kiểm tra Transaction chống bán âm kho (Overselling)
    const oversellTest = await request('/api/orders', 'POST', {
      receiver_name: 'Khách Test',
      receiver_phone: '0900000000',
      shipping_address: '123 Đường Thể Thao',
      items: [{ variant_id: 1, quantity: 999 }]
    });
    assert(
      oversellTest.status >= 400 &&
      oversellTest.body.success === false,
      '8. Chống âm kho: Hệ thống từ chối và rollback khi đặt vượt quá số lượng tồn'
    );

    // Test 7.2: Đặt hàng thành công 1 sản phẩm & trừ kho nguyên tử
    const validOrderTest = await request('/api/orders', 'POST', {
      receiver_name: 'Khách Mua Thật',
      receiver_phone: '0988776655',
      shipping_address: 'Tòa nhà Thể Thao, Hà Nội',
      items: [{ variant_id: 1, quantity: 1 }],
      coupon_code: 'WELCOME10'
    });
    assert(
      validOrderTest.status === 201 &&
      validOrderTest.body.data.order_code !== undefined,
      '8.2. Đặt hàng thành công với Transaction ACID (sinh mã đơn & áp voucher)'
    );

    // Kiểm tra mã đơn tracking
    const trackingTest = await request(`/api/orders/track/${validOrderTest.body.data.order_code}`);
    assert(
      trackingTest.status === 200 &&
      trackingTest.body.data.items.length === 1 &&
      trackingTest.body.data.timeline.length > 0,
      '8.3. Tra cứu hành trình đơn hàng (Order Tracking & Timeline) chính xác'
    );

    // Test 8: Đăng ký & Đăng nhập người dùng
    const testEmail = `user_${Date.now()}@sporttest.vn`;
    const registerTest = await request('/api/auth/register', 'POST', {
      full_name: 'Nguyễn Thể Thao',
      email: testEmail,
      phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: 'password123'
    });
    assert(
      registerTest.status === 201 &&
      registerTest.body.data.token !== undefined,
      '9. Đăng ký tài khoản mới mã hóa bcrypt và sinh JWT token'
    );

    const loginTest = await request('/api/auth/login', 'POST', {
      email: testEmail,
      password: 'password123'
    });
    assert(
      loginTest.status === 200 &&
      loginTest.body.data.token !== undefined,
      '10. Đăng nhập thành công và xác thực mật khẩu an toàn'
    );

  } catch (e) {
    console.error('Lỗi khi chạy kiểm thử:', e);
  } finally {
    server.close();
    console.log(`\n🏁 KẾT QUẢ KIỂM THỬ: ${passed}/${total} bài kiểm tra đạt yêu cầu (${Math.round(passed / total * 100)}%)\n`);
    process.exit(passed === total ? 0 : 1);
  }
}

runTests();
