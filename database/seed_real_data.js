const { run, query } = require('../backend/src/config/db');

async function seedRealData() {
  console.log('🔄 Đang tiến hành nạp Dữ Liệu Thể Thao Thật vào Cơ sở dữ liệu...');

  // 1. Xóa dữ liệu cũ của sản phẩm & biến thể & reviews
  await run('DELETE FROM reviews;');
  await run('DELETE FROM cart_items;');
  await run('DELETE FROM order_items;');
  await run('DELETE FROM order_timeline;');
  await run('DELETE FROM payment_transactions;');
  await run('DELETE FROM inventory_logs;');
  await run('DELETE FROM coupon_usages;');
  await run('DELETE FROM wishlists;');
  await run('DELETE FROM product_variants;');
  await run('DELETE FROM product_images;');
  await run('DELETE FROM products;');
  await run('DELETE FROM coupons;');

  // Reset AUTOINCREMENT cho SQLite
  await run("DELETE FROM sqlite_sequence WHERE name IN ('products', 'product_variants', 'product_images', 'reviews', 'coupons');").catch(() => {});

  // 2. Nạp Coupons thật
  const coupons = [
    {
      code: 'WELCOME10',
      description: 'Giảm 10% cho đơn hàng đầu tiên (Tối đa 100.000đ)',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_value: 300000,
      max_discount_amount: 100000,
      usage_limit: 500,
      start_date: '2026-01-01 00:00:00',
      end_date: '2026-12-31 23:59:59'
    },
    {
      code: 'SPORTZONE50',
      description: 'Giảm trực tiếp 50.000đ cho đơn từ 500.000đ',
      discount_type: 'fixed_amount',
      discount_value: 50000,
      min_order_value: 500000,
      max_discount_amount: 50000,
      usage_limit: 200,
      start_date: '2026-01-01 00:00:00',
      end_date: '2026-12-31 23:59:59'
    },
    {
      code: 'VIPYONEX',
      description: 'Ưu đãi 15% cho trang thiết bị Cầu lông & Tennis',
      discount_type: 'percentage',
      discount_value: 15,
      min_order_value: 1000000,
      max_discount_amount: 300000,
      usage_limit: 100,
      start_date: '2026-01-01 00:00:00',
      end_date: '2026-12-31 23:59:59'
    },
    {
      code: 'FREESHIP',
      description: 'Miễn phí vận chuyển toàn quốc cho đơn từ 400.000đ',
      discount_type: 'fixed_amount',
      discount_value: 30000,
      min_order_value: 400000,
      max_discount_amount: 30000,
      usage_limit: 1000,
      start_date: '2026-01-01 00:00:00',
      end_date: '2026-12-31 23:59:59'
    }
  ];

  for (const c of coupons) {
    await run(
      `INSERT INTO coupons (code, description, discount_type, discount_value, min_order_value, max_discount_amount, usage_limit, used_count, start_date, end_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1)`,
      [c.code, c.description, c.discount_type, c.discount_value, c.min_order_value, c.max_discount_amount, c.usage_limit, c.start_date, c.end_date]
    );
  }

  // 3. Danh sách 16 Sản Phẩm Thật Sát Thị Trường Việt Nam 2026
  const products = [
    // BÓNG ĐÁ
    {
      category_id: 1,
      brand_id: 1, // Nike
      name: 'Giày Đá Bóng Nike Zoom Mercurial Vapor 15 Pro TF',
      slug: 'giay-da-bong-nike-zoom-mercurial-vapor-15-pro-tf',
      sku: 'NIKE-VAPOR15-PRO-TF',
      short_description: 'Giày đá bóng sân cỏ nhân tạo cao cấp trang bị túi đệm khí Air Zoom 3/4 lò xo hoàn trả năng lượng cực nhạy.',
      description: `Chi tiết sản phẩm chính hãng:
- Bộ đệm Air Zoom chuyên dụng đặt ở đế giày tạo lực đẩy tức thì trong từng pha bứt tốc.
- Thân giày Flyknit co giãn kết hợp công nghệ Hyperscreen tăng cường độ ma sát và kiểm soát bóng chính xác.
- Đế ngoài cao su đinh dăm Tri-star hình ngôi sao ba cánh bám sân cỏ nhân tạo cực tốt trong mọi điều kiện thời tiết.
- Trọng lượng siêu nhẹ: ~230g/chiếc size 41.`,
      thumbnail_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700',
      base_price: 2850000,
      is_featured: 1,
      view_count: 3520,
      sold_count: 142,
      variants: [
        { sku_variant: 'NIKE-VAPOR15-TF-39', size: '39', color: 'Hồng Tím Phantom', price: 2850000, compare_at_price: 3200000, stock_quantity: 15 },
        { sku_variant: 'NIKE-VAPOR15-TF-40', size: '40', color: 'Hồng Tím Phantom', price: 2850000, compare_at_price: 3200000, stock_quantity: 24 },
        { sku_variant: 'NIKE-VAPOR15-TF-41', size: '41', color: 'Hồng Tím Phantom', price: 2850000, compare_at_price: 3200000, stock_quantity: 30 },
        { sku_variant: 'NIKE-VAPOR15-TF-42', size: '42', color: 'Hồng Tím Phantom', price: 2850000, compare_at_price: 3200000, stock_quantity: 18 },
        { sku_variant: 'NIKE-VAPOR15-TF-43', size: '43', color: 'Hồng Tím Phantom', price: 2850000, compare_at_price: 3200000, stock_quantity: 10 }
      ],
      reviews: [
        { rating: 5, comment: 'Đệm Air Zoom rất êm, chạy cả trận không bị thốn gót chân. Form ôm chân chuẩn Nike.', user_id: 3, is_verified_buyer: 1 },
        { rating: 5, comment: 'Giày bám sân tốt, đá mưa nhỏ không bị trơn trượt. Đóng gói hộp rất cẩn thận!', user_id: 4, is_verified_buyer: 1 }
      ]
    },
    {
      category_id: 1,
      brand_id: 5, // Mizuno
      name: 'Giày Đá Bóng Mizuno Morelia Neo 3 Pro AS',
      slug: 'giay-da-bong-mizuno-morelia-neo-3-pro-as',
      sku: 'MIZ-NEO3-PRO-AS',
      short_description: 'Vua sân phủi với da Kangaroo tự nhiên siêu mềm, cảm giác bóng chân thật tuyệt đối.',
      description: `Dòng giày làm nên tên tuổi Mizuno tại thị trường bóng đá phong trào Việt Nam:
- Upper da Kangaroo cao cấp thuộc thủ công theo tiêu chuẩn khắt khe của Nhật Bản, mềm như đi chân trần.
- Form giày thiết kế đặc quyền cho bàn chân người châu Á bè ngang, không lo đau ngón chân.
- Đinh dăm cao su tròn chữ L bám sân nhân tạo cực đỉnh, độ bền vượt trội lên đến 2-3 năm sử dụng liên tục.`,
      thumbnail_url: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=700',
      base_price: 2790000,
      is_featured: 1,
      view_count: 2890,
      sold_count: 118,
      variants: [
        { sku_variant: 'MIZ-NEO3-40', size: '40', color: 'Trắng / Xanh Hologram', price: 2790000, compare_at_price: 3100000, stock_quantity: 12 },
        { sku_variant: 'MIZ-NEO3-41', size: '41', color: 'Trắng / Xanh Hologram', price: 2790000, compare_at_price: 3100000, stock_quantity: 20 },
        { sku_variant: 'MIZ-NEO3-42', size: '42', color: 'Trắng / Xanh Hologram', price: 2790000, compare_at_price: 3100000, stock_quantity: 16 }
      ],
      reviews: [
        { rating: 5, comment: 'Chân bè mang Mizuno là chân ái. Da thật mềm dẻo sút mu bóng đi rất căng.', user_id: 3, is_verified_buyer: 1 }
      ]
    },
    {
      category_id: 1,
      brand_id: 7, // Động Lực
      name: 'Quả Bóng Đá Động Lực FIFA Quality Pro UHV 2.05',
      slug: 'qua-bong-da-dong-luc-uhv-205-fifa-quality-pro',
      sku: 'DL-BALL-UHV205-PRO',
      short_description: 'Bóng thi đấu chính thức tại giải bóng đá vô địch quốc gia V-League đạt chuẩn FIFA Quality Pro.',
      description: `Trái bóng chuẩn thi đấu đỉnh cao của tập đoàn Động Lực:
- Da PU cao cấp nhập khẩu kết hợp công nghệ ép nhiệt không đường may giúp bóng chống thấm nước 100%.
- Ruột bóng bằng cao su đặc biệt giữ hơi cực lâu, độ đàn hồi chuẩn xác tiêu chuẩn FIFA.
- Quỹ đạo bay ổn định tuyệt đối, không lắc đảo khi sút xa hoặc tạt bóng cuộn.`,
      thumbnail_url: 'https://images.unsplash.com/photo-1614632537197-1871f30ce5a5?w=700',
      base_price: 890000,
      is_featured: 1,
      view_count: 1980,
      sold_count: 240,
      variants: [
        { sku_variant: 'DL-BALL-UHV205-SZ5', size: 'Số 5 (Thi Đấu Chuẩn)', color: 'Trắng Hoa Văn Xanh Đen', price: 890000, compare_at_price: 990000, stock_quantity: 45 }
      ],
      reviews: [
        { rating: 5, comment: 'Bóng nảy êm, đá đầm chân và không bị thấm nước khi đá trời mưa.', user_id: 4, is_verified_buyer: 1 }
      ]
    },
    {
      category_id: 1,
      brand_id: 1, // Nike
      name: 'Găng Tay Thủ Môn Nike Vapor Grip 3 Promo',
      slug: 'gang-tay-thu-mon-nike-vapor-grip-3-promo',
      sku: 'NIKE-GK-VG3-PROMO',
      short_description: 'Găng tay thủ môn chuyên nghiệp với mút Contact Foam 4mm dính bóng như nam châm.',
      description: `Mẫu găng tay yêu thích của Alisson Becker và Courtois:
- Mút Contact Plus Foam 4mm hấp thụ lực sút cực mạnh và dính bóng tối đa trong cả trời mưa lẫn khô ráo.
- Công nghệ Grip3 ôm sát ngón trỏ và ngón út, gia tăng diện tích tiếp xúc với bóng.
- Lưng găng bằng vải lưới thoáng khí thoát mồ hôi tối ưu.`,
      thumbnail_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=700',
      base_price: 2150000,
      is_featured: 0,
      view_count: 850,
      sold_count: 45,
      variants: [
        { sku_variant: 'NIKE-GK-VG3-SZ8', size: 'Size 8', color: 'Vàng Chanh / Đen', price: 2150000, compare_at_price: 2400000, stock_quantity: 8 },
        { sku_variant: 'NIKE-GK-VG3-SZ9', size: 'Size 9', color: 'Vàng Chanh / Đen', price: 2150000, compare_at_price: 2400000, stock_quantity: 14 },
        { sku_variant: 'NIKE-GK-VG3-SZ10', size: 'Size 10', color: 'Vàng Chanh / Đen', price: 2150000, compare_at_price: 2400000, stock_quantity: 6 }
      ],
      reviews: []
    },

    // CẦU LÔNG & TENNIS
    {
      category_id: 2,
      brand_id: 3, // Yonex
      name: 'Vợt Cầu Lông Yonex Astrox 88D Pro (Gen 3)',
      slug: 'vot-cau-long-yonex-astrox-88d-pro-gen-3',
      sku: 'YONEX-AX88D-PRO-G3',
      short_description: 'Vũ khí tấn công hủy diệt cho cầu sau, trợ lực smash cắm và uy lực tuyệt đối.',
      description: `Dòng vợt cao cấp sản xuất 100% tại Nhật Bản (Made in Japan):
- Công nghệ Namd và Rotational Generator System phân bổ trọng lượng tối ưu ở đỉnh khung, khớp chữ T và cán vợt.
- Mặt vợt mở rộng Sweet Spot tăng độ nảy và độ chính xác kể cả khi tiếp xúc cầu lệch tâm.
- Thân vợt cứng, đầu vợt nặng (Head Heavy) tối ưu cho các pha đập cầu ghi điểm quyết định.`,
      thumbnail_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=700',
      base_price: 4150000,
      is_featured: 1,
      view_count: 4500,
      sold_count: 95,
      variants: [
        { sku_variant: 'YONEX-AX88D-3UG5', size: '3U-G5 (88g, Nặng)', color: 'Đen / Vàng Camel', price: 4150000, compare_at_price: 4650000, stock_quantity: 10 },
        { sku_variant: 'YONEX-AX88D-4UG5', size: '4U-G5 (83g, Vừa tay)', color: 'Đen / Vàng Camel', price: 4150000, compare_at_price: 4650000, stock_quantity: 25 }
      ],
      reviews: [
        { rating: 5, comment: 'Cây vợt đập cầu sướng nhất từng chơi. Lực cổ tay khá là smash cắm sân luôn!', user_id: 3, is_verified_buyer: 1 }
      ]
    },
    {
      category_id: 2,
      brand_id: 3, // Yonex
      name: 'Vợt Cầu Lông Yonex Nanoflare 800 Pro',
      slug: 'vot-cau-long-yonex-nanoflare-800-pro',
      sku: 'YONEX-NF800-PRO',
      short_description: 'Dòng vợt tốc độ phản tạt nhanh như chớp, điều cầu phòng thủ xuất sắc hàng đầu thế giới.',
      description: `Thiết kế khung vành vát khí động học Sonic Flare System giảm lực cản gió tối đa:
- Thân vợt Extra Slim Shaft lướt gió nhanh hơn 11.5% so với khung tiêu chuẩn.
- Đầu vợt nhẹ (Head Light) xoay sở linh hoạt trong các pha phản tạt đôi và bắt lưới.
- Phù hợp cả đánh đơn lẫn đánh đôi chiến thuật tốc độ cao.`,
      thumbnail_url: 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=700',
      base_price: 3950000,
      is_featured: 1,
      view_count: 2100,
      sold_count: 62,
      variants: [
        { sku_variant: 'YONEX-NF800-4UG5', size: '4U-G5 (83g)', color: 'Xanh Đen Midnight', price: 3950000, compare_at_price: 4400000, stock_quantity: 18 }
      ],
      reviews: []
    },
    {
      category_id: 2,
      brand_id: 3, // Yonex
      name: 'Giày Cầu Lông Yonex Power Cushion 65 Z3 Men',
      slug: 'giay-cau-long-yonex-power-cushion-65-z3-men',
      sku: 'YONEX-SHB-65Z3M',
      short_description: 'Mẫu giày cầu lông được hơn 70% tay vợt top 10 thế giới tin dùng với đệm Power Cushion+ độc quyền.',
      description: `Đôi giày toàn diện nhất làng cầu lông thế giới:
- Đệm Power Cushion+ hấp thụ chấn động và hoàn trả năng lượng: thả quả trứng từ độ cao 12m nảy lên 6m mà không vỡ.
- Tấm sợi carbon Power Graphite Sheet ở vòm bàn chân chống lật cổ chân và xoắn giày khi chuyển hướng đột ngột.
- Thân giày da PU liền mạch giảm áp lực lên các ngón chân khi di chuyển dồn dập.`,
      thumbnail_url: 'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?w=700',
      base_price: 2950000,
      is_featured: 0,
      view_count: 1750,
      sold_count: 78,
      variants: [
        { sku_variant: 'YONEX-65Z3-40', size: '40', color: 'Trắng / Cam', price: 2950000, compare_at_price: 3300000, stock_quantity: 14 },
        { sku_variant: 'YONEX-65Z3-41', size: '41', color: 'Trắng / Cam', price: 2950000, compare_at_price: 3300000, stock_quantity: 22 },
        { sku_variant: 'YONEX-65Z3-42', size: '42', color: 'Trắng / Cam', price: 2950000, compare_at_price: 3300000, stock_quantity: 16 }
      ],
      reviews: [
        { rating: 5, comment: 'Đế bám thảm cầu lông cực tốt, nhảy đập cầu tiếp đất không bị đau gối.', user_id: 4, is_verified_buyer: 1 }
      ]
    },
    {
      category_id: 2,
      brand_id: 6, // Decathlon / Wilson
      name: 'Vợt Tennis Wilson Pro Staff 97 v14 (315g)',
      slug: 'vot-tennis-wilson-pro-staff-97-v14',
      sku: 'WILSON-PS97-V14',
      short_description: 'Huyền thoại kiểm soát bóng của Roger Federer với cấu trúc sợi Braid 45 chuẩn xác.',
      description: `Cây vợt biểu tượng mang lại độ chính xác từng milimet trên sân quần vợt:
- Mặt vợt 97 sq.in, trọng lượng vung đầm tay 315g cho cảm giác đánh bóng cổ điển và chắc nịch.
- Công nghệ Paradigm Bending tối ưu hóa độ uốn cong giữa cán và khung vợt.
- Nước sơn đổi màu Bronze ánh đồng sang trọng đẳng cấp.`,
      thumbnail_url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=700',
      base_price: 5200000,
      is_featured: 1,
      view_count: 1620,
      sold_count: 28,
      variants: [
        { sku_variant: 'WILSON-PS97-G2', size: 'Cán số 2 (4 1/4)', color: 'Đồng ánh kim Bronze', price: 5200000, compare_at_price: 5800000, stock_quantity: 7 },
        { sku_variant: 'WILSON-PS97-G3', size: 'Cán số 3 (4 3/8)', color: 'Đồng ánh kim Bronze', price: 5200000, compare_at_price: 5800000, stock_quantity: 5 }
      ],
      reviews: []
    },

    // GYM & THỂ HÌNH
    {
      category_id: 3,
      brand_id: 6, // Decathlon / Domyos
      name: 'Bộ Tạ Tay Điều Chỉnh Thông Minh Bowflex SelectTech (2.5kg - 24kg)',
      slug: 'bo-ta-tay-dieu-chinh-thong-minh-bowflex-selecttech',
      sku: 'BOWFLEX-ST552-PAIR',
      short_description: 'Thay thế 15 cặp tạ tay cồng kềnh bằng 1 cặp tạ xoay số điều chỉnh trọng lượng chỉ trong 2 giây.',
      description: `Giải pháp phòng gym mini tại nhà hoàn hảo nhất:
- Cơ chế xoay đĩa thông minh: dễ dàng chọn mức tạ từ 2.5kg, 3.5kg, 4.5kg... lên tới 24kg mỗi bên.
- Đĩa tạ bọc nhựa nhiệt dẻo cao su đúc nguyên khối chống va đập và chống trầy xước sàn nhà.
- Khay đế bảo vệ an toàn giữ các đĩa tạ cố định khi không sử dụng.`,
      thumbnail_url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=700',
      base_price: 4650000,
      is_featured: 1,
      view_count: 3200,
      sold_count: 85,
      variants: [
        { sku_variant: 'BOWFLEX-ST552-PAIR', size: 'Cặp 2 quả (2.5kg - 24kg/quả)', color: 'Đen / Viền Đỏ Thể Thao', price: 4650000, compare_at_price: 5200000, stock_quantity: 12 }
      ],
      reviews: [
        { rating: 5, comment: 'Cực kỳ tiện lợi, tiết kiệm diện tích phòng ngủ mà tập đủ bài vai, ngực, tay trước.', user_id: 3, is_verified_buyer: 1 }
      ]
    },
    {
      category_id: 3,
      brand_id: 6, // Decathlon
      name: 'Dây Kháng Lực Tập Thể Lực Powerband Aolikes (Bộ 4 Dây)',
      slug: 'day-khang-luc-tap-the-luc-powerband-aolikes',
      sku: 'AOLIKES-PB-SET4',
      short_description: 'Bộ 4 dây cao su tự nhiên hỗ trợ kéo xà đơn, tập squat mông đùi và phục hồi chức năng.',
      description: `Sản phẩm không thể thiếu cho dân thể thao và tập luyện sức mạnh:
- Chất liệu 100% mủ cao su tự nhiên Malaysia đàn hồi cao, không bị bai nhão hay đứt gãy.
- 4 mức kháng lực: Đỏ (7-15kg), Đen (12-30kg), Tím (18-40kg), Xanh lá (25-57kg).
- Gọn nhẹ mang theo khi đi du lịch hoặc công tác.`,
      thumbnail_url: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=700',
      base_price: 380000,
      is_featured: 0,
      view_count: 1450,
      sold_count: 310,
      variants: [
        { sku_variant: 'AOLIKES-PB-FULLSET', size: 'Bộ Đầy Đủ 4 Dây', color: '4 Màu Phân Biệt Kháng Lực', price: 380000, compare_at_price: 450000, stock_quantity: 60 }
      ],
      reviews: [
        { rating: 5, comment: 'Dây rất dày dặn, tập hỗ trợ kéo xà đơn êm và an toàn.', user_id: 4, is_verified_buyer: 1 }
      ]
    },
    {
      category_id: 3,
      brand_id: 6,
      name: 'Đai Lưng Tập Gym Gánh Tạ Harbinger 5-inch Foam Core',
      slug: 'dai-lung-tap-gym-ganh-ta-harbinger-5-inch',
      sku: 'HARBINGER-BELT-5INCH',
      short_description: 'Bảo vệ cột sống lưng dưới và ổn định khoang bụng khi nâng tạ nặng Squat, Deadlift.',
      description: `Đai lưng chuyên nghiệp từ thương hiệu Harbinger USA:
- Lõi xốp dày 5 inch siêu nhẹ nâng đỡ vùng thắt lưng trọn vẹn, không gây cấn đau xương chậu.
- Khóa thép không gỉ trượt con lăn căng đai nhanh chóng và chắc chắn.
- Vải lót thông khí dệt kháng khuẩn hút ẩm cao.`,
      thumbnail_url: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=700',
      base_price: 680000,
      is_featured: 0,
      view_count: 920,
      sold_count: 110,
      variants: [
        { sku_variant: 'HARB-BELT-M', size: 'Size M (Vòng eo 73 - 84cm)', color: 'Đen Toàn Phần', price: 680000, compare_at_price: 750000, stock_quantity: 20 },
        { sku_variant: 'HARB-BELT-L', size: 'Size L (Vòng eo 84 - 94cm)', color: 'Đen Toàn Phần', price: 680000, compare_at_price: 750000, stock_quantity: 18 }
      ],
      reviews: []
    },
    {
      category_id: 3,
      brand_id: 6,
      name: 'Bình Lắc Tập Gym BlenderBottle Pro Series 820ml',
      slug: 'binh-lac-tap-gym-blenderbottle-pro-series-820ml',
      sku: 'BLENDER-PRO-820ML',
      short_description: 'Bình pha Whey Protein không vón cục với lò xo kim loại BlenderBall thép không gỉ 316.',
      description: `Bình lắc chất lượng số 1 thế giới:
- Nhựa Eastman Tritan cao cấp chống bám mùi hôi Protein, không chứa chất độc hại BPA.
- Nắp bật SpoutGuard chống tràn nước tuyệt đối khi lắc mạnh.
- Dung tích lớn 820ml có vạch chia ml và ounce rõ ràng.`,
      thumbnail_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700',
      base_price: 260000,
      is_featured: 0,
      view_count: 1100,
      sold_count: 220,
      variants: [
        { sku_variant: 'BLENDER-PRO-BLK', size: '820ml', color: 'Đen Khói Trong Suốt', price: 260000, compare_at_price: 290000, stock_quantity: 35 },
        { sku_variant: 'BLENDER-PRO-BLU', size: '820ml', color: 'Xanh Navy Trong Suốt', price: 260000, compare_at_price: 290000, stock_quantity: 25 }
      ],
      reviews: []
    },

    // CHẠY BỘ & ĐIỀN KINH
    {
      category_id: 4,
      brand_id: 2, // Adidas
      name: 'Giày Chạy Bộ Nam Adidas Ultraboost Light 2026',
      slug: 'giay-chay-bo-nam-adidas-ultraboost-light-2026',
      sku: 'ADI-UB-LIGHT-2026',
      short_description: 'Mẫu Ultraboost nhẹ nhất lịch sử, đệm hoàn trả năng lượng tối đa trên từng bước sải chân.',
      description: `Sự kết hợp hoàn mỹ giữa thời trang đường phố và công nghệ chạy bộ đỉnh cao:
- Bộ đệm Light BOOST nhẹ hơn 30% so với thế hệ tiền nhiệm, đàn hồi êm ái như bay trên mây.
- Thân giày dệt Primeknit+ ôm khít bàn chân với độ co giãn linh hoạt và thoáng khí tối ưu.
- Đế ngoài cao su lốp xe Continental bám đường ướt cực đỉnh, chống mài mòn vượt trội qua hàng nghìn kilomet.`,
      thumbnail_url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=700',
      base_price: 3650000,
      is_featured: 1,
      view_count: 3800,
      sold_count: 135,
      variants: [
        { sku_variant: 'ADI-UB-40', size: '40', color: 'Trắng Core Black', price: 3650000, compare_at_price: 4200000, stock_quantity: 15 },
        { sku_variant: 'ADI-UB-41', size: '41', color: 'Trắng Core Black', price: 3650000, compare_at_price: 4200000, stock_quantity: 25 },
        { sku_variant: 'ADI-UB-42', size: '42', color: 'Trắng Core Black', price: 3650000, compare_at_price: 4200000, stock_quantity: 18 }
      ],
      reviews: [
        { rating: 5, comment: 'Đế đi êm ái, chạy 10km đường nhựa về chân vẫn khỏe re.', user_id: 4, is_verified_buyer: 1 }
      ]
    },
    {
      category_id: 4,
      brand_id: 1, // Nike
      name: 'Giày Chạy Bộ Nike Air Zoom Pegasus 40',
      slug: 'giay-chay-bo-nike-air-zoom-pegasus-40',
      sku: 'NIKE-PEGASUS-40',
      short_description: 'Chú ngựa chiến bền bỉ cho runner chạy hàng ngày, đệm React kết hợp 2 túi đệm Zoom Air kép.',
      description: `Đôi giày chạy bộ bán chạy nhất lịch sử Nike:
- Đệm bọt React siêu nhẹ kết hợp cùng 2 túi đệm Zoom Air ở mũi và gót chân tạo lực bật đàn hồi mượt mà.
- Cổ giày và lưỡi gà đệm mút dày dặn chống trượt gót chân khi chạy cự ly dài.
- Thích hợp cho cả người mới tập chạy (5k-10k) lẫn cự ly bán marathon 21km.`,
      thumbnail_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=700',
      base_price: 2750000,
      is_featured: 1,
      view_count: 2450,
      sold_count: 160,
      variants: [
        { sku_variant: 'NIKE-PEG40-40', size: '40', color: 'Đen / Xanh Volt Dạ Quang', price: 2750000, compare_at_price: 3100000, stock_quantity: 18 },
        { sku_variant: 'NIKE-PEG40-41', size: '41', color: 'Đen / Xanh Volt Dạ Quang', price: 2750000, compare_at_price: 3100000, stock_quantity: 28 },
        { sku_variant: 'NIKE-PEG40-42', size: '42', color: 'Đen / Xanh Volt Dạ Quang', price: 2750000, compare_at_price: 3100000, stock_quantity: 20 }
      ],
      reviews: []
    },
    {
      category_id: 4,
      brand_id: 1, // Nike
      name: 'Giày Đua Marathon Nike Vaporfly 3',
      slug: 'giay-dua-marathon-nike-vaporfly-3',
      sku: 'NIKE-VAPORFLY-3',
      short_description: 'Siêu giày phá vỡ kỷ lục marathon thế giới với đĩa đệm sợi carbon toàn phần Flyplate.',
      description: `Đôi giày trên bục vinh quang của mọi giải chạy marathon danh giá:
- Đệm bọt ZoomX nhẹ nhất và hoàn trả năng lượng cao nhất của Nike (lên tới 85%).
- Đĩa sợi Carbon cong toàn chiều dài tạo hiệu ứng đòn bẩy đẩy cơ thể lao về phía trước.
- Trọng lượng không tưởng chỉ 180g (size 41), thiết kế khí động học xé gió.`,
      thumbnail_url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=700',
      base_price: 5890000,
      is_featured: 1,
      view_count: 4200,
      sold_count: 55,
      variants: [
        { sku_variant: 'NIKE-VF3-40', size: '40', color: 'Hồng Volt Neon Racing', price: 5890000, compare_at_price: 6500000, stock_quantity: 8 },
        { sku_variant: 'NIKE-VF3-41', size: '41', color: 'Hồng Volt Neon Racing', price: 5890000, compare_at_price: 6500000, stock_quantity: 12 },
        { sku_variant: 'NIKE-VF3-42', size: '42', color: 'Hồng Volt Neon Racing', price: 5890000, compare_at_price: 6500000, stock_quantity: 10 }
      ],
      reviews: []
    },
    {
      category_id: 4,
      brand_id: 6, // Garmin / Decathlon
      name: 'Đồng Hồ Thể Thao Chuyên Nghiệp Garmin Forerunner 55',
      slug: 'dong-ho-the-thao-garmin-forerunner-55',
      sku: 'GARMIN-FR55-BLK',
      short_description: 'Đồng hồ GPS theo dõi chạy bộ, nhịp tim cổ tay 24/7 và huấn luyện viên ảo Garmin Coach.',
      description: `Người bạn đồng hành số một của mọi vận động viên chạy bộ:
- Định vị đa vệ tinh GPS/GLONASS/Galileo đo quãng đường, tốc độ pace chính xác tuyệt đối.
- Đo nhịp tim, nồng độ oxy trong máu, nhịp thở và mức độ căng thẳng năng lượng Body Battery.
- Thời lượng pin khủng lên đến 14 ngày ở chế độ smartwatch và 20 giờ liên tục khi bật GPS.`,
      thumbnail_url: 'https://images.unsplash.com/photo-1510017803434-a899398421b3?w=700',
      base_price: 4490000,
      is_featured: 1,
      view_count: 2600,
      sold_count: 72,
      variants: [
        { sku_variant: 'GARMIN-FR55-BLK', size: 'Mặt 42mm (Dây 20mm)', color: 'Đen Nhám Cổ Điển', price: 4490000, compare_at_price: 4990000, stock_quantity: 15 },
        { sku_variant: 'GARMIN-FR55-WHT', size: 'Mặt 42mm (Dây 20mm)', color: 'Trắng Băng Tuyết', price: 4490000, compare_at_price: 4990000, stock_quantity: 10 }
      ],
      reviews: [
        { rating: 5, comment: 'Bắt GPS cực nhanh, pin trâu chạy cả tuần chỉ sạc 1 lần.', user_id: 3, is_verified_buyer: 1 }
      ]
    }
  ];

  for (const p of products) {
    const prodRes = await run(
      `INSERT INTO products (
        category_id, brand_id, name, slug, sku, short_description, description,
        thumbnail_url, base_price, is_featured, is_active, view_count, sold_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        p.category_id,
        p.brand_id,
        p.name,
        p.slug,
        p.sku,
        p.short_description,
        p.description,
        p.thumbnail_url,
        p.base_price,
        p.is_featured,
        p.view_count,
        p.sold_count
      ]
    );

    const productId = prodRes.id;

    // Thêm ảnh thư viện
    await run(
      'INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, 1, 1)',
      [productId, p.thumbnail_url]
    );

    // Thêm các biến thể
    for (const v of p.variants) {
      await run(
        `INSERT INTO product_variants (
          product_id, sku_variant, size, color, price, compare_at_price, stock_quantity, weight_grams, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 500, 1)`,
        [
          productId,
          v.sku_variant,
          v.size,
          v.color,
          v.price,
          v.compare_at_price,
          v.stock_quantity
        ]
      );
    }

    // Thêm đánh giá nếu có
    if (p.reviews && p.reviews.length > 0) {
      for (const r of p.reviews) {
        await run(
          `INSERT INTO reviews (product_id, user_id, rating, comment, is_verified_buyer, status)
           VALUES (?, ?, ?, ?, ?, 'approved')`,
          [productId, r.user_id, r.rating, r.comment, r.is_verified_buyer]
        );
      }
    }
  }

  console.log(`✅ Đã nạp thành công ${products.length} sản phẩm thể thao thực tế kèm biến thể và đánh giá!`);
  process.exit(0);
}

seedRealData().catch(err => {
  console.error('❌ Lỗi nạp dữ liệu:', err);
  process.exit(1);
});
