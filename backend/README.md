# SPORTS STORE BACKEND REST API

Hệ thống Backend REST API phục vụ website thương mại điện tử dụng cụ thể thao, được xây dựng trên nền tảng **Node.js + Express.js**, kết nối trực tiếp với Cơ sở dữ liệu quan hệ (`sports_store.db` / MySQL / PostgreSQL) và tích hợp các cơ chế bảo mật & **chống tràn dữ liệu (Data & Buffer Overflow) trong SQL**.

---

## 🛡️ Các giải pháp chống tràn dữ liệu SQL đã được triển khai

1. **Phân trang an toàn bắt buộc (Mandatory Clamped Pagination)**:
   - File: `src/utils/pagination.js`
   - Mọi API danh sách (`/api/products`, `/api/orders`) đều kiểm soát nghiêm ngặt tham số `page` và `limit`.
   - Nếu client yêu cầu `limit=999999` hoặc số âm, hệ thống sẽ tự động ép về trần an toàn (`MAX_PAGE_SIZE = 50`), ngăn chặn hoàn toàn tình trạng Full Table Fetch làm cạn kiệt RAM server và bộ đệm buffer của CSDL.
2. **Tham số hóa Prepared Statements 100%**:
   - Toàn bộ các câu lệnh SQL trong Controllers đều sử dụng dấu hỏi `?` (placeholder tham số). Tuyệt đối không dùng phép nối chuỗi (`+` hoặc `${}`).
   - Ngăn chặn triệt để lỗ hổng SQL Injection (kẻ gian dùng `' OR 1=1 --` hay chèn câu lệnh lặp làm dump hoặc tràn dữ liệu ra ngoài).
3. **Giao dịch ACID & Trừ kho nguyên tử (Atomic Inventory Transactions)**:
   - File: `src/controllers/orderController.js`
   - Khi đặt hàng, toàn bộ quy trình kiểm tra tồn kho, trừ kho và tạo đơn được bao bọc trong `BEGIN IMMEDIATE TRANSACTION` ... `COMMIT` / `ROLLBACK`.
   - Lệnh trừ kho có điều kiện: `UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?`.
   - Nếu tồn kho không đủ hoặc xảy ra xung đột đồng thời (Race Condition), giao dịch tự động Rollback, đảm bảo không bao giờ bị bán âm kho hoặc để lại dữ liệu rác.
4. **Giới hạn kích thước Request Payload (Buffer Overflow Guard)**:
   - Cấu hình `express.json({ limit: '1mb' })` chặn các gói tin body quá lớn nhằm tấn công làm tràn bộ nhớ đệm Buffer của Node.js.
   - Giới hạn số lượng mặt hàng trong 1 đơn tối đa 50 món.
5. **Kiểm tra miền giá trị đầu vào (Input Bounds Validation)**:
   - Số lượng mua chỉ chấp nhận số nguyên dương `1 <= quantity <= 1000`.
   - Giá trị tiền tệ tính toán làm tròn `Math.round()` và lưu trữ dưới dạng `DECIMAL(12, 2)` tránh lỗi dấu phẩy động (Floating point error).

---

## 🚀 Hướng dẫn khởi chạy

### 1. Cài đặt thư viện
```bash
cd backend
npm install
```

### 2. Chạy kịch bản kiểm thử tự động (12 Test Cases)
```bash
npm run test-api
```

### 3. Chạy máy chủ Backend
```bash
# Chạy thông thường
npm start

# Chạy chế độ phát triển (Auto reload với Node v20)
npm run dev
```
Server sẽ lắng nghe tại: `http://localhost:5000`

---

## 📡 Danh sách API Endpoints

### 1. Sản phẩm thể thao
- `GET /api/products`: Lấy danh sách sản phẩm phân trang & bộ lọc:
  - Query params: `page`, `limit`, `category_id`, `brand_id`, `min_price`, `max_price`, `size`, `search`, `sort` (`price_asc`, `price_desc`, `sold`, `newest`).
- `GET /api/products/featured`: Lấy danh sách sản phẩm nổi bật trang chủ.
- `GET /api/products/:slug`: Xem chi tiết sản phẩm, toàn bộ biến thể size/màu, ảnh chi tiết, đánh giá và tồn kho.

### 2. Danh mục & Thương hiệu
- `GET /api/categories`: Cây danh mục đa cấp môn thể thao (Bóng đá, Cầu lông, Gym, Chạy bộ...).
- `GET /api/brands`: Danh sách thương hiệu chính hãng (Nike, Adidas, Yonex, Mizuno...).

### 3. Giỏ hàng
- `GET /api/cart`: Lấy thông tin giỏ hàng hiện tại (hỗ trợ Header `Authorization: Bearer <token>` hoặc `x-session-id`).
- `POST /api/cart/items`: Thêm biến thể vào giỏ: `{ variant_id, quantity }`.
- `PUT /api/cart/items/:id`: Cập nhật số lượng mặt hàng trong giỏ.
- `DELETE /api/cart/items/:id`: Xóa mặt hàng khỏi giỏ.

### 4. Mã giảm giá (Coupons)
- `POST /api/coupons/validate`: Kiểm tra mã voucher và tính số tiền giảm: `{ code: "WELCOME10", order_amount: 500000 }`.

### 5. Đơn hàng & Tracking
- `POST /api/orders`: Đặt hàng với Transaction chống âm kho:
  ```json
  {
    "receiver_name": "Nguyễn Văn A",
    "receiver_phone": "0901234567",
    "shipping_address": "123 Hoàng Hoa Thám, TP.HCM",
    "items": [{ "variant_id": 1, "quantity": 1 }],
    "coupon_code": "WELCOME10",
    "payment_method": "cod",
    "note": "Giao giờ hành chính"
  }
  ```
- `GET /api/orders/track/:code`: Tra cứu thông tin chi tiết và hành trình đơn hàng (Timeline).
- `GET /api/orders/my-orders`: Lịch sử đơn hàng của người dùng (yêu cầu đăng nhập).

### 6. Xác thực & Tài khoản
- `POST /api/auth/register`: Đăng ký tài khoản (mã hóa bcrypt, trả về JWT token).
- `POST /api/auth/login`: Đăng nhập cấp token.
- `GET /api/auth/profile`: Xem thông tin tài khoản và sổ địa chỉ.

### 7. Quản trị viên (Admin)
- `GET /api/admin/dashboard`: Thống kê doanh thu, tổng đơn hàng, cảnh báo biến thể sắp hết hàng (`stock <= 10`).
- `GET /api/admin/orders`: Quản lý danh sách đơn hàng toàn hệ thống.
- `PUT /api/admin/orders/:id/status`: Cập nhật trạng thái (`confirmed`, `shipping`, `delivered`, `cancelled`) và ghi log timeline.
