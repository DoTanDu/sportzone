-- ==========================================================
-- DỮ LIỆU KHỞI TẠO MẪU (SEED DATA) - DỤNG CỤ THỂ THAO
-- ==========================================================

-- 1. NGƯỜI DÙNG (USERS)
-- Mật khẩu mặc định: admin cho Admin, 123456 cho các tài khoản khác
INSERT INTO users (id, full_name, email, phone, password_hash, role, status) VALUES
(1, 'Admin Thể Thao', 'admin@sportstore.vn', '0901234567', '$2a$10$FamihScHpyPGaO0dJShqjufiqsiAN0a4//HNoqjmr8UZdh1Zj9zIy', 'admin', 'active'),
(2, 'Nguyễn Văn Nhân Viên', 'staff@sportstore.vn', '0902345678', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'staff', 'active'),
(3, 'Trần Minh Khang (Khách)', 'khang.tran@gmail.com', '0987654321', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'customer', 'active'),
(4, 'Lê Thị Thu Thảo', 'thao.le@gmail.com', '0912987654', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'customer', 'active');

-- 2. SỔ ĐỊA CHỈ (ADDRESSES)
INSERT INTO addresses (id, user_id, receiver_name, receiver_phone, street_address, ward, district, city_province, is_default) VALUES
(1, 3, 'Trần Minh Khang', '0987654321', 'Số 120 Hoàng Hoa Thám', 'Phường 12', 'Quận Tân Bình', 'Hồ Chí Minh', 1),
(2, 3, 'Trần Minh Khang (Cơ quan)', '0987654321', 'Tòa nhà Landmark 81, 720A Điện Biên Phủ', 'Phường 22', 'Quận Bình Thạnh', 'Hồ Chí Minh', 0),
(3, 4, 'Lê Thị Thu Thảo', '0912987654', 'Số 45 Tràng Tiền', 'Phường Tràng Tiền', 'Quận Hoàn Kiếm', 'Hà Nội', 1);

-- 3. DANH MỤC THỂ THAO (CATEGORIES)
INSERT INTO categories (id, name, slug, icon, parent_id, sort_order) VALUES
(1, 'Bóng Đá', 'bong-da', 'fa-futbol', NULL, 1),
(2, 'Cầu Lông & Tennis', 'cau-long-tennis', 'fa-table-tennis-paddle-ball', NULL, 2),
(3, 'Gym & Thể Hình', 'gym-the-hinh', 'fa-dumbbell', NULL, 3),
(4, 'Chạy Bộ & Điền Kinh', 'chay-bo-dien-kinh', 'fa-person-running', NULL, 4),
(5, 'Bơi Lội & Phụ Kiện', 'boi-loi-phu-kien', 'fa-person-swimming', NULL, 5),

-- Danh mục con cho Bóng Đá
(6, 'Giày Đá Bóng Sân Cỏ Nhân Tạo', 'giay-da-bong-san-co-nhan-tao', 'fa-shoe-prints', 1, 1),
(7, 'Quần Áo Bóng Đá', 'quan-ao-bong-da', 'fa-shirt', 1, 2),
(8, 'Quả Bóng Đá Thi Đấu', 'qua-bong-da-thi-dau', 'fa-futbol', 1, 3),

-- Danh mục con cho Cầu Lông
(9, 'Vợt Cầu Lông', 'vot-cau-long', 'fa-racquet', 2, 1),
(10, 'Giày Cầu Lông', 'giay-cau-long', 'fa-shoe-prints', 2, 2),

-- Danh mục con cho Gym & Thể Hình
(11, 'Tạ Tay & Tạ Đòn', 'ta-tay-ta-don', 'fa-dumbbell', 3, 1),
(12, 'Phụ Kiện Tập Gym', 'phu-kien-tap-gym', 'fa-mitten', 3, 2);

