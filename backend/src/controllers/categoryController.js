const { query } = require('../config/db');

// Lấy danh sách danh mục đa cấp (Môn thể thao -> Phân nhóm con)
const getCategories = async (req, res, next) => {
  try {
    const allCategories = await query(
      `SELECT id, name, slug, icon, image_url, parent_id, sort_order
       FROM categories 
       WHERE is_active = 1 
       ORDER BY sort_order ASC, id ASC`
    );

    // Tách cây danh mục (Cha và các con)
    const parentCategories = allCategories.filter(c => c.parent_id === null);
    const result = parentCategories.map(parent => {
      return {
        ...parent,
        subcategories: allCategories.filter(child => child.parent_id === parent.id)
      };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Lấy danh sách các thương hiệu thể thao chính hãng
const getBrands = async (req, res, next) => {
  try {
    const brands = await query(
      `SELECT b.id, b.name, b.slug, b.logo_url, b.origin_country, COUNT(p.id) AS product_count
       FROM brands b
       LEFT JOIN products p ON b.id = p.brand_id AND p.is_active = 1
       WHERE b.is_active = 1
       GROUP BY b.id
       ORDER BY product_count DESC, b.name ASC`
    );

    res.json({
      success: true,
      data: brands
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCategories,
  getBrands
};
