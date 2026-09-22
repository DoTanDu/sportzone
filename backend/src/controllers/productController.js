const { query, get, run } = require('../config/db');
const { getPagination, formatPaginationResponse } = require('../utils/pagination');

// Lấy danh sách sản phẩm có bộ lọc & phân trang chống tràn RAM
const getProducts = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query.page, req.query.limit);
    const { category_id, brand_id, min_price, max_price, search, sort, size, is_featured } = req.query;

    let whereClauses = ['p.is_active = 1'];
    let params = [];

    // Lọc theo danh mục môn thể thao
    if (category_id) {
      whereClauses.push('(p.category_id = ? OR c.parent_id = ?)');
      params.push(Number(category_id), Number(category_id));
    }

    // Lọc theo thương hiệu
    if (brand_id) {
      whereClauses.push('p.brand_id = ?');
      params.push(Number(brand_id));
    }

    // Lọc theo khoảng giá
    if (min_price && !isNaN(min_price)) {
      whereClauses.push('p.base_price >= ?');
      params.push(Number(min_price));
    }
    if (max_price && !isNaN(max_price)) {
      whereClauses.push('p.base_price <= ?');
      params.push(Number(max_price));
    }

    // Lọc sản phẩm nổi bật
    if (is_featured !== undefined) {
      whereClauses.push('p.is_featured = ?');
      params.push(is_featured === 'true' || is_featured === '1' ? 1 : 0);
    }

    // Tìm kiếm an toàn theo tên sản phẩm hoặc mã SKU (Prepared statement chống injection)
    if (search && search.trim() !== '') {
      whereClauses.push('(p.name LIKE ? OR p.sku LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    // Lọc theo size biến thể (Size giày: 40, 41, áo: M, L...)
    let joinVariantFilter = '';
    if (size && size.trim() !== '') {
      whereClauses.push('pv.size = ?');
      params.push(size.trim());
      joinVariantFilter = 'JOIN product_variants pv ON p.id = pv.product_id';
    }

    const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // Đếm tổng số bản ghi (Chuẩn bị metadata phân trang)
    const countSql = `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      ${joinVariantFilter}
      ${whereSql}
    `;
    const countResult = await get(countSql, params);
    const total = countResult ? countResult.total : 0;

    // Sắp xếp an toàn (Whitelist trường cho phép sắp xếp)
    let orderBy = 'p.is_featured DESC, p.id DESC';
    if (sort === 'price_asc') {
      orderBy = 'p.base_price ASC';
    } else if (sort === 'price_desc') {
      orderBy = 'p.base_price DESC';
    } else if (sort === 'sold') {
      orderBy = 'p.sold_count DESC';
    } else if (sort === 'newest') {
      orderBy = 'p.created_at DESC';
    }

    // Truy vấn dữ liệu với LIMIT và OFFSET an toàn
    const selectSql = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.sku,
        p.short_description,
        p.thumbnail_url,
        p.base_price,
        p.is_featured,
        p.sold_count,
        p.view_count,
        c.id AS category_id,
        c.name AS category_name,
        b.id AS brand_id,
        b.name AS brand_name,
        COUNT(DISTINCT v.id) AS variant_count,
        COALESCE(SUM(v.stock_quantity), 0) AS total_stock,
        COALESCE(AVG(r.rating), 5.0) AS avg_rating,
        COUNT(DISTINCT r.id) AS review_count
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_variants v ON p.id = v.product_id AND v.is_active = 1
      LEFT JOIN reviews r ON p.id = r.product_id AND r.status = 'approved'
      ${joinVariantFilter}
      ${whereSql}
      GROUP BY p.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?;
    `;

    const dataParams = [...params, limit, offset];
    const products = await query(selectSql, dataParams);

    return res.json(formatPaginationResponse(products, total, page, limit));
  } catch (err) {
    next(err);
  }
};

// Lấy chi tiết sản phẩm theo slug (kèm toàn bộ biến thể, hình ảnh và đánh giá)
const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const productSql = `
      SELECT 
        p.*,
        c.name AS category_name,
        c.slug AS category_slug,
        b.name AS brand_name,
        b.logo_url AS brand_logo
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      WHERE p.slug = ? AND p.is_active = 1;
    `;
    const product = await get(productSql, [slug]);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm thể thao này.'
      });
    }

    // Tăng lượt xem (không làm ảnh hưởng response)
    run('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [product.id]).catch(() => {});

    // Lấy danh sách ảnh sản phẩm
    const images = await query(
      'SELECT id, image_url, is_primary FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC',
      [product.id]
    );

    // Lấy toàn bộ biến thể kích thước / màu sắc
    const variants = await query(
      `SELECT id, sku_variant, size, color, price, compare_at_price, stock_quantity, weight_grams, image_url
       FROM product_variants 
       WHERE product_id = ? AND is_active = 1
       ORDER BY size ASC, color ASC`,
      [product.id]
    );

    // Lấy đánh giá đã duyệt
    const reviews = await query(
      `SELECT r.id, r.rating, r.comment, r.review_images, r.created_at, u.full_name AS user_name, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND r.status = 'approved'
       ORDER BY r.created_at DESC
       LIMIT 20`,
      [product.id]
    );

    // Tính điểm đánh giá trung bình
    const ratingStat = await get(
      `SELECT COUNT(id) AS total_reviews, COALESCE(AVG(rating), 5.0) AS avg_rating
       FROM reviews WHERE product_id = ? AND status = 'approved'`,
      [product.id]
    );

    return res.json({
      success: true,
      data: {
        ...product,
        images,
        variants,
        reviews,
        stats: {
          total_reviews: Number(ratingStat?.total_reviews || 0),
          avg_rating: Number(parseFloat(ratingStat?.avg_rating || 5.0).toFixed(1))
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// Lấy danh sách sản phẩm nổi bật cho Banner / Trang chủ
const getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 8, 20);

    const sql = `
      SELECT 
        p.id, p.name, p.slug, p.thumbnail_url, p.base_price, p.is_featured,
        c.name AS category_name, b.name AS brand_name,
        MIN(v.price) AS min_price,
        MAX(v.price) AS max_price,
        SUM(v.stock_quantity) AS total_stock
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_variants v ON p.id = v.product_id AND v.is_active = 1
      WHERE p.is_active = 1 AND p.is_featured = 1
      GROUP BY p.id
      ORDER BY p.sold_count DESC, p.id DESC
      LIMIT ?;
    `;
    const products = await query(sql, [limit]);
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  getFeaturedProducts
};
