-- ==========================================================
-- CƠ SỞ DỮ LIỆU SPORTZONE (WEBSITE BÁN DỤNG CỤ THỂ THAO)
-- Dành riêng cho: MySQL / MariaDB (aaPanel, phpMyAdmin, MySQL 5.7+, 8.0+)
-- Ngày tạo: 2026-09-22T16:32:51.637Z
-- ==========================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+07:00";

-- XÓA BẢNG CŨ NẾU ĐÃ TỒN TẠI
DROP TABLE IF EXISTS inventory_logs;
DROP TABLE IF EXISTS payment_transactions;
DROP TABLE IF EXISTS coupon_usages;
DROP TABLE IF EXISTS wishlists;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS order_timeline;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS users;

-- ==========================================================
-- 1. BẢNG NGƯỜI DÙNG (USERS)
-- ==========================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) DEFAULT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) DEFAULT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin', 'staff') NOT NULL DEFAULT 'customer',
    avatar_url VARCHAR(500) DEFAULT NULL,
    status ENUM('active', 'inactive', 'banned') NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 2. SỔ ĐỊA CHỈ (ADDRESSES)
-- ==========================================================
CREATE TABLE addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    receiver_name VARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    ward VARCHAR(100) DEFAULT NULL,
    district VARCHAR(100) DEFAULT NULL,
    city_province VARCHAR(100) NOT NULL,
    is_default TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 3. DANH MỤC SẢN PHẨM (CATEGORIES)
-- ==========================================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    icon VARCHAR(50) DEFAULT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    parent_id INT DEFAULT NULL,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 4. THƯƠNG HIỆU (BRANDS)
-- ==========================================================
CREATE TABLE brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    logo_url VARCHAR(500) DEFAULT NULL,
    description TEXT,
    origin_country VARCHAR(50) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 5. SẢN PHẨM CHÍNH (PRODUCTS)
-- ==========================================================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    brand_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    sku VARCHAR(50) NOT NULL UNIQUE,
    short_description VARCHAR(500) DEFAULT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500) DEFAULT NULL,
    base_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    is_featured TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    view_count INT DEFAULT 0,
    sold_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 6. HÌNH ẢNH SẢN PHẨM (PRODUCT_IMAGES)
-- ==========================================================
CREATE TABLE product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary TINYINT(1) DEFAULT 0,
    sort_order INT DEFAULT 0,
    CONSTRAINT fk_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 7. BIẾN THỂ SẢN PHẨM (PRODUCT_VARIANTS)
-- ==========================================================
CREATE TABLE product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    sku_variant VARCHAR(80) NOT NULL UNIQUE,
    size VARCHAR(50) DEFAULT NULL,
    color VARCHAR(50) DEFAULT NULL,
    price DECIMAL(12, 2) NOT NULL,
    compare_at_price DECIMAL(12, 2) DEFAULT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    weight_grams INT DEFAULT 0,
    image_url VARCHAR(500) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 8. MÃ GIẢM GIÁ (COUPONS)
-- ==========================================================
CREATE TABLE coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) DEFAULT NULL,
    discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
    discount_value DECIMAL(12, 2) NOT NULL,
    min_order_value DECIMAL(12, 2) DEFAULT 0.00,
    max_discount_amount DECIMAL(12, 2) DEFAULT NULL,
    usage_limit INT DEFAULT 100,
    used_count INT DEFAULT 0,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 9. ĐƠN ĐẶT HÀNG (ORDERS)
