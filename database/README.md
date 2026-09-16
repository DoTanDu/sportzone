# CƠ SỞ DỮ LIỆU CỬA HÀNG DỤNG CỤ THỂ THAO (SPORTS STORE DATABASE)

Dự án thiết kế cơ sở dữ liệu chuyên biệt cho website thương mại điện tử dụng cụ thể thao (bóng đá, cầu lông, gym, chạy bộ, tennis...). Cung cấp đầy đủ các bảng dữ liệu, ràng buộc toàn vẹn, chỉ mục (indexes) và bộ dữ liệu mẫu khởi tạo phong phú.

---

## 📁 Cấu trúc thư mục

```
webnhanhtocdo/
└── database/
    ├── schema.sql              # Định nghĩa bảng chuẩn (tương thích SQLite & ANSI SQL)
    ├── schema_mysql.sql        # Định nghĩa bảng tối ưu cho MySQL / MariaDB (InnoDB, utf8mb4)
    ├── schema_postgres.sql     # Định nghĩa bảng tối ưu cho PostgreSQL (SERIAL, TIMESTAMPTZ)
    ├── seed.sql                # Dữ liệu khởi tạo mẫu (Danh mục thể thao, hãng, sản phẩm, biến thể, voucher)
    ├── sports_store.db         # Tệp SQLite đã được tạo sẵn và nạp dữ liệu hoàn chỉnh (sẵn sàng dùng ngay)
    ├── init_db.py              # Script Python khởi tạo và kiểm tra database tự động
    └── README.md               # Tài liệu hướng dẫn sử dụng và truy vấn
```

---

## 🏛️ Danh sách 13 bảng dữ liệu

| STT | Bảng | Ý nghĩa | Các trường quan trọng |
|---|---|---|---|
| 1 | `users` | Tài khoản người dùng | `id`, `full_name`, `email`, `phone`, `role` (customer/admin/staff), `status` |
| 2 | `addresses` | Sổ địa chỉ giao hàng | `id`, `user_id`, `receiver_name`, `street_address`, `district`, `city_province`, `is_default` |
| 3 | `categories` | Danh mục thể thao đa cấp | `id`, `name`, `slug`, `parent_id` (hỗ trợ phân cấp cha/con) |
| 4 | `brands` | Thương hiệu dụng cụ thể thao | `id`, `name`, `slug`, `origin_country` (Nike, Adidas, Yonex...) |
| 5 | `products` | Sản phẩm chính | `id`, `category_id`, `brand_id`, `name`, `slug`, `sku`, `base_price`, `is_featured` |
| 6 | `product_images`| Bộ sưu tập hình ảnh | `id`, `product_id`, `image_url`, `is_primary` |
| 7 | `product_variants`| Biến thể thể thao | `id`, `product_id`, `size` (39-43, S-XL), `color`, `price`, `stock_quantity` |
| 8 | `coupons` | Mã giảm giá / Voucher | `id`, `code`, `discount_type`, `discount_value`, `min_order_value`, `usage_limit` |
| 9 | `orders` | Đơn đặt hàng | `id`, `order_code`, `user_id`, `total_amount`, `payment_status`, `order_status` |
| 10 | `order_items` | Chi tiết mặt hàng đã mua | `id`, `order_id`, `product_variant_id`, `variant_label`, `unit_price`, `quantity` |
| 11 | `order_timeline`| Lịch sử hành trình đơn hàng | `id`, `order_id`, `status` (pending -> confirmed -> shipping -> delivered) |
| 12 | `carts` & `cart_items`| Giỏ hàng khách hàng | `cart_id`, `product_variant_id`, `quantity` (hỗ trợ cả session khách vãng lai) |
| 13 | `reviews` | Đánh giá & phản hồi sản phẩm | `id`, `product_id`, `user_id`, `rating` (1-5 sao), `comment`, `is_verified_buyer` |

---

