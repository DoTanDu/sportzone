# ⚡ SPORTZONE - WEBSITE BÁN DỤNG CỤ THỂ THAO CAO CẤP

Dự án website thương mại điện tử chuyên biệt cho ngành dụng cụ và phụ kiện thể thao (Bóng đá, Cầu lông & Tennis, Gym & Thể hình, Chạy bộ, Bơi lội...) với đầy đủ hệ thống Cơ sở dữ liệu (Database), Máy chủ dịch vụ (Backend REST API), Giao diện mua sắm (Frontend SPA) và Phân hệ Quản trị viên (Admin Portal).

---

## 🌟 Tính Năng Nổi Bật

- **Frontend Năng Động (Athletic Cyber Aesthetic)**:
  - Bảng màu Dark Slate cao cấp phối màu Electric Cyan & Flame Orange, hiệu ứng Glassmorphism.
  - Bộ lọc đa tiêu chí (theo môn thể thao, thương hiệu, kích thước size giày/vợt, khoảng giá).
  - Chọn size thông minh hiển thị số lượng tồn kho tức thời.
  - Giỏ hàng trượt Drawer, áp mã giảm giá voucher (`WELCOME10` giảm 10%).
  - Đặt hàng an toàn, tra cứu hành trình đơn hàng trực quan (Timeline).
- **Phân Hệ Quản Trị Viên (Admin Portal)**:
  - Tài khoản đăng nhập đơn giản: `admin` / `admin`.
  - Thống kê doanh thu thời gian thực, tổng số đơn hàng, khách hàng, cảnh báo tồn kho thấp (`stock <= 10`).
  - Quản lý sản phẩm: Xem danh sách, thêm sản phẩm mới (kèm size/màu), cập nhật giá và tồn kho trực tiếp.
  - Quản lý đơn hàng: Xem danh sách và cập nhật trạng thái đơn (chờ duyệt ➔ đang giao ➔ hoàn thành).
- **Backend & Database Chống Tràn Dữ Liệu SQL**:
  - Bắt buộc phân trang (Mandatory Clamped Pagination) khống chế `limit <= 50`, chống cạn kiệt RAM server.
  - Tham số hóa Prepared Statements 100% chống triệt để SQL Injection.
  - Giao dịch ACID Transaction với Atomic Update kiểm tra tồn kho, chống bán âm kho và race condition.
  - Giới hạn Request Payload 1MB chống buffer overflow.

---

## 📁 Cấu Trúc Dự Án

```
webnhanhtocdo/
├── backend/                # Máy chủ Express.js REST API
│   ├── src/
│   │   ├── config/         # Kết nối CSDL SQLite / MySQL
│   │   ├── controllers/    # Sản phẩm, Đơn hàng, Giỏ hàng, Voucher, Auth, Admin
│   │   ├── middlewares/    # Xác thực JWT, bắt lỗi toàn cục
│   │   ├── routes/         # Định tuyến REST API
│   │   ├── utils/          # Helper phân trang an toàn
│   │   └── server.js       # Điểm khởi chạy server
│   └── tests/              # Kịch bản kiểm thử tự động (12 test cases)
├── frontend/               # Giao diện người dùng & Admin SPA
│   ├── css/                # main.css, components.css
│   ├── js/                 # api.js, store.js, admin.js, app.js
│   └── index.html          # Trang HTML5 chuẩn SEO
├── database/               # Quản lý CSDL
│   ├── schema.sql          # Cấu trúc bảng ANSI / SQLite
│   ├── schema_mysql.sql    # DDL tối ưu riêng cho MySQL
│   ├── schema_postgres.sql # DDL tối ưu riêng cho PostgreSQL
│   ├── seed.sql            # Dữ liệu khởi tạo mẫu
│   └── sports_store.db     # Tệp SQLite tạo sẵn
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Khởi chạy máy chủ Backend & Frontend
```bash
cd backend
npm install
npm start
```
Hệ thống sẽ chạy tại: **http://localhost:5000** (Phục vụ cả giao diện Frontend lẫn REST API).

### 2. Chạy kiểm thử tự động
```bash
cd backend
npm run test-api
```

---

## 🔑 Tài Khoản Quản Trị Viên (Admin)

- **Đường dẫn**: [http://localhost:5000/#admin](http://localhost:5000/#admin) (hoặc bấm nút Admin trên Navbar).
- **Tài khoản**: `admin`
- **Mật khẩu**: `admin`
