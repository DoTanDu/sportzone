const express = require('express');
const router = express.Router();

// Controllers
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const cartController = require('../controllers/cartController');
const couponController = require('../controllers/couponController');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');

// Middlewares
const { authenticateToken, optionalAuth, requireRole } = require('../middlewares/auth');

// 1. Health check API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Hệ thống Sports Store API đang hoạt động bình thường.',
    timestamp: new Date().toISOString()
  });
});

// 2. Sản phẩm thể thao
router.get('/products', productController.getProducts);
router.get('/products/featured', productController.getFeaturedProducts);
router.get('/products/:slug', productController.getProductBySlug);

// 3. Danh mục & Thương hiệu
router.get('/categories', categoryController.getCategories);
router.get('/brands', categoryController.getBrands);

// 4. Giỏ hàng
router.get('/cart', optionalAuth, cartController.getCart);
router.post('/cart/items', optionalAuth, cartController.addToCart);
router.put('/cart/items/:id', cartController.updateCartItem);
router.delete('/cart/items/:id', cartController.removeCartItem);

// 5. Mã giảm giá (Coupons / Vouchers)
router.post('/coupons/validate', couponController.validateCoupon);

// 6. Đơn đặt hàng
router.post('/orders', optionalAuth, orderController.createOrder);
router.get('/orders/track/:code', orderController.getOrderTracking);
router.get('/orders/my-orders', authenticateToken, orderController.getUserOrders);

// 7. Xác thực người dùng
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/profile', authenticateToken, authController.getProfile);

// 8. Quản trị viên (Admin Routes)
router.get('/admin/dashboard', authenticateToken, requireRole('admin', 'staff'), adminController.getDashboardStats);
router.get('/admin/orders', authenticateToken, requireRole('admin', 'staff'), adminController.getAdminOrders);
router.put('/admin/orders/:id/status', authenticateToken, requireRole('admin', 'staff'), adminController.updateOrderStatus);

// Quản lý sản phẩm Admin
router.get('/admin/products', authenticateToken, requireRole('admin', 'staff'), adminController.getAllAdminProducts);
router.post('/admin/products', authenticateToken, requireRole('admin', 'staff'), adminController.createProduct);
router.put('/admin/products/:id', authenticateToken, requireRole('admin', 'staff'), adminController.updateProduct);
router.put('/admin/variants/:id/stock', authenticateToken, requireRole('admin', 'staff'), adminController.updateVariantStock);
router.delete('/admin/products/:id', authenticateToken, requireRole('admin', 'staff'), adminController.deleteProduct);

module.exports = router;