## 🚀 Hướng dẫn cài đặt & nhập dữ liệu

### Cách 1: Sử dụng ngay tệp SQLite (Nhanh nhất, không cần cài đặt DB server)
Tệp `sports_store.db` đã được tạo sẵn trong thư mục `database/`. Bạn có thể:
1. Mở xem trực tiếp bằng các công cụ miễn phí như: **DB Browser for SQLite**, **DBeaver**, hoặc extension **SQLite Viewer** trong VS Code / Cursor.
2. Chạy lại script tạo mới bất cứ lúc nào:
   ```bash
   python database/init_db.py
   ```

### Cách 2: Nhập vào MySQL / MariaDB (XAMPP, Laragon, Docker, MySQL Workbench)
1. Tạo một cơ sở dữ liệu mới (ví dụ tên: `sports_store`):
   ```sql
   CREATE DATABASE sports_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE sports_store;
   ```
2. Thực thi lần lượt 2 tệp:
   - File cấu trúc bảng: `database/schema_mysql.sql`
   - File nạp dữ liệu: `database/seed.sql`
   *(Hoặc trong phpMyAdmin: bấm tab **Import** và chọn các file trên)*.

### Cách 3: Nhập vào PostgreSQL (pgAdmin, DBeaver, psql)
1. Tạo database:
   ```sql
   CREATE DATABASE sports_store;
   \c sports_store;
   ```
2. Thực thi lần lượt 2 tệp:
   - File cấu trúc bảng: `database/schema_postgres.sql`
   - File nạp dữ liệu: `database/seed.sql`

---

## 💡 Các câu truy vấn mẫu thường dùng trong Website Thể Thao

### 1. Lấy danh sách sản phẩm hiển thị ra trang chủ (Kèm tên hãng, danh mục, giá thấp nhất)
```sql
SELECT 
    p.id,
    p.name,
    p.slug,
    p.thumbnail_url,
    p.base_price,
    b.name AS brand_name,
    c.name AS category_name,
    COUNT(v.id) AS variant_count,
    SUM(v.stock_quantity) AS total_inventory
FROM products p
JOIN brands b ON p.brand_id = b.id
JOIN categories c ON p.category_id = c.id
LEFT JOIN product_variants v ON p.id = v.product_id
WHERE p.is_active = 1
GROUP BY p.id
ORDER BY p.is_featured DESC, p.created_at DESC;
```

### 2. Xem chi tiết sản phẩm kèm tất cả các biến thể Size / Màu sắc
```sql
SELECT 
    p.name AS product_name,
    v.id AS variant_id,
    v.sku_variant,
    v.size,
    v.color,
    v.price,
    v.compare_at_price,
    v.stock_quantity
FROM product_variants v
JOIN products p ON v.product_id = p.id
WHERE p.slug = 'giay-nike-mercurial-vapor-15-academy-tf'
  AND v.is_active = 1;
```

### 3. Kiểm tra tính hợp lệ của mã giảm giá (Voucher)
```sql
SELECT * FROM coupons
WHERE code = 'WELCOME10'
  AND is_active = 1
  AND CURRENT_TIMESTAMP BETWEEN start_date AND end_date
  AND used_count < usage_limit;
```

### 4. Lấy chi tiết đơn hàng và lịch sử vận chuyển (Order Tracking)
```sql
-- Lấy thông tin chung đơn hàng
SELECT * FROM orders WHERE order_code = 'DH20260916001';

-- Lấy danh sách sản phẩm trong đơn
SELECT product_name, variant_label, quantity, unit_price, total_price 
FROM order_items 
WHERE order_id = (SELECT id FROM orders WHERE order_code = 'DH20260916001');

-- Lấy lịch sử chuyển phát (Timeline)
SELECT status, note, created_by, created_at 
FROM order_timeline 
WHERE order_id = (SELECT id FROM orders WHERE order_code = 'DH20260916001')
ORDER BY created_at ASC;
```