-- 4. THƯƠNG HIỆU (BRANDS)
INSERT INTO brands (id, name, slug, logo_url, description, origin_country) VALUES
(1, 'Nike', 'nike', 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg', 'Thương hiệu thể thao hàng đầu thế giới từ Mỹ', 'Mỹ'),
(2, 'Adidas', 'adidas', 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg', 'Thương hiệu biểu tượng thể thao Đức với 3 sọc nổi tiếng', 'Đức'),
(3, 'Yonex', 'yonex', 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Yonex_logo.svg', 'Thương hiệu dụng cụ cầu lông số 1 thế giới', 'Nhật Bản'),
(4, 'Lining', 'lining', 'https://upload.wikimedia.org/wikipedia/commons/8/87/Li-Ning_logo.svg', 'Thương hiệu trang thiết bị thể thao đỉnh cao châu Á', 'Trung Quốc'),
(5, 'Mizuno', 'mizuno', 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Mizuno_logo.svg', 'Thương hiệu giày và thiết bị thể thao thủ công Nhật Bản', 'Nhật Bản'),
(6, 'Decathlon', 'decathlon', 'https://upload.wikimedia.org/wikipedia/commons/0/08/Decathlon_Logo.svg', 'Chuỗi bán lẻ và sản xuất đồ thể thao toàn cầu', 'Pháp'),
(7, 'Động Lực', 'dong-luc', '', 'Tập đoàn thể thao hàng đầu Việt Nam, bóng thi đấu V-League', 'Việt Nam');

-- 5. SẢN PHẨM CHÍNH (PRODUCTS)
INSERT INTO products (id, category_id, brand_id, name, slug, sku, short_description, description, thumbnail_url, base_price, is_featured, is_active, view_count, sold_count) VALUES
(1, 6, 1, 'Giày Đá Bóng Nike Zoom Mercurial Vapor 15 Academy TF', 'giay-nike-mercurial-vapor-15-academy-tf', 'NIKE-MERC-TF-01', 'Giày đá bóng sân cỏ nhân tạo cao cấp, đệm Air Zoom êm ái, bám sân cực tốt.', 'Chi tiết sản phẩm:\n- Bộ đệm Air Zoom lò xo giúp bứt tốc tức thì.\n- Đế TF cao su đúc chuyên dụng cho sân cỏ nhân tạo Việt Nam.\n- Upper da tổng hợp Nikeskin mềm mại ôm chân.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 1950000, 1, 1, 1420, 85),

(2, 6, 5, 'Giày Đá Bóng Mizuno Morelia Neo 3 Pro AS', 'giay-mizuno-morelia-neo-3-pro-as', 'MIZ-NEO3-PRO-01', 'Chất liệu da Kangaroo siêu mềm, cảm giác bóng chân thật tuyệt đối.', 'Dòng giày làm nên huyền thoại của Mizuno tại thị trường phủi Việt Nam. Da thật cao cấp, đế đinh dăm bám sân kể cả khi trời mưa nhỏ.', 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600', 2790000, 1, 1, 980, 52),

(3, 8, 7, 'Quả Bóng Đá Động Lực FIFA Quality Pro UHV 2.05', 'qua-bong-da-dong-luc-uhv-205', 'DL-BALL-UHV205', 'Bóng thi đấu chính thức tại giải V-League đạt chuẩn FIFA Quality Pro.', 'Được may thủ công kết hợp ép nhiệt chất lượng cao. Độ nảy chuẩn xác, quỹ đạo bay ổn định không rung lắc.', 'https://images.unsplash.com/photo-1614632537197-1871f30ce5a5?w=600', 890000, 1, 1, 750, 120),

(4, 9, 3, 'Vợt Cầu Lông Yonex Astrox 88D Pro', 'vot-cau-long-yonex-astrox-88d-pro', 'YONEX-AX88D-PRO', 'Vợt chuyên công cho cầu sau, trợ lực đập cầu uy lực chuẩn thi đấu quốc tế.', 'Dành cho người chơi có lực cổ tay tốt đến khá, thiết kế cán và khung cải tiến từ công nghệ Namd cho cú smash cắm và hiểm hóc.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600', 3850000, 1, 1, 2300, 43),

(5, 9, 4, 'Vợt Cầu Lông Lining Axforce 80', 'vot-cau-long-lining-axforce-80', 'LINING-AX80', 'Cây vợt đồng hành cùng tay vợt Chen Long, tấn công hủy diệt và đầm tay.', 'Khung carbon siêu đàn hồi UHB Shaft giảm rung tối đa sau mỗi cú phát lực mạnh.', 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=600', 3600000, 0, 1, 640, 31),

(6, 4, 2, 'Giày Chạy Bộ Nam Adidas Ultraboost Light', 'giay-chay-bo-adidas-ultraboost-light', 'ADI-UB-LIGHT', 'Phiên bản Ultraboost nhẹ nhất lịch sử, hoàn trả năng lượng tối đa.', 'Đế giữa Light BOOST thế hệ mới nhẹ hơn 30%, thân dệt công nghệ Primeknit+ nâng đỡ bàn chân trọn vẹn từng bước chạy.', 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600', 3400000, 1, 1, 1850, 96),

(7, 11, 6, 'Bộ Tạ Tay Cao Cấp Bọc Cao Su Decathlon Domyos 10kg', 'bo-ta-tay-decathlon-domyos-10kg', 'DEC-DUMB-10K', 'Bộ 2 quả tạ đơn gang bọc cao su chống trầy sàn, thiết kế lục giác chống lăn.', 'Lõi bằng gang nguyên khối chắc chắn, phủ lớp cao su bền đẹp không gây ồn khi tiếp xúc sàn nhà.', 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600', 580000, 0, 1, 890, 110),

(8, 12, 6, 'Dây Nhảy Thể Lực Tốc Độ Chuyên Nghiệp', 'day-nhay-the-luc-toc-do', 'DEC-JUMP-ROPE', 'Dây nhảy lõi thép bọc PVC, ổ bi xoay 360 độ êm mượt không bị xoắn rối.', 'Thích hợp cho các bài cardio đốt mỡ, boxing, rèn luyện sức bền và đôi chân linh hoạt.', 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600', 120000, 0, 1, 2100, 350);

-- 6. HÌNH ẢNH SẢN PHẨM (PRODUCT_IMAGES)
INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
(1, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 1, 1),
(1, 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=600', 0, 2),
(2, 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600', 1, 1),
(4, 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600', 1, 1),
(6, 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600', 1, 1);

-- 7. BIẾN THỂ SẢN PHẨM (PRODUCT_VARIANTS)
-- Nike Zoom Mercurial Vapor 15 TF: Các size giày 39, 40, 41, 42, 43
INSERT INTO product_variants (product_id, sku_variant, size, color, price, compare_at_price, stock_quantity, weight_grams) VALUES
(1, 'NIKE-MERC-TF-RED-39', '39', 'Đỏ Đồng/Trắng', 1950000, 2350000, 12, 650),
(1, 'NIKE-MERC-TF-RED-40', '40', 'Đỏ Đồng/Trắng', 1950000, 2350000, 18, 670),
(1, 'NIKE-MERC-TF-RED-41', '41', 'Đỏ Đồng/Trắng', 1950000, 2350000, 25, 690),
(1, 'NIKE-MERC-TF-RED-42', '42', 'Đỏ Đồng/Trắng', 1950000, 2350000, 15, 710),
(1, 'NIKE-MERC-TF-RED-43', '43', 'Đỏ Đồng/Trắng', 1950000, 2350000, 8, 730),

-- Mizuno Morelia Neo 3: Size 40, 41, 42 màu Trắng Xanh
(2, 'MIZ-NEO3-WHT-40', '40', 'Trắng/Xanh Hologram', 2790000, 3100000, 10, 600),
(2, 'MIZ-NEO3-WHT-41', '41', 'Trắng/Xanh Hologram', 2790000, 3100000, 14, 620),
(2, 'MIZ-NEO3-WHT-42', '42', 'Trắng/Xanh Hologram', 2790000, 3100000, 7, 640),

-- Quả bóng đá Động Lực: Size 5 tiêu chuẩn
(3, 'DL-BALL-UHV205-S5', 'Số 5', 'Trắng Hoa Văn Xanh', 890000, 950000, 50, 450),

-- Vợt Yonex Astrox 88D Pro: Trọng lượng 3U/G5 và 4U/G5
(4, 'YONEX-AX88D-PRO-3U', '3U-G5 (88g)', 'Đen/Camel Vàng', 3850000, 4200000, 6, 88),
(4, 'YONEX-AX88D-PRO-4U', '4U-G5 (83g)', 'Đen/Camel Vàng', 3850000, 4200000, 12, 83),

-- Vợt Lining Axforce 80
(5, 'LINING-AX80-4U', '4U-G5 (83g)', 'Đen Nhám Họa Tiết Vàng', 3600000, 3900000, 9, 83),

-- Giày Adidas Ultraboost: Size 40, 41, 42
(6, 'ADI-UB-LGT-BLK-40', '40', 'Đen Core Black', 3400000, 4500000, 10, 680),
(6, 'ADI-UB-LGT-BLK-41', '41', 'Đen Core Black', 3400000, 4500000, 15, 700),
(6, 'ADI-UB-LGT-BLK-42', '42', 'Đen Core Black', 3400000, 4500000, 11, 720),

-- Bộ tạ Decathlon
(7, 'DEC-DUMB-10K-SET', '10kg (Cặp 2x5kg)', 'Đen Nhựa Cao Su', 580000, 650000, 20, 10000),

-- Dây nhảy tốc độ
(8, 'DEC-JUMP-ROPE-STD', 'Tiêu chuẩn 3m', 'Đen Bạc', 120000, 150000, 80, 150);

-- 8. MÃ GIẢM GIÁ (COUPONS)
INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_value, max_discount_amount, usage_limit, used_count, start_date, end_date, is_active) VALUES
(1, 'WELCOME10', 'Giảm 10% cho khách hàng mới, tối đa 100k', 'percentage', 10.00, 200000, 100000, 500, 25, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1),
(2, 'FREESHIP30', 'Giảm 30.000đ phí vận chuyển cho đơn hàng từ 500.000đ', 'fixed_amount', 30000, 500000, 30000, 1000, 142, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1),
(3, 'VIPSPORT100', 'Giảm trực tiếp 100.000đ cho đơn hàng thể thao từ 2.000.000đ', 'fixed_amount', 100000, 2000000, 100000, 200, 18, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1);

-- 9. ĐƠN ĐẶT HÀNG MẪU (ORDERS)
INSERT INTO orders (id, order_code, user_id, receiver_name, receiver_phone, shipping_address, subtotal, shipping_fee, discount_amount, coupon_id, total_amount, payment_method, payment_status, order_status, note, created_at) VALUES
(1, 'DH20260916001', 3, 'Trần Minh Khang', '0987654321', 'Số 120 Hoàng Hoa Thám, Phường 12, Quận Tân Bình, Hồ Chí Minh', 2840000, 30000, 100000, 3, 2770000, 'banking', 'paid', 'shipping', 'Giao hàng giờ hành chính giúp tôi', '2026-09-15 14:30:00');

-- 10. CHI TIẾT ĐƠN HÀNG (ORDER_ITEMS)
-- Khách mua 1 đôi Nike Mercurial size 41 + 1 quả bóng Động lực UHV 2.05
INSERT INTO order_items (id, order_id, product_variant_id, product_name, variant_label, unit_price, quantity, total_price) VALUES
(1, 1, 3, 'Giày Đá Bóng Nike Zoom Mercurial Vapor 15 Academy TF', 'Size: 41 - Màu: Đỏ Đồng/Trắng', 1950000, 1, 1950000),
(2, 1, 8, 'Quả Bóng Đá Động Lực FIFA Quality Pro UHV 2.05', 'Size: Số 5 - Trắng Hoa Văn Xanh', 890000, 1, 890000);

-- 11. DÒNG THỜI GIAN ĐƠN HÀNG (ORDER_TIMELINE)
INSERT INTO order_timeline (id, order_id, status, note, created_by, created_at) VALUES
(1, 1, 'pending', 'Khách hàng tạo đơn hàng mới', 'Hệ thống', '2026-09-15 14:30:00'),
(2, 1, 'confirmed', 'Nhân viên đã xác nhận đơn qua điện thoại', 'Nguyễn Văn Nhân Viên', '2026-09-15 14:45:00'),
(3, 1, 'processing', 'Đã đóng gói hàng và bàn giao cho bưu tá GHTK', 'Kho Tân Bình', '2026-09-15 16:20:00'),
(4, 1, 'shipping', 'Đang vận chuyển giao đến khách', 'GHTK Mã: 83921820', '2026-09-16 08:00:00');

-- 12. GIỎ HÀNG MẪU (CARTS & CART_ITEMS)
INSERT INTO carts (id, user_id, session_id, created_at) VALUES
(1, 4, 'sess_thao_9921', '2026-09-16 07:00:00');

INSERT INTO cart_items (id, cart_id, product_variant_id, quantity) VALUES
(1, 1, 10, 1); -- Vợt Yonex Astrox 88D Pro bản 4U

-- 13. ĐÁNH GIÁ SẢN PHẨM MẪU (REVIEWS)
INSERT INTO reviews (id, product_id, user_id, order_id, rating, comment, is_verified_buyer, status, created_at) VALUES
(1, 1, 3, 1, 5, 'Giày đá ôm chân tuyệt vời, đệm êm giảm chấn tốt trên sân cỏ nhân tạo, form chuẩn chân thon.', 1, 'approved', '2026-09-16 08:10:00'),
(2, 4, 3, NULL, 5, 'Cây vợt smash uy lực nhất mình từng đánh, đầm tay và cầu đi cực cắm!', 0, 'approved', '2026-09-14 20:15:00');
