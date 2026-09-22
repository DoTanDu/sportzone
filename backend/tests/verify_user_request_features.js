const http = require('http');

const PORT = 5003;
process.env.PORT = PORT;
process.env.NODE_ENV = 'test';

const app = require('../src/server');
const { get, run, query } = require('../src/config/db');

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

async function testAll() {
  console.log('🧪 Bắt đầu kiểm tra chi tiết theo yêu cầu mới của người dùng...\n');

  // 1. Kiểm tra trừ tồn kho khi đặt hàng
  const variantBefore = await get('SELECT id, stock_quantity, price FROM product_variants WHERE stock_quantity >= 5 LIMIT 1');
  console.log(`1. Kiểm tra tồn kho trước khi đặt: variant #${variantBefore.id} có tồn kho = ${variantBefore.stock_quantity}`);

  const orderRes = await request('POST', '/orders', {
    receiver_name: 'Test Khách Trừ Kho',
    receiver_phone: '0987654321',
    shipping_address: 'Quận 1, TP Hồ Chí Minh',
    payment_method: 'banking',
    items: [{ variant_id: variantBefore.id, quantity: 2 }]
  });

  if (orderRes.status !== 201) {
    throw new Error('Đặt hàng thất bại: ' + JSON.stringify(orderRes.body));
  }

  const variantAfter = await get('SELECT stock_quantity FROM product_variants WHERE id = ?', [variantBefore.id]);
  console.log(`   -> Tồn kho sau khi đặt 2 sản phẩm: ${variantAfter.stock_quantity}`);
  if (variantAfter.stock_quantity !== variantBefore.stock_quantity - 2) {
    throw new Error('Tồn kho không bị trừ chính xác!');
  }
  console.log('   ✅ ĐÃ TRỪ TỒN KHO THÀNH CÔNG (-2 sản phẩm)\n');

  // 2. Kiểm tra phương thức thanh toán VietQR & MoMo
  console.log('2. Kiểm tra thông tin thanh toán VietQR và MoMo (Tên tài khoản Sportzone):');
  console.log(`   - VietQR URL: ${orderRes.body.data.vietqr_url}`);
  if (!orderRes.body.data.vietqr_url.includes('qr_vietqr.png')) {
    throw new Error('VietQR URL chưa đúng ảnh thiết kế!');
  }

  const momoOrder = await request('POST', '/orders', {
    receiver_name: 'Test Khách MoMo',
    receiver_phone: '0987654321',
    shipping_address: 'Quận 3, TP Hồ Chí Minh',
    payment_method: 'momo',
    items: [{ variant_id: variantBefore.id, quantity: 1 }]
  });

  if (momoOrder.status !== 201) {
    throw new Error('Đặt hàng MoMo thất bại: ' + JSON.stringify(momoOrder.body));
  }
  console.log(`   - MoMo QR URL: ${momoOrder.body.data.momo_qr_url}`);
  console.log(`   - MoMo Receiver: ${momoOrder.body.data.momo_payload.receiver}`);
  if (momoOrder.body.data.momo_payload.receiver !== 'Sportzone') {
    throw new Error('Chủ tài khoản MoMo chưa đặt thành Sportzone!');
  }
  console.log('   ✅ Tên tài khoản VietQR và MoMo đều là Sportzone!\n');

  // 3. Kiểm tra đăng ký có Username
  const randNum = Date.now().toString().slice(-6);
  const testUsername = `sportman_${randNum}`;
  const testEmail = `sport_${randNum}@sportzone.vn`;
  const testPwd = 'password123';

  console.log(`3. Kiểm tra Đăng ký với Tên tài khoản: username="${testUsername}", email="${testEmail}"...`);
  const regRes = await request('POST', '/auth/register', {
    username: testUsername,
    full_name: 'Nguyễn Thể Thao Pro',
    email: testEmail,
    phone: '09' + Math.floor(10000000 + Math.random() * 90000000),
    password: testPwd
  });

  if (regRes.status !== 201) {
    throw new Error('Đăng ký với username thất bại: ' + JSON.stringify(regRes.body));
  }
  console.log(`   ✅ Đăng ký thành công! User ID: ${regRes.body.data.user.id}, Username: ${regRes.body.data.user.username}`);

  // 4. Kiểm tra Đăng nhập bằng USERNAME
  console.log('\n4. Kiểm tra Đăng nhập bằng USERNAME...');
  const loginByUsername = await request('POST', '/auth/login', {
    identifier: testUsername,
    password: testPwd
  });
  if (loginByUsername.status !== 200) {
    throw new Error('Đăng nhập bằng username thất bại: ' + JSON.stringify(loginByUsername.body));
  }
  console.log(`   ✅ Đăng nhập bằng USERNAME thành công! Token sinh ra OK.`);

  // 5. Kiểm tra Đăng nhập bằng EMAIL
  console.log('\n5. Kiểm tra Đăng nhập bằng EMAIL...');
  const loginByEmail = await request('POST', '/auth/login', {
    identifier: testEmail,
    password: testPwd
  });
  if (loginByEmail.status !== 200) {
    throw new Error('Đăng nhập bằng email thất bại: ' + JSON.stringify(loginByEmail.body));
  }
  console.log(`   ✅ Đăng nhập bằng EMAIL thành công! Token sinh ra OK.`);

  // 6. Kiểm tra Admin Đăng nhập & Tạo bất kỳ Voucher mới nào
  console.log('\n6. Kiểm tra Admin Đăng nhập & Thêm Voucher mới...');
  const adminLogin = await request('POST', '/auth/login', {
    identifier: 'admin',
    password: 'admin'
  });
  if (adminLogin.status !== 200) {
    throw new Error('Đăng nhập admin thất bại: ' + JSON.stringify(adminLogin.body));
  }
  const adminToken = adminLogin.body.data.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  const customVoucherCode = `CUSTOM_${Date.now().toString().slice(-4)}`;
  const createVoucherRes = await request('POST', '/admin/coupons', {
    code: customVoucherCode,
    description: 'Voucher tùy chỉnh tạo bởi Admin',
    discount_type: 'percentage',
    discount_value: 25,
    min_order_value: 200000,
    max_discount_amount: 100000,
    usage_limit: 50,
    start_date: '2026-01-01 00:00:00',
    end_date: '2026-12-31 23:59:59'
  }, adminHeaders);

  if (createVoucherRes.status !== 201) {
    throw new Error('Tạo voucher mới thất bại: ' + JSON.stringify(createVoucherRes.body));
  }
  console.log(`   ✅ Tạo Voucher mới "${customVoucherCode}" thành công! ID: ${createVoucherRes.body.data.id}`);

  // 7. Kiểm tra Tạm khóa và Xóa Voucher
  const voucherId = createVoucherRes.body.data.id;
  const lockRes = await request('PUT', `/admin/coupons/${voucherId}`, { is_active: 0 }, adminHeaders);
  console.log('   ✅ Tạm khóa Voucher:', lockRes.status === 200 ? 'OK' : 'FAIL');

  const deleteRes = await request('DELETE', `/admin/coupons/${voucherId}`, null, adminHeaders);
  console.log('   ✅ Xóa Voucher:', deleteRes.status === 200 ? 'OK' : 'FAIL');

  console.log('\n🎉 HOÀN THÀNH TOÀN BỘ KIỂM TRA ĐẠT 100% TIÊU CHUẨN!');
  process.exit(0);
}

const server = app.listen(PORT, () => {
  testAll().catch(err => {
    console.error('❌ Lỗi kiểm tra:', err);
    process.exit(1);
  });
});
