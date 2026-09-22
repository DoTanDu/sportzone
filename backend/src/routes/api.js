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
const reviewController = require('../controllers/reviewController');
const wishlistController = require('../controllers/wishlistController');
const addressController = require('../controllers/addressController');

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
router.put('/orders/:code/cancel', authenticateToken, orderController.cancelUserOrder);

// 7. Xác thực & Quản lý thông tin cá nhân
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/profile', authenticateToken, authController.getProfile);
router.put('/auth/profile', authenticateToken, authController.updateProfile);
router.put('/auth/change-password', authenticateToken, authController.changePassword);

// 8. Sổ địa chỉ giao hàng của người dùng
router.get('/user/addresses', authenticateToken, addressController.getAddresses);
router.post('/user/addresses', authenticateToken, addressController.addAddress);
router.put('/user/addresses/:id', authenticateToken, addressController.updateAddress);
router.delete('/user/addresses/:id', authenticateToken, addressController.deleteAddress);
router.put('/user/addresses/:id/default', authenticateToken, addressController.setDefaultAddress);

// 9. Danh sách sản phẩm yêu thích (Wishlist)
router.get('/wishlist', authenticateToken, wishlistController.getWishlist);
router.get('/wishlist/ids', optionalAuth, wishlistController.getWishlistIds);
router.post('/wishlist/:productId', authenticateToken, wishlistController.toggleWishlist);

// 10. Đánh giá & nhận xét sản phẩm
router.post('/reviews', authenticateToken, reviewController.createReview);
router.get('/products/:productId/reviews', reviewController.getProductReviews);

// 11. Phân hệ Quản trị viên (Admin Routes)
router.get('/admin/dashboard', authenticateToken, requireRole('admin', 'staff'), adminController.getDashboardStats);
router.get('/admin/orders', authenticateToken, requireRole('admin', 'staff'), adminController.getAdminOrders);
router.put('/admin/orders/:id/status', authenticateToken, requireRole('admin', 'staff'), adminController.updateOrderStatus);

// Quản lý sản phẩm Admin
router.get('/admin/products', authenticateToken, requireRole('admin', 'staff'), adminController.getAllAdminProducts);
router.post('/admin/products', authenticateToken, requireRole('admin', 'staff'), adminController.createProduct);
router.put('/admin/products/:id', authenticateToken, requireRole('admin', 'staff'), adminController.updateProduct);
router.put('/admin/variants/:id/stock', authenticateToken, requireRole('admin', 'staff'), adminController.updateVariantStock);
router.delete('/admin/products/:id', authenticateToken, requireRole('admin', 'staff'), adminController.deleteProduct);

// Quản lý mã giảm giá (Coupons) Admin
router.get('/admin/coupons', authenticateToken, requireRole('admin', 'staff'), adminController.getAdminCoupons);
router.post('/admin/coupons', authenticateToken, requireRole('admin', 'staff'), adminController.createCoupon);
router.put('/admin/coupons/:id', authenticateToken, requireRole('admin', 'staff'), adminController.updateCoupon);
router.delete('/admin/coupons/:id', authenticateToken, requireRole('admin', 'staff'), adminController.deleteCoupon);

// Quản lý Danh mục Admin
router.post('/admin/categories', authenticateToken, requireRole('admin', 'staff'), adminController.createCategory);
router.put('/admin/categories/:id', authenticateToken, requireRole('admin', 'staff'), adminController.updateCategory);
router.delete('/admin/categories/:id', authenticateToken, requireRole('admin', 'staff'), adminController.deleteCategory);

// Quản lý Đánh giá sản phẩm Admin
router.get('/admin/reviews', authenticateToken, requireRole('admin', 'staff'), reviewController.getAdminReviews);
router.put('/admin/reviews/:id/status', authenticateToken, requireRole('admin', 'staff'), reviewController.updateReviewStatus);
router.delete('/admin/reviews/:id', authenticateToken, requireRole('admin', 'staff'), reviewController.deleteReview);

// Quản lý Khách hàng Admin
router.get('/admin/users', authenticateToken, requireRole('admin', 'staff'), adminController.getAdminUsers);
router.put('/admin/users/:id/status', authenticateToken, requireRole('admin', 'staff'), adminController.updateUserStatus);

module.exports = router;
