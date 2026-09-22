const http = require('http');

const PORT = 5002;
process.env.PORT = PORT;
process.env.NODE_ENV = 'test';

const app = require('../src/server');
const { get, query } = require('../src/config/db');

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
            resolve({ status: res.statusCode, data: parsed });
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

async function verify() {
  console.log('🧪 Bắt đầu kiểm tra Dữ liệu thật & Mã MoMo QR động...\n');

  // 1. Kiểm tra sản phẩm thật trong DB
  const products = await query(`
    SELECT p.id, p.name, p.base_price, b.name as brand_name, c.name as category_name
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    JOIN categories c ON p.category_id = c.id
  `);
  console.log(`✅ Tổng số sản phẩm trong cơ sở dữ liệu: ${products.length}`);
  products.forEach(p => {
    console.log(`   - [${p.category_name}] ${p.brand_name} - ${p.name} (${Number(p.base_price).toLocaleString('vi-VN')} đ)`);
  });

  if (products.length < 10) {
    throw new Error('Số lượng sản phẩm thật quá ít!');
  }

  // 2. Kiểm tra biến thể
  const variants = await query('SELECT count(*) as total FROM product_variants');
  console.log(`\n✅ Tổng số biến thể (Size/Màu): ${variants[0].total}`);

  // 3. Kiểm tra mã giảm giá thực tế
  const coupons = await query('SELECT code, discount_type, discount_value, min_order_value FROM coupons WHERE is_active = 1');
  console.log(`\n✅ Danh sách mã giảm giá thực tế:`);
  coupons.forEach(c => console.log(`   - Voucher ${c.code}: ${c.discount_value}${c.discount_type === 'percentage' ? '%' : 'đ'}, đơn tối thiểu ${Number(c.min_order_value).toLocaleString('vi-VN')}đ`));

  // 4. Test đặt hàng bằng phương thức MoMo QR động
  const targetVariant = await get('SELECT id, price FROM product_variants WHERE stock_quantity >= 2 LIMIT 1');
  console.log(`\n📦 Thử nghiệm đặt hàng bằng MoMo với variant_id=${targetVariant.id}, đơn giá=${targetVariant.price}...`);

  const orderRes = await request('POST', '/orders', {
    receiver_name: 'Khách Hàng Test MoMo',
    receiver_phone: '0987654321',
    shipping_address: 'Tòa nhà Landmark 81, P.22, Q. Bình Thạnh, TP.HCM',
    payment_method: 'momo',
    coupon_code: 'WELCOME10',
    items: [
      { variant_id: targetVariant.id, quantity: 1 }
    ]
  });

  if (orderRes.status !== 201) {
    throw new Error(`Đặt hàng thất bại (${orderRes.status}): ` + JSON.stringify(orderRes.data));
  }

  const orderData = orderRes.data.data;
  console.log('✅ Đặt hàng MoMo thành công!');
  console.log(`   - Mã đơn hàng: ${orderData.order_code}`);
  console.log(`   - Tổng thanh toán: ${Number(orderData.total_amount).toLocaleString('vi-VN')} đ`);
  console.log(`   - Payment Method: ${orderData.payment_method}`);
  console.log(`   - MoMo QR URL: ${orderData.momo_qr_url}`);
  console.log(`   - MoMo Deep Link: ${orderData.momo_payload.deep_link}`);

  if (!orderData.momo_qr_url || !orderData.momo_qr_url.includes(orderData.order_code)) {
    throw new Error('MoMo QR URL không chứa thông tin mã đơn động!');
  }
  if (!orderData.momo_qr_url.includes(orderData.total_amount.toString())) {
    throw new Error('MoMo QR URL không chứa số tiền thanh toán động!');
  }

  // 5. Test tra cứu đơn hàng vừa tạo để xem thông tin QR MoMo
  const trackRes = await request('GET', `/orders/track/${orderData.order_code}`);
  console.log(`\n✅ Tra cứu đơn hàng ${orderData.order_code} thành công:`);
  console.log(`   - Trạng thái đơn: ${trackRes.data.data.order_status}`);
  console.log(`   - Trạng thái thanh toán: ${trackRes.data.data.payment_status}`);
  console.log(`   - Transaction Gateway: ${trackRes.data.data.payment_transaction.gateway}`);
  console.log(`   - Transaction Payment URL: ${trackRes.data.data.payment_transaction.payment_url}`);

  console.log('\n🎉 TẤT CẢ CÁC BƯỚC KIỂM TRA DỮ LIỆU THẬT & MOMO QR ĐỀU THÀNH CÔNG RỰC RỠ!');
  process.exit(0);
}

// Khởi động server test và chạy verify
const server = app.listen(PORT, () => {
  verify().catch(err => {
    console.error('❌ Lỗi kiểm tra:', err);
    process.exit(1);
  });
});