-- ==========================================================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(30) NOT NULL UNIQUE,
    user_id INT DEFAULT NULL,
    receiver_name VARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    shipping_address VARCHAR(300) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    shipping_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    coupon_id INT DEFAULT NULL,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    payment_method ENUM('cod', 'banking', 'vnpay', 'momo') NOT NULL,
    payment_status ENUM('unpaid', 'paid', 'refunded', 'failed') NOT NULL DEFAULT 'unpaid',
    order_status ENUM('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'returned') NOT NULL DEFAULT 'pending',
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 10. CHI TIẾT ĐƠN HÀNG (ORDER_ITEMS)
-- ==========================================================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_variant_id INT DEFAULT NULL,
    product_name VARCHAR(200) NOT NULL,
    variant_label VARCHAR(150) DEFAULT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_items_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 11. DÒNG THỜI GIAN ĐƠN HÀNG (ORDER_TIMELINE)
-- ==========================================================
CREATE TABLE order_timeline (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    note VARCHAR(255) DEFAULT NULL,
    created_by VARCHAR(100) DEFAULT 'Hệ thống',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_timeline_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 12. GIỎ HÀNG (CARTS)
-- ==========================================================
CREATE TABLE carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    session_id VARCHAR(100) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 13. CHI TIẾT GIỎ HÀNG (CART_ITEMS)
-- ==========================================================
CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_variant_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_variant (cart_id, product_variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 14. ĐÁNH GIÁ SẢN PHẨM (REVIEWS)
-- ==========================================================
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT DEFAULT NULL,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_images TEXT,
    is_verified_buyer TINYINT(1) DEFAULT 1,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 15. DANH SÁCH YÊU THÍCH (WISHLISTS)
-- ==========================================================
CREATE TABLE wishlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlists_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 16. LỊCH SỬ SỬ DỤNG VOUCHER (COUPON_USAGES)
-- ==========================================================
CREATE TABLE coupon_usages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coupon_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT NOT NULL,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_coupon_usages_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    CONSTRAINT fk_coupon_usages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_coupon_usages_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    UNIQUE KEY unique_coupon_user (coupon_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 17. GIAO DỊCH THANH TOÁN (PAYMENT_TRANSACTIONS)
-- ==========================================================
CREATE TABLE payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    gateway VARCHAR(30) NOT NULL,
    transaction_code VARCHAR(100) DEFAULT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status ENUM('pending', 'success', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    payment_url TEXT,
    gateway_response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transactions_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 18. NHẬT KÝ BIẾN ĐỘNG KHO (INVENTORY_LOGS)
-- ==========================================================
CREATE TABLE inventory_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_variant_id INT NOT NULL,
    change_type VARCHAR(30) NOT NULL,
    quantity_change INT NOT NULL,
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reference_id VARCHAR(50) DEFAULT NULL,
    note VARCHAR(255) DEFAULT NULL,
    created_by VARCHAR(100) DEFAULT 'Hệ thống',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TỐI ƯU HÓA CHỈ MỤC (INDEXES)
-- ==========================================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_featured ON products(is_featured, is_active);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku_variant);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_code ON orders(order_code);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_wishlists_user ON wishlists(user_id);
CREATE INDEX idx_coupon_usages_user ON coupon_usages(user_id, coupon_id);
CREATE INDEX idx_inventory_logs_variant ON inventory_logs(product_variant_id);

-- ==========================================================
-- DỮ LIỆU THỰC TẾ (INSERT DATA)
-- ==========================================================

-- Dữ liệu bảng: users (13 bản ghi)
INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `password_hash`, `role`, `avatar_url`, `status`, `created_at`, `updated_at`, `username`) VALUES
(1, 'Admin Thể Thao', 'admin', '0901234567', '$2a$10$FamihScHpyPGaO0dJShqjufiqsiAN0a4//HNoqjmr8UZdh1Zj9zIy', 'admin', NULL, 'active', '2026-09-16 01:16:57', '2026-09-16 01:16:57', 'admin'),
(2, 'Nguyễn Văn Nhân Viên', 'staff@sportstore.vn', '0902345678', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'staff', NULL, 'active', '2026-09-16 01:16:57', '2026-09-16 01:16:57', 'staff_2'),
(3, 'Trần Minh Khang (Khách)', 'khang.tran@gmail.com', '0987654321', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'customer', NULL, 'active', '2026-09-16 01:16:57', '2026-09-16 01:16:57', 'khangtran_3'),
(4, 'Lê Thị Thu Thảo', 'thao.le@gmail.com', '0912987654', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'customer', NULL, 'active', '2026-09-16 01:16:57', '2026-09-16 01:16:57', 'thaole_4'),
(5, 'Nguyễn Thể Thao', 'user_1789521718087@sporttest.vn', '0957401215', '$2a$10$Gx0ET/8DEKA0mLJ58xDyT.qbJ55/2wBnKodmH8ff0EfRtkPITA9Wa', 'customer', NULL, 'active', '2026-09-16 01:21:58', '2026-09-16 01:21:58', 'user_1789521718087_5'),
(6, 'Nguyễn Thể Thao', 'user_1789521727160@sporttest.vn', '0987923246', '$2a$10$XcJyleRAY8YSzqhFy/MqNOhvaai0V0c94MG5SU.RM3FIi5ahMCGoq', 'customer', NULL, 'active', '2026-09-16 01:22:07', '2026-09-16 01:22:07', 'user_1789521727160_6'),
(7, 'Nguyễn Văn Test Đã Đổi', 'testuser_1790085044817@sportzone.vn', '0988888888', '$2a$10$pgZXpl4t2N0x0gozCOTFYeBoUrC.FLoI5y.nRZNr9ZrVfnNKBINu6', 'customer', NULL, 'active', '2026-09-22 13:50:45', '2026-09-22 13:50:45', 'testuser_1790085044817_7'),
(8, 'dotandu', 'dotandu2018st@gmail.com', '0363332841', '$2a$10$WOzsL.Dp.0RA9QgRCeQnbOaiG4JLk9LbFD.uHgsivSAZ6ZhfdnwYS', 'customer', NULL, 'active', '2026-09-22 13:52:12', '2026-09-22 13:52:12', 'dotandu2018st_8'),
(9, 'Nguyễn Văn Test', 'testuser_1790085453099@sportzone.vn', '0912345678', '$2a$10$xfMp/KgEnT4X9EPKSy9uA.l0vUVgILTZCKLLGakLshk0zl/4cIpz.', 'customer', NULL, 'active', '2026-09-22 13:57:33', '2026-09-22 13:57:33', 'testuser_1790085453099_9'),
(10, 'Nguyễn Văn Test Đã Đổi', 'testuser_1790085477668@sportzone.vn', '0969834776', '$2a$10$zZGcJWk.YGqCt6T7DbTm2OspMFOchbI/7mxZf/7zURNl4lQJgbTUW', 'customer', NULL, 'active', '2026-09-22 13:57:57', '2026-09-22 13:57:57', 'testuser_1790085477668_10'),
(11, 'Nguyễn Thể Thao Pro', 'sport_510783@sportzone.vn', '0986834766', '$2a$10$BJP4EoRaESpeL04Wo6pmKuWwzELuJabGB7z6J0Q82.xRgBzDpVvYa', 'customer', NULL, 'active', '2026-09-22 14:15:10', '2026-09-22 14:15:10', 'sportman_510783'),
(12, 'Nguyễn Văn Test Đã Đổi', 'testuser_1790086516122@sportzone.vn', '0984714897', '$2a$10$RhocNnbUQ07cZ5dcVZFPKebBlF.Rb.6lTzI.IrdxkUZS2.tWPS2nO', 'customer', NULL, 'active', '2026-09-22 14:15:16', '2026-09-22 14:15:16', 'testuser_1790086516122'),
(13, 'Nguyễn Thể Thao', 'user_1790086900885@sporttest.vn', '0936074653', '$2a$10$e/q2XN/q7czSxSbHktk5WOttn/Nok/miXIrJc2wDV8/iaSFzFttFO', 'customer', NULL, 'active', '2026-09-22 14:21:40', '2026-09-22 14:21:40', 'user_1790086900885');

-- Dữ liệu bảng: addresses (6 bản ghi)
INSERT INTO `addresses` (`id`, `user_id`, `receiver_name`, `receiver_phone`, `street_address`, `ward`, `district`, `city_province`, `is_default`, `created_at`) VALUES
(1, 3, 'Trần Minh Khang', '0987654321', 'Số 120 Hoàng Hoa Thám', 'Phường 12', 'Quận Tân Bình', 'Hồ Chí Minh', 1, '2026-09-16 01:16:57'),
(2, 3, 'Trần Minh Khang (Cơ quan)', '0987654321', 'Tòa nhà Landmark 81, 720A Điện Biên Phủ', 'Phường 22', 'Quận Bình Thạnh', 'Hồ Chí Minh', 0, '2026-09-16 01:16:57'),
(3, 4, 'Lê Thị Thu Thảo', '0912987654', 'Số 45 Tràng Tiền', 'Phường Tràng Tiền', 'Quận Hoàn Kiếm', 'Hà Nội', 1, '2026-09-16 01:16:57'),
(4, 7, 'Người Nhận Test', '0988888888', 'Số 99 Đường Thể Thao', '', '', 'TP Hồ Chí Minh', 1, '2026-09-22 13:50:45'),
(5, 10, 'Người Nhận Test', '0988888888', 'Số 99 Đường Thể Thao', '', '', 'TP Hồ Chí Minh', 1, '2026-09-22 13:57:57'),
(6, 12, 'Người Nhận Test', '0988888888', 'Số 99 Đường Thể Thao', '', '', 'TP Hồ Chí Minh', 1, '2026-09-22 14:15:16');

-- Dữ liệu bảng: categories (12 bản ghi)
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `image_url`, `parent_id`, `sort_order`, `is_active`, `created_at`) VALUES
(1, 'Bóng Đá', 'bong-da', 'fa-futbol', NULL, NULL, 1, 1, '2026-09-16 01:16:57'),
(2, 'Cầu Lông & Tennis', 'cau-long-tennis', 'fa-table-tennis-paddle-ball', NULL, NULL, 2, 1, '2026-09-16 01:16:57'),
(3, 'Gym & Thể Hình', 'gym-the-hinh', 'fa-dumbbell', NULL, NULL, 3, 1, '2026-09-16 01:16:57'),
(4, 'Chạy Bộ & Điền Kinh', 'chay-bo-dien-kinh', 'fa-person-running', NULL, NULL, 4, 1, '2026-09-16 01:16:57'),
(5, 'Bơi Lội & Phụ Kiện', 'boi-loi-phu-kien', 'fa-person-swimming', NULL, NULL, 5, 1, '2026-09-16 01:16:57'),
(6, 'Giày Đá Bóng Sân Cỏ Nhân Tạo', 'giay-da-bong-san-co-nhan-tao', 'fa-shoe-prints', NULL, 1, 1, 1, '2026-09-16 01:16:57'),
(7, 'Quần Áo Bóng Đá', 'quan-ao-bong-da', 'fa-shirt', NULL, 1, 2, 1, '2026-09-16 01:16:57'),
(8, 'Quả Bóng Đá Thi Đấu', 'qua-bong-da-thi-dau', 'fa-futbol', NULL, 1, 3, 1, '2026-09-16 01:16:57'),
(9, 'Vợt Cầu Lông', 'vot-cau-long', 'fa-racquet', NULL, 2, 1, 1, '2026-09-16 01:16:57'),
(10, 'Giày Cầu Lông', 'giay-cau-long', 'fa-shoe-prints', NULL, 2, 2, 1, '2026-09-16 01:16:57'),
(11, 'Tạ Tay & Tạ Đòn', 'ta-tay-ta-don', 'fa-dumbbell', NULL, 3, 1, 1, '2026-09-16 01:16:57'),
(12, 'Phụ Kiện Tập Gym', 'phu-kien-tap-gym', 'fa-mitten', NULL, 3, 2, 1, '2026-09-16 01:16:57');

-- Dữ liệu bảng: brands (7 bản ghi)
INSERT INTO `brands` (`id`, `name`, `slug`, `logo_url`, `description`, `origin_country`, `is_active`, `created_at`) VALUES
(1, 'Nike', 'nike', 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg', 'Thương hiệu thể thao hàng đầu thế giới từ Mỹ', 'Mỹ', 1, '2026-09-16 01:16:57'),
(2, 'Adidas', 'adidas', 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg', 'Thương hiệu biểu tượng thể thao Đức với 3 sọc nổi tiếng', 'Đức', 1, '2026-09-16 01:16:57'),
(3, 'Yonex', 'yonex', 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Yonex_logo.svg', 'Thương hiệu dụng cụ cầu lông số 1 thế giới', 'Nhật Bản', 1, '2026-09-16 01:16:57'),
(4, 'Lining', 'lining', 'https://upload.wikimedia.org/wikipedia/commons/8/87/Li-Ning_logo.svg', 'Thương hiệu trang thiết bị thể thao đỉnh cao châu Á', 'Trung Quốc', 1, '2026-09-16 01:16:57'),
(5, 'Mizuno', 'mizuno', 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Mizuno_logo.svg', 'Thương hiệu giày và thiết bị thể thao thủ công Nhật Bản', 'Nhật Bản', 1, '2026-09-16 01:16:57'),
(6, 'Decathlon', 'decathlon', 'https://upload.wikimedia.org/wikipedia/commons/0/08/Decathlon_Logo.svg', 'Chuỗi bán lẻ và sản xuất đồ thể thao toàn cầu', 'Pháp', 1, '2026-09-16 01:16:57'),
(7, 'Động Lực', 'dong-luc', '', 'Tập đoàn thể thao hàng đầu Việt Nam, bóng thi đấu V-League', 'Việt Nam', 1, '2026-09-16 01:16:57');

-- Dữ liệu bảng: products (16 bản ghi)
INSERT INTO `products` (`id`, `category_id`, `brand_id`, `name`, `slug`, `sku`, `short_description`, `description`, `thumbnail_url`, `base_price`, `is_featured`, `is_active`, `view_count`, `sold_count`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'Giày Đá Bóng Nike Zoom Mercurial Vapor 15 Pro TF', 'giay-da-bong-nike-zoom-mercurial-vapor-15-pro-tf', 'NIKE-VAPOR15-PRO-TF', 'Giày đá bóng sân cỏ nhân tạo cao cấp trang bị túi đệm khí Air Zoom 3/4 lò xo hoàn trả năng lượng cực nhạy.', 'Chi tiết sản phẩm chính hãng:\n- Bộ đệm Air Zoom chuyên dụng đặt ở đế giày tạo lực đẩy tức thì trong từng pha bứt tốc.\n- Thân giày Flyknit co giãn kết hợp công nghệ Hyperscreen tăng cường độ ma sát và kiểm soát bóng chính xác.\n- Đế ngoài cao su đinh dăm Tri-star hình ngôi sao ba cánh bám sân cỏ nhân tạo cực tốt trong mọi điều kiện thời tiết.\n- Trọng lượng siêu nhẹ: ~230g/chiếc size 41.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700', 2850000, 1, 1, 3520, 148, '2026-09-22 13:55:15', '2026-09-22 13:55:15'),
(2, 1, 5, 'Giày Đá Bóng Mizuno Morelia Neo 3 Pro AS', 'giay-da-bong-mizuno-morelia-neo-3-pro-as', 'MIZ-NEO3-PRO-AS', 'Vua sân phủi với da Kangaroo tự nhiên siêu mềm, cảm giác bóng chân thật tuyệt đối.', 'Dòng giày làm nên tên tuổi Mizuno tại thị trường bóng đá phong trào Việt Nam:\n- Upper da Kangaroo cao cấp thuộc thủ công theo tiêu chuẩn khắt khe của Nhật Bản, mềm như đi chân trần.\n- Form giày thiết kế đặc quyền cho bàn chân người châu Á bè ngang, không lo đau ngón chân.\n- Đinh dăm cao su tròn chữ L bám sân nhân tạo cực đỉnh, độ bền vượt trội lên đến 2-3 năm sử dụng liên tục.', 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=700', 2790000, 1, 1, 2890, 118, '2026-09-22 13:55:15', '2026-09-22 13:55:15'),
(3, 1, 7, 'Quả Bóng Đá Động Lực FIFA Quality Pro UHV 2.05', 'qua-bong-da-dong-luc-uhv-205-fifa-quality-pro', 'DL-BALL-UHV205-PRO', 'Bóng thi đấu chính thức tại giải bóng đá vô địch quốc gia V-League đạt chuẩn FIFA Quality Pro.', 'Trái bóng chuẩn thi đấu đỉnh cao của tập đoàn Động Lực:\n- Da PU cao cấp nhập khẩu kết hợp công nghệ ép nhiệt không đường may giúp bóng chống thấm nước 100%.\n- Ruột bóng bằng cao su đặc biệt giữ hơi cực lâu, độ đàn hồi chuẩn xác tiêu chuẩn FIFA.\n- Quỹ đạo bay ổn định tuyệt đối, không lắc đảo khi sút xa hoặc tạt bóng cuộn.', 'assets/images/ball_dongluc_uhv205.jpg', 890000, 1, 1, 1980, 240, '2026-09-22 13:55:15', '2026-09-22 13:55:15'),
(4, 1, 1, 'Găng Tay Thủ Môn Nike Vapor Grip 3 Promo', 'gang-tay-thu-mon-nike-vapor-grip-3-promo', 'NIKE-GK-VG3-PROMO', 'Găng tay thủ môn chuyên nghiệp với mút Contact Foam 4mm dính bóng như nam châm.', 'Mẫu găng tay yêu thích của Alisson Becker và Courtois:\n- Mút Contact Plus Foam 4mm hấp thụ lực sút cực mạnh và dính bóng tối đa trong cả trời mưa lẫn khô ráo.\n- Công nghệ Grip3 ôm sát ngón trỏ và ngón út, gia tăng diện tích tiếp xúc với bóng.\n- Lưng găng bằng vải lưới thoáng khí thoát mồ hôi tối ưu.', 'assets/images/nike_gk_gloves.jpg', 2150000, 0, 1, 850, 45, '2026-09-22 13:55:15', '2026-09-22 13:55:15'),
(5, 2, 3, 'Vợt Cầu Lông Yonex Astrox 88D Pro (Gen 3)', 'vot-cau-long-yonex-astrox-88d-pro-gen-3', 'YONEX-AX88D-PRO-G3', 'Vũ khí tấn công hủy diệt cho cầu sau, trợ lực smash cắm và uy lực tuyệt đối.', 'Dòng vợt cao cấp sản xuất 100% tại Nhật Bản (Made in Japan):\n- Công nghệ Namd và Rotational Generator System phân bổ trọng lượng tối ưu ở đỉnh khung, khớp chữ T và cán vợt.\n- Mặt vợt mở rộng Sweet Spot tăng độ nảy và độ chính xác kể cả khi tiếp xúc cầu lệch tâm.\n- Thân vợt cứng, đầu vợt nặng (Head Heavy) tối ưu cho các pha đập cầu ghi điểm quyết định.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=700', 4150000, 1, 1, 4500, 95, '2026-09-22 13:55:15', '2026-09-22 13:55:15'),
(6, 2, 3, 'Vợt Cầu Lông Yonex Nanoflare 800 Pro', 'vot-cau-long-yonex-nanoflare-800-pro', 'YONEX-NF800-PRO', 'Dòng vợt tốc độ phản tạt nhanh như chớp, điều cầu phòng thủ xuất sắc hàng đầu thế giới.', 'Thiết kế khung vành vát khí động học Sonic Flare System giảm lực cản gió tối đa:\n- Thân vợt Extra Slim Shaft lướt gió nhanh hơn 11.5% so với khung tiêu chuẩn.\n- Đầu vợt nhẹ (Head Light) xoay sở linh hoạt trong các pha phản tạt đôi và bắt lưới.\n- Phù hợp cả đánh đơn lẫn đánh đôi chiến thuật tốc độ cao.', 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=700', 3950000, 1, 1, 2100, 62, '2026-09-22 13:55:15', '2026-09-22 13:55:15'),
(7, 2, 3, 'Giày Cầu Lông Yonex Power Cushion 65 Z3 Men', 'giay-cau-long-yonex-power-cushion-65-z3-men', 'YONEX-SHB-65Z3M', 'Mẫu giày cầu lông được hơn 70% tay vợt top 10 thế giới tin dùng với đệm Power Cushion+ độc quyền.', 'Đôi giày toàn diện nhất làng cầu lông thế giới:\n- Đệm Power Cushion+ hấp thụ chấn động và hoàn trả năng lượng: thả quả trứng từ độ cao 12m nảy lên 6m mà không vỡ.\n- Tấm sợi carbon Power Graphite Sheet ở vòm bàn chân chống lật cổ chân và xoắn giày khi chuyển hướng đột ngột.\n- Thân giày da PU liền mạch giảm áp lực lên các ngón chân khi di chuyển dồn dập.', 'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?w=700', 2950000, 0, 1, 1750, 78, '2026-09-22 13:55:15', '2026-09-22 13:55:15'),
(8, 2, 6, 'Vợt Tennis Wilson Pro Staff 97 v14 (315g)', 'vot-tennis-wilson-pro-staff-97-v14', 'WILSON-PS97-V14', 'Huyền thoại kiểm soát bóng của Roger Federer với cấu trúc sợi Braid 45 chuẩn xác.', 'Cây vợt biểu tượng mang lại độ chính xác từng milimet trên sân quần vợt:\n- Mặt vợt 97 sq.in, trọng lượng vung đầm tay 315g cho cảm giác đánh bóng cổ điển và chắc nịch.\n- Công nghệ Paradigm Bending tối ưu hóa độ uốn cong giữa cán và khung vợt.\n- Nước sơn đổi màu Bronze ánh đồng sang trọng đẳng cấp.', 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=700', 5200000, 1, 1, 1620, 28, '2026-09-22 13:55:15', '2026-09-22 13:55:15'),
(9, 3, 6, 'Bộ Tạ Tay Điều Chỉnh Thông Minh Bowflex SelectTech (2.5kg - 24kg)', 'bo-ta-tay-dieu-chinh-thong-minh-bowflex-selecttech', 'BOWFLEX-ST552-PAIR', 'Thay thế 15 cặp tạ tay cồng kềnh bằng 1 cặp tạ xoay số điều chỉnh trọng lượng chỉ trong 2 giây.', 'Giải pháp phòng gym mini tại nhà hoàn hảo nhất:\n- Cơ chế xoay đĩa thông minh: dễ dàng chọn mức tạ từ 2.5kg, 3.5kg, 4.5kg... lên tới 24kg mỗi bên.\n- Đĩa tạ bọc nhựa nhiệt dẻo cao su đúc nguyên khối chống va đập và chống trầy xước sàn nhà.\n- Khay đế bảo vệ an toàn giữ các đĩa tạ cố định khi không sử dụng.', 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=700', 4650000, 1, 1, 3200, 85, '2026-09-22 13:55:15', '2026-09-22 13:55:15'),
(10, 3, 6, 'Dây Kháng Lực Tập Thể Lực Powerband Aolikes (Bộ 4 Dây)', 'day-khang-luc-tap-the-luc-powerband-aolikes', 'AOLIKES-PB-SET4', 'Bộ 4 dây cao su tự nhiên hỗ trợ kéo xà đơn, tập squat mông đùi và phục hồi chức năng.', 'Sản phẩm không thể thiếu cho dân thể thao và tập luyện sức mạnh:\n- Chất liệu 100% mủ cao su tự nhiên Malaysia đàn hồi cao, không bị bai nhão hay đứt gãy.\n- 4 mức kháng lực: Đỏ (7-15kg), Đen (12-30kg), Tím (18-40kg), Xanh lá (25-57kg).\n- Gọn nhẹ mang theo khi đi du lịch hoặc công tác.', 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=700', 380000, 0, 1, 1450, 310, '2026-09-22 13:55:15', '2026-09-22 13:55:15'),
(11, 3, 6, 'Đai Lưng Tập Gym Gánh Tạ Harbinger 5-inch Foam Core', 'dai-lung-tap-gym-ganh-ta-harbinger-5-inch', 'HARBINGER-BELT-5INCH', 'Bảo vệ cột sống lưng dưới và ổn định khoang bụng khi nâng tạ nặng Squat, Deadlift.', 'Đai lưng chuyên nghiệp từ thương hiệu Harbinger USA:\n- Lõi xốp dày 5 inch siêu nhẹ nâng đỡ vùng thắt lưng trọn vẹn, không gây cấn đau xương chậu.\n- Khóa thép không gỉ trượt con lăn căng đai nhanh chóng và chắc chắn.\n- Vải lót thông khí dệt kháng khuẩn hút ẩm cao.', 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=700', 680000, 0, 1, 920, 110, '2026-09-22 13:55:15', '2026-09-22 13:55:15'),
(12, 3, 6, 'Bình Lắc Tập Gym BlenderBottle Pro Series 820ml', 'binh-lac-tap-gym-blenderbottle-pro-series-820ml', 'BLENDER-PRO-820ML', 'Bình pha Whey Protein không vón cục với lò xo kim loại BlenderBall thép không gỉ 316.', 'Bình lắc chất lượng số 1 thế giới:\n- Nhựa Eastman Tritan cao cấp chống bám mùi hôi Protein, không chứa chất độc hại BPA.\n- Nắp bật SpoutGuard chống tràn nước tuyệt đối khi lắc mạnh.\n- Dung tích lớn 820ml có vạch chia ml và ounce rõ ràng.', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700', 260000, 0, 1, 1100, 220, '2026-09-22 13:55:15', '2026-09-22 13:55:15'),
(13, 4, 2, 'Giày Chạy Bộ Nam Adidas Ultraboost Light 2026', 'giay-chay-bo-nam-adidas-ultraboost-light-2026', 'ADI-UB-LIGHT-2026', 'Mẫu Ultraboost nhẹ nhất lịch sử, đệm hoàn trả năng lượng tối đa trên từng bước sải chân.', 'Sự kết hợp hoàn mỹ giữa thời trang đường phố và công nghệ chạy bộ đỉnh cao:\n- Bộ đệm Light BOOST nhẹ hơn 30% so với thế hệ tiền nhiệm, đàn hồi êm ái như bay trên mây.\n- Thân giày dệt Primeknit+ ôm khít bàn chân với độ co giãn linh hoạt và thoáng khí tối ưu.\n- Đế ngoài cao su lốp xe Continental bám đường ướt cực đỉnh, chống mài mòn vượt trội qua hàng nghìn kilomet.', 'assets/images/adidas_ultraboost_light.jpg', 3650000, 1, 1, 3800, 135, '2026-09-22 13:55:15', '2026-09-22 15:48:24'),
(14, 4, 1, 'Giày Chạy Bộ Nike Air Zoom Pegasus 40', 'giay-chay-bo-nike-air-zoom-pegasus-40', 'NIKE-PEGASUS-40', 'Chú ngựa chiến bền bỉ cho runner chạy hàng ngày, đệm React kết hợp 2 túi đệm Zoom Air kép.', 'Đôi giày chạy bộ bán chạy nhất lịch sử Nike:\n- Đệm bọt React siêu nhẹ kết hợp cùng 2 túi đệm Zoom Air ở mũi và gót chân tạo lực bật đàn hồi mượt mà.\n- Cổ giày và lưỡi gà đệm mút dày dặn chống trượt gót chân khi chạy cự ly dài.\n- Thích hợp cho cả người mới tập chạy (5k-10k) lẫn cự ly bán marathon 21km.', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=700', 2750000, 1, 1, 2451, 160, '2026-09-22 13:55:15', '2026-09-22 13:55:15'),
(15, 4, 1, 'Giày Đua Marathon Nike Vaporfly 3', 'giay-dua-marathon-nike-vaporfly-3', 'NIKE-VAPORFLY-3', 'Siêu giày phá vỡ kỷ lục marathon thế giới với đĩa đệm sợi carbon toàn phần Flyplate.', 'Đôi giày trên bục vinh quang của mọi giải chạy marathon danh giá:\n- Đệm bọt ZoomX nhẹ nhất và hoàn trả năng lượng cao nhất của Nike (lên tới 85%).\n- Đĩa sợi Carbon cong toàn chiều dài tạo hiệu ứng đòn bẩy đẩy cơ thể lao về phía trước.\n- Trọng lượng không tưởng chỉ 180g (size 41), thiết kế khí động học xé gió.', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=700', 5890000, 1, 1, 4200, 55, '2026-09-22 13:55:15', '2026-09-22 13:55:15'),
(16, 4, 6, 'Đồng Hồ Thể Thao Chuyên Nghiệp Garmin Forerunner 55', 'dong-ho-the-thao-garmin-forerunner-55', 'GARMIN-FR55-BLK', 'Đồng hồ GPS theo dõi chạy bộ, nhịp tim cổ tay 24/7 và huấn luyện viên ảo Garmin Coach.', 'Người bạn đồng hành số một của mọi vận động viên chạy bộ:\n- Định vị đa vệ tinh GPS/GLONASS/Galileo đo quãng đường, tốc độ pace chính xác tuyệt đối.\n- Đo nhịp tim, nồng độ oxy trong máu, nhịp thở và mức độ căng thẳng năng lượng Body Battery.\n- Thời lượng pin khủng lên đến 14 ngày ở chế độ smartwatch và 20 giờ liên tục khi bật GPS.', 'https://images.unsplash.com/photo-1510017803434-a899398421b3?w=700', 4490000, 1, 1, 2607, 73, '2026-09-22 13:55:15', '2026-09-22 15:48:22');

-- Dữ liệu bảng: product_images (16 bản ghi)
INSERT INTO `product_images` (`id`, `product_id`, `image_url`, `is_primary`, `sort_order`) VALUES
(1, 1, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700', 1, 1),
(2, 2, 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=700', 1, 1),
(3, 3, 'https://images.unsplash.com/photo-1614632537197-1871f30ce5a5?w=700', 1, 1),
(4, 4, 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=700', 1, 1),
(5, 5, 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=700', 1, 1),
(6, 6, 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=700', 1, 1),
(7, 7, 'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?w=700', 1, 1),
(8, 8, 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=700', 1, 1),
(9, 9, 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=700', 1, 1),
(10, 10, 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=700', 1, 1),
(11, 11, 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=700', 1, 1),
(12, 12, 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700', 1, 1),
(13, 13, 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=700', 1, 1),
(14, 14, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=700', 1, 1),
(15, 15, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=700', 1, 1),
(16, 16, 'https://images.unsplash.com/photo-1510017803434-a899398421b3?w=700', 1, 1);

-- Dữ liệu bảng: product_variants (37 bản ghi)
INSERT INTO `product_variants` (`id`, `product_id`, `sku_variant`, `size`, `color`, `price`, `compare_at_price`, `stock_quantity`, `weight_grams`, `image_url`, `is_active`, `created_at`) VALUES
(1, 1, 'NIKE-VAPOR15-TF-39', '39', 'Hồng Tím Phantom', 2850000, 3200000, 9, 500, NULL, 1, '2026-09-22 13:55:15'),
(2, 1, 'NIKE-VAPOR15-TF-40', '40', 'Hồng Tím Phantom', 2850000, 3200000, 24, 500, NULL, 1, '2026-09-22 13:55:15'),
(3, 1, 'NIKE-VAPOR15-TF-41', '41', 'Hồng Tím Phantom', 2850000, 3200000, 30, 500, NULL, 1, '2026-09-22 13:55:15'),
(4, 1, 'NIKE-VAPOR15-TF-42', '42', 'Hồng Tím Phantom', 2850000, 3200000, 18, 500, NULL, 1, '2026-09-22 13:55:15'),
(5, 1, 'NIKE-VAPOR15-TF-43', '43', 'Hồng Tím Phantom', 2850000, 3200000, 10, 500, NULL, 1, '2026-09-22 13:55:15'),
(6, 2, 'MIZ-NEO3-40', '40', 'Trắng / Xanh Hologram', 2790000, 3100000, 12, 500, NULL, 1, '2026-09-22 13:55:15'),
(7, 2, 'MIZ-NEO3-41', '41', 'Trắng / Xanh Hologram', 2790000, 3100000, 20, 500, NULL, 1, '2026-09-22 13:55:15'),
(8, 2, 'MIZ-NEO3-42', '42', 'Trắng / Xanh Hologram', 2790000, 3100000, 16, 500, NULL, 1, '2026-09-22 13:55:15'),
(9, 3, 'DL-BALL-UHV205-SZ5', 'Số 5 (Thi Đấu Chuẩn)', 'Trắng Hoa Văn Xanh Đen', 890000, 990000, 45, 500, NULL, 1, '2026-09-22 13:55:15'),
(10, 4, 'NIKE-GK-VG3-SZ8', 'Size 8', 'Vàng Chanh / Đen', 2150000, 2400000, 8, 500, NULL, 1, '2026-09-22 13:55:15'),
(11, 4, 'NIKE-GK-VG3-SZ9', 'Size 9', 'Vàng Chanh / Đen', 2150000, 2400000, 14, 500, NULL, 1, '2026-09-22 13:55:15'),
(12, 4, 'NIKE-GK-VG3-SZ10', 'Size 10', 'Vàng Chanh / Đen', 2150000, 2400000, 6, 500, NULL, 1, '2026-09-22 13:55:15'),
(13, 5, 'YONEX-AX88D-3UG5', '3U-G5 (88g, Nặng)', 'Đen / Vàng Camel', 4150000, 4650000, 10, 500, NULL, 1, '2026-09-22 13:55:15'),
(14, 5, 'YONEX-AX88D-4UG5', '4U-G5 (83g, Vừa tay)', 'Đen / Vàng Camel', 4150000, 4650000, 25, 500, NULL, 1, '2026-09-22 13:55:15'),
(15, 6, 'YONEX-NF800-4UG5', '4U-G5 (83g)', 'Xanh Đen Midnight', 3950000, 4400000, 18, 500, NULL, 1, '2026-09-22 13:55:15'),
(16, 7, 'YONEX-65Z3-40', '40', 'Trắng / Cam', 2950000, 3300000, 14, 500, NULL, 1, '2026-09-22 13:55:15'),
(17, 7, 'YONEX-65Z3-41', '41', 'Trắng / Cam', 2950000, 3300000, 22, 500, NULL, 1, '2026-09-22 13:55:15'),
(18, 7, 'YONEX-65Z3-42', '42', 'Trắng / Cam', 2950000, 3300000, 16, 500, NULL, 1, '2026-09-22 13:55:15'),
(19, 8, 'WILSON-PS97-G2', 'Cán số 2 (4 1/4)', 'Đồng ánh kim Bronze', 5200000, 5800000, 7, 500, NULL, 1, '2026-09-22 13:55:15'),
(20, 8, 'WILSON-PS97-G3', 'Cán số 3 (4 3/8)', 'Đồng ánh kim Bronze', 5200000, 5800000, 5, 500, NULL, 1, '2026-09-22 13:55:15'),
(21, 9, 'BOWFLEX-ST552-PAIR', 'Cặp 2 quả (2.5kg - 24kg/quả)', 'Đen / Viền Đỏ Thể Thao', 4650000, 5200000, 12, 500, NULL, 1, '2026-09-22 13:55:15'),
(22, 10, 'AOLIKES-PB-FULLSET', 'Bộ Đầy Đủ 4 Dây', '4 Màu Phân Biệt Kháng Lực', 380000, 450000, 60, 500, NULL, 1, '2026-09-22 13:55:15'),
(23, 11, 'HARB-BELT-M', 'Size M (Vòng eo 73 - 84cm)', 'Đen Toàn Phần', 680000, 750000, 20, 500, NULL, 1, '2026-09-22 13:55:15'),
(24, 11, 'HARB-BELT-L', 'Size L (Vòng eo 84 - 94cm)', 'Đen Toàn Phần', 680000, 750000, 18, 500, NULL, 1, '2026-09-22 13:55:15'),
(25, 12, 'BLENDER-PRO-BLK', '820ml', 'Đen Khói Trong Suốt', 260000, 290000, 35, 500, NULL, 1, '2026-09-22 13:55:15'),
(26, 12, 'BLENDER-PRO-BLU', '820ml', 'Xanh Navy Trong Suốt', 260000, 290000, 25, 500, NULL, 1, '2026-09-22 13:55:15'),
(27, 13, 'ADI-UB-40', '40', 'Trắng Core Black', 3650000, 4200000, 15, 500, NULL, 1, '2026-09-22 13:55:15'),
(28, 13, 'ADI-UB-41', '41', 'Trắng Core Black', 3650000, 4200000, 25, 500, NULL, 1, '2026-09-22 13:55:15'),
(29, 13, 'ADI-UB-42', '42', 'Trắng Core Black', 3650000, 4200000, 18, 500, NULL, 1, '2026-09-22 13:55:15'),
(30, 14, 'NIKE-PEG40-40', '40', 'Đen / Xanh Volt Dạ Quang', 2750000, 3100000, 18, 500, NULL, 1, '2026-09-22 13:55:15'),
(31, 14, 'NIKE-PEG40-41', '41', 'Đen / Xanh Volt Dạ Quang', 2750000, 3100000, 28, 500, NULL, 1, '2026-09-22 13:55:15'),
(32, 14, 'NIKE-PEG40-42', '42', 'Đen / Xanh Volt Dạ Quang', 2750000, 3100000, 20, 500, NULL, 1, '2026-09-22 13:55:15'),
(33, 15, 'NIKE-VF3-40', '40', 'Hồng Volt Neon Racing', 5890000, 6500000, 8, 500, NULL, 1, '2026-09-22 13:55:15'),
(34, 15, 'NIKE-VF3-41', '41', 'Hồng Volt Neon Racing', 5890000, 6500000, 12, 500, NULL, 1, '2026-09-22 13:55:15'),
(35, 15, 'NIKE-VF3-42', '42', 'Hồng Volt Neon Racing', 5890000, 6500000, 10, 500, NULL, 1, '2026-09-22 13:55:15'),
(36, 16, 'GARMIN-FR55-BLK', 'Mặt 42mm (Dây 20mm)', 'Đen Nhám Cổ Điển', 4490000, 4990000, 15, 500, NULL, 1, '2026-09-22 13:55:15'),
(37, 16, 'GARMIN-FR55-WHT', 'Mặt 42mm (Dây 20mm)', 'Trắng Băng Tuyết', 4490000, 4990000, 9, 500, NULL, 1, '2026-09-22 13:55:15');

-- Dữ liệu bảng: coupons (6 bản ghi)
INSERT INTO `coupons` (`id`, `code`, `description`, `discount_type`, `discount_value`, `min_order_value`, `max_discount_amount`, `usage_limit`, `used_count`, `start_date`, `end_date`, `is_active`, `created_at`) VALUES
(1, 'WELCOME10', 'Giảm 10% cho đơn hàng đầu tiên (Tối đa 100.000đ)', 'percentage', 10, 300000, 100000, 500, 4, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1, '2026-09-22 13:55:15'),
(2, 'SPORTZONE50', 'Giảm trực tiếp 50.000đ cho đơn từ 500.000đ', 'fixed_amount', 50000, 500000, 50000, 200, 0, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1, '2026-09-22 13:55:15'),
(3, 'VIPYONEX', 'Ưu đãi 15% cho trang thiết bị Cầu lông & Tennis', 'percentage', 15, 1000000, 300000, 100, 0, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1, '2026-09-22 13:55:15'),
(4, 'FREESHIP', 'Miễn phí vận chuyển toàn quốc cho đơn từ 400.000đ', 'fixed_amount', 30000, 400000, 30000, 1000, 0, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1, '2026-09-22 13:55:15'),
(5, 'TESTSALE_7869', 'Giảm giá kiểm thử tự động', 'percentage', 15, 100000, NULL, 50, 0, '2026-09-22 00:00:00', '2026-09-23 23:59:59', 1, '2026-09-22 13:57:57'),
(7, 'TESTSALE_6331', 'Giảm giá kiểm thử tự động', 'percentage', 15, 100000, NULL, 50, 0, '2026-09-22 00:00:00', '2026-09-23 23:59:59', 1, '2026-09-22 14:15:16');

-- Dữ liệu bảng: orders (13 bản ghi)
INSERT INTO `orders` (`id`, `order_code`, `user_id`, `receiver_name`, `receiver_phone`, `shipping_address`, `subtotal`, `shipping_fee`, `discount_amount`, `coupon_id`, `total_amount`, `payment_method`, `payment_status`, `order_status`, `note`, `created_at`, `updated_at`) VALUES
(1, 'DH20260916001', 3, 'Trần Minh Khang', '0987654321', 'Số 120 Hoàng Hoa Thám, Phường 12, Quận Tân Bình, Hồ Chí Minh', 2840000, 30000, 100000, NULL, 2770000, 'banking', 'paid', 'shipping', 'Giao hàng giờ hành chính giúp tôi', '2026-09-15 14:30:00', '2026-09-16 01:16:57'),
(2, 'DH202609166144', NULL, 'Khách Mua Thật', '0988776655', 'Tòa nhà Thể Thao, Hà Nội', 1950000, 0, 100000, NULL, 1850000, 'cod', 'unpaid', 'pending', NULL, '2026-09-16 01:22:07', '2026-09-16 01:22:07'),
(3, 'DH202609222212', 7, 'Người Nhận Test', '0988888888', 'Số 99 Đường Thể Thao, Q1, TPHCM', 6800000, 0, 0, NULL, 6800000, 'banking', 'unpaid', 'cancelled', NULL, '2026-09-22 13:50:45', '2026-09-22 13:50:45'),
(4, 'DH202609227313', 8, 'dotandu', '0363332841', 'LỤIDSCFHUBVFJDVHNB', 3400000, 0, 0, NULL, 3400000, 'banking', 'unpaid', 'pending', 'JHSVDBFDFV', '2026-09-22 13:53:32', '2026-09-22 13:53:32'),
(5, 'DH202609225015', NULL, 'Khách Hàng Test MoMo', '0987654321', 'Tòa nhà Landmark 81, P.22, Q. Bình Thạnh, TP.HCM', 2850000, 0, 100000, 1, 2750000, 'momo', 'unpaid', 'pending', NULL, '2026-09-22 13:57:29', '2026-09-22 13:57:29'),
(6, 'DH202609225128', 10, 'Người Nhận Test', '0988888888', 'Số 99 Đường Thể Thao, Q1, TPHCM', 8980000, 0, 0, NULL, 8980000, 'banking', 'unpaid', 'cancelled', NULL, '2026-09-22 13:57:57', '2026-09-22 13:57:57'),
(7, 'DH202609227268', NULL, 'Khách Hàng Test MoMo', '0987654321', 'Tòa nhà Landmark 81, P.22, Q. Bình Thạnh, TP.HCM', 2850000, 0, 100000, 1, 2750000, 'momo', 'unpaid', 'pending', NULL, '2026-09-22 13:58:02', '2026-09-22 13:58:02'),
(8, 'DH202609228988', 8, 'dotandu', '10923u139523', 'ádasds', 4490000, 0, 0, NULL, 4490000, 'momo', 'unpaid', 'pending', 'ádsad', '2026-09-22 14:01:33', '2026-09-22 14:01:33'),
(9, 'DH202609225343', NULL, 'Test Khách Trừ Kho', '0987654321', 'Quận 1, TP Hồ Chí Minh', 5700000, 0, 0, NULL, 5700000, 'banking', 'unpaid', 'pending', NULL, '2026-09-22 14:15:10', '2026-09-22 14:15:10'),
(10, 'DH202609229379', NULL, 'Test Khách MoMo', '0987654321', 'Quận 3, TP Hồ Chí Minh', 2850000, 0, 0, NULL, 2850000, 'momo', 'unpaid', 'pending', NULL, '2026-09-22 14:15:10', '2026-09-22 14:15:10'),
(11, 'DH202609226395', 12, 'Người Nhận Test', '0988888888', 'Số 99 Đường Thể Thao, Q1, TPHCM', 8980000, 0, 0, NULL, 8980000, 'banking', 'unpaid', 'cancelled', NULL, '2026-09-22 14:15:16', '2026-09-22 14:15:16'),
(12, 'DH202609225508', NULL, 'Khách Mua Thật', '0988776655', 'Tòa nhà Thể Thao, Hà Nội', 2850000, 0, 100000, 1, 2750000, 'cod', 'unpaid', 'pending', NULL, '2026-09-22 14:21:40', '2026-09-22 14:21:40'),
(13, 'DH202609228014', 1, 'Admin Thể Thao', '2312321321', 'Ohio', 2750000, 0, 100000, 1, 2650000, 'momo', 'unpaid', 'cancelled', NULL, '2026-09-22 14:25:05', '2026-09-22 16:12:25');

-- Dữ liệu bảng: order_items (9 bản ghi)
INSERT INTO `order_items` (`id`, `order_id`, `product_variant_id`, `product_name`, `variant_label`, `unit_price`, `quantity`, `total_price`) VALUES
(6, 5, 1, 'Giày Đá Bóng Nike Zoom Mercurial Vapor 15 Pro TF', 'Size: 39 - Màu: Hồng Tím Phantom', 2850000, 1, 2850000),
(7, 6, 37, 'Đồng Hồ Thể Thao Chuyên Nghiệp Garmin Forerunner 55', 'Size: Mặt 42mm (Dây 20mm) - Màu: Trắng Băng Tuyết', 4490000, 2, 8980000),
(8, 7, 1, 'Giày Đá Bóng Nike Zoom Mercurial Vapor 15 Pro TF', 'Size: 39 - Màu: Hồng Tím Phantom', 2850000, 1, 2850000),
(9, 8, 37, 'Đồng Hồ Thể Thao Chuyên Nghiệp Garmin Forerunner 55', 'Size: Mặt 42mm (Dây 20mm) - Màu: Trắng Băng Tuyết', 4490000, 1, 4490000),
(10, 9, 1, 'Giày Đá Bóng Nike Zoom Mercurial Vapor 15 Pro TF', 'Size: 39 - Màu: Hồng Tím Phantom', 2850000, 2, 5700000),
(11, 10, 1, 'Giày Đá Bóng Nike Zoom Mercurial Vapor 15 Pro TF', 'Size: 39 - Màu: Hồng Tím Phantom', 2850000, 1, 2850000),
(12, 11, 37, 'Đồng Hồ Thể Thao Chuyên Nghiệp Garmin Forerunner 55', 'Size: Mặt 42mm (Dây 20mm) - Màu: Trắng Băng Tuyết', 4490000, 2, 8980000),
(13, 12, 1, 'Giày Đá Bóng Nike Zoom Mercurial Vapor 15 Pro TF', 'Size: 39 - Màu: Hồng Tím Phantom', 2850000, 1, 2850000),
(14, 13, 30, 'Giày Chạy Bộ Nike Air Zoom Pegasus 40', 'Size: 40 - Màu: Đen / Xanh Volt Dạ Quang', 2750000, 1, 2750000);

-- Dữ liệu bảng: order_timeline (12 bản ghi)
INSERT INTO `order_timeline` (`id`, `order_id`, `status`, `note`, `created_by`, `created_at`) VALUES
(9, 5, 'pending', 'Khách hàng đặt đơn hàng mới thành công', 'Hệ thống', '2026-09-22 13:57:29'),
(10, 6, 'pending', 'Khách hàng đặt đơn hàng mới thành công', 'Hệ thống', '2026-09-22 13:57:57'),
(11, 6, 'cancelled', 'Khách hủy đơn hàng: Tôi muốn đổi size giày khác', 'Khách hàng', '2026-09-22 13:57:57'),
(12, 7, 'pending', 'Khách hàng đặt đơn hàng mới thành công', 'Hệ thống', '2026-09-22 13:58:02'),
(13, 8, 'pending', 'Khách hàng đặt đơn hàng mới thành công', 'Hệ thống', '2026-09-22 14:01:33'),
(14, 9, 'pending', 'Khách hàng đặt đơn hàng mới thành công', 'Hệ thống', '2026-09-22 14:15:10'),
(15, 10, 'pending', 'Khách hàng đặt đơn hàng mới thành công', 'Hệ thống', '2026-09-22 14:15:10'),
(16, 11, 'pending', 'Khách hàng đặt đơn hàng mới thành công', 'Hệ thống', '2026-09-22 14:15:16'),
(17, 11, 'cancelled', 'Khách hủy đơn hàng: Tôi muốn đổi size giày khác', 'Khách hàng', '2026-09-22 14:15:16'),
(18, 12, 'pending', 'Khách hàng đặt đơn hàng mới thành công', 'Hệ thống', '2026-09-22 14:21:40'),
(19, 13, 'pending', 'Khách hàng đặt đơn hàng mới thành công', 'Hệ thống', '2026-09-22 14:25:05'),
(20, 13, 'cancelled', 'Khách hủy đơn hàng: Thay đổi nhu cầu mua sắm', 'Khách hàng', '2026-09-22 16:12:25');

-- Dữ liệu bảng: carts (7 bản ghi)
INSERT INTO `carts` (`id`, `user_id`, `session_id`, `created_at`, `updated_at`) VALUES
(1, 4, 'sess_thao_9921', '2026-09-16 07:00:00', '2026-09-16 01:16:57'),
(2, NULL, 'guest_vvs3he049x_1789522225611', '2026-09-16 01:30:25', '2026-09-16 01:30:25'),
(3, 1, 'guest_vvs3he049x_1789522225611', '2026-09-16 01:32:59', '2026-09-16 01:32:59'),
(4, NULL, 'guest_fr7kpfemt6_1790085104354', '2026-09-22 13:51:44', '2026-09-22 13:51:44'),
(5, 8, 'guest_fr7kpfemt6_1790085104354', '2026-09-22 13:53:00', '2026-09-22 13:53:00'),
(6, NULL, 'guest_mde8tmkn2k_1790086984366', '2026-09-22 14:23:04', '2026-09-22 14:23:04'),
(7, NULL, 'guest_kle8rpwn4y_1790087530298', '2026-09-22 14:32:10', '2026-09-22 14:32:10');

-- Dữ liệu bảng: reviews (13 bản ghi)
INSERT INTO `reviews` (`id`, `product_id`, `user_id`, `order_id`, `rating`, `comment`, `review_images`, `is_verified_buyer`, `status`, `created_at`) VALUES
(1, 1, 3, NULL, 5, 'Đệm Air Zoom rất êm, chạy cả trận không bị thốn gót chân. Form ôm chân chuẩn Nike.', NULL, 1, 'approved', '2026-09-22 13:55:15'),
(2, 1, 4, NULL, 5, 'Giày bám sân tốt, đá mưa nhỏ không bị trơn trượt. Đóng gói hộp rất cẩn thận!', NULL, 1, 'approved', '2026-09-22 13:55:15'),
(3, 2, 3, NULL, 5, 'Chân bè mang Mizuno là chân ái. Da thật mềm dẻo sút mu bóng đi rất căng.', NULL, 1, 'approved', '2026-09-22 13:55:15'),
(4, 3, 4, NULL, 5, 'Bóng nảy êm, đá đầm chân và không bị thấm nước khi đá trời mưa.', NULL, 1, 'approved', '2026-09-22 13:55:15'),
(5, 5, 3, NULL, 5, 'Cây vợt đập cầu sướng nhất từng chơi. Lực cổ tay khá là smash cắm sân luôn!', NULL, 1, 'approved', '2026-09-22 13:55:15'),
(6, 7, 4, NULL, 5, 'Đế bám thảm cầu lông cực tốt, nhảy đập cầu tiếp đất không bị đau gối.', NULL, 1, 'approved', '2026-09-22 13:55:15'),
(7, 9, 3, NULL, 5, 'Cực kỳ tiện lợi, tiết kiệm diện tích phòng ngủ mà tập đủ bài vai, ngực, tay trước.', NULL, 1, 'approved', '2026-09-22 13:55:15'),
(8, 10, 4, NULL, 5, 'Dây rất dày dặn, tập hỗ trợ kéo xà đơn êm và an toàn.', NULL, 1, 'approved', '2026-09-22 13:55:15'),
(9, 13, 4, NULL, 5, 'Đế đi êm ái, chạy 10km đường nhựa về chân vẫn khỏe re.', NULL, 1, 'approved', '2026-09-22 13:55:15'),
(10, 16, 3, NULL, 5, 'Bắt GPS cực nhanh, pin trâu chạy cả tuần chỉ sạc 1 lần.', NULL, 1, 'approved', '2026-09-22 13:55:15'),
(11, 16, 10, NULL, 5, 'Giày đi rất êm và bền, giao hàng siêu nhanh!', NULL, 0, 'approved', '2026-09-22 13:57:57'),
(12, 16, 12, NULL, 5, 'Giày đi rất êm và bền, giao hàng siêu nhanh!', NULL, 0, 'approved', '2026-09-22 14:15:16'),
(13, 14, 1, NULL, 5, 'very good', NULL, 0, 'approved', '2026-09-22 14:24:32');

-- Dữ liệu bảng: wishlists (2 bản ghi)
INSERT INTO `wishlists` (`id`, `user_id`, `product_id`, `created_at`) VALUES
(2, 10, 1, '2026-09-22 13:57:57'),
(3, 12, 1, '2026-09-22 14:15:16');

-- Dữ liệu bảng: coupon_usages (1 bản ghi)
INSERT INTO `coupon_usages` (`id`, `coupon_id`, `user_id`, `order_id`, `used_at`) VALUES
(1, 1, 1, 13, '2026-09-22 14:25:05');

-- Dữ liệu bảng: payment_transactions (7 bản ghi)
INSERT INTO `payment_transactions` (`id`, `order_id`, `gateway`, `transaction_code`, `amount`, `status`, `payment_url`, `gateway_response`, `created_at`) VALUES
(3, 5, 'momo', 'DH202609225015', 2750000, 'pending', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=2%7C99%7C0987654321%7CNGUYEN%20VAN%20QUAN%20TRI%7Ccskh%40sportzone.vn%7C0%7C0%7C2750000%7CDH202609225015%7Ctransfer_p2p', NULL, '2026-09-22 13:57:29'),
(4, 6, 'vietqr', 'DH202609225128', 8980000, 'pending', 'https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=8980000&addInfo=DH202609225128&accountName=NGUYEN%20VAN%20QUAN%20TRI', NULL, '2026-09-22 13:57:57'),
(5, 7, 'momo', 'DH202609227268', 2750000, 'pending', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=2%7C99%7C0987654321%7CNGUYEN%20VAN%20QUAN%20TRI%7Ccskh%40sportzone.vn%7C0%7C0%7C2750000%7CDH202609227268%7Ctransfer_p2p', NULL, '2026-09-22 13:58:02'),
(6, 9, 'vietqr', 'DH202609225343', 5700000, 'pending', 'assets/images/qr_vietqr.png', NULL, '2026-09-22 14:15:10'),
(7, 10, 'momo', 'DH202609229379', 2850000, 'pending', 'assets/images/qr_momo.png', NULL, '2026-09-22 14:15:10'),
(8, 11, 'vietqr', 'DH202609226395', 8980000, 'pending', 'assets/images/qr_vietqr.png', NULL, '2026-09-22 14:15:16'),
(9, 13, 'momo', 'DH202609228014', 2650000, 'pending', 'assets/images/qr_momo.png', NULL, '2026-09-22 14:25:05');

-- Dữ liệu bảng: inventory_logs (12 bản ghi)
INSERT INTO `inventory_logs` (`id`, `product_variant_id`, `change_type`, `quantity_change`, `previous_quantity`, `new_quantity`, `reference_id`, `note`, `created_by`, `created_at`) VALUES
(4, 1, 'order_sale', -1, 15, 14, 'DH202609225015', 'Bán theo đơn DH202609225015', 'Hệ thống', '2026-09-22 13:57:29'),
(5, 37, 'order_sale', -2, 10, 8, 'DH202609225128', 'Bán theo đơn DH202609225128', 'Hệ thống', '2026-09-22 13:57:57'),
(6, 37, 'order_cancel_restock', 2, 8, 10, 'DH202609225128', 'Hoàn kho do khách hủy đơn: Tôi muốn đổi size giày khác', 'Khách hàng', '2026-09-22 13:57:57'),
(7, 1, 'order_sale', -1, 14, 13, 'DH202609227268', 'Bán theo đơn DH202609227268', 'Hệ thống', '2026-09-22 13:58:02'),
(8, 37, 'order_sale', -1, 10, 9, 'DH202609228988', 'Bán theo đơn DH202609228988', 'Hệ thống', '2026-09-22 14:01:33'),
(9, 1, 'order_sale', -2, 13, 11, 'DH202609225343', 'Bán theo đơn DH202609225343', 'Hệ thống', '2026-09-22 14:15:10'),
(10, 1, 'order_sale', -1, 11, 10, 'DH202609229379', 'Bán theo đơn DH202609229379', 'Hệ thống', '2026-09-22 14:15:10'),
(11, 37, 'order_sale', -2, 9, 7, 'DH202609226395', 'Bán theo đơn DH202609226395', 'Hệ thống', '2026-09-22 14:15:16'),
(12, 37, 'order_cancel_restock', 2, 7, 9, 'DH202609226395', 'Hoàn kho do khách hủy đơn: Tôi muốn đổi size giày khác', 'Khách hàng', '2026-09-22 14:15:16'),
(13, 1, 'order_sale', -1, 10, 9, 'DH202609225508', 'Bán theo đơn DH202609225508', 'Hệ thống', '2026-09-22 14:21:40'),
(14, 30, 'order_sale', -1, 18, 17, 'DH202609228014', 'Bán theo đơn DH202609228014', 'Hệ thống', '2026-09-22 14:25:05'),
(15, 30, 'order_cancel_restock', 1, 17, 18, 'DH202609228014', 'Hoàn kho do khách hủy đơn: Thay đổi nhu cầu mua sắm', 'Khách hàng', '2026-09-22 16:12:25');

SET FOREIGN_KEY_CHECKS = 1;

-- HOÀN TẤT NẠP DỮ LIỆU SPORTZONE --
