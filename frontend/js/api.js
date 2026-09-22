/* ==========================================================
   SPORTS STORE - API CLIENT MODULE
   Xử lý kết nối REST API với Backend
   ========================================================== */

const API_BASE = '/api';

// Lấy hoặc khởi tạo session ID cho khách vãng lai
const getSessionId = () => {
  let sessionId = localStorage.getItem('sports_session_id');
  if (!sessionId) {
    sessionId = 'guest_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    localStorage.setItem('sports_session_id', sessionId);
  }
  return sessionId;
};

// Hàm gọi API cốt lõi
async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('sports_auth_token');
  const sessionId = getSessionId();

  const headers = {
    'Content-Type': 'application/json',
    'x-session-id': sessionId,
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Đã có lỗi xảy ra từ máy chủ.');
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

// Hệ thống API Client
const api = {
  // Sản phẩm
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/products?${query}`);
  },
  getFeaturedProducts: () => fetchApi('/products/featured'),
  getProductBySlug: (slug) => fetchApi(`/products/${slug}`),

  // Danh mục & Hãng
  getCategories: () => fetchApi('/categories'),
  getBrands: () => fetchApi('/brands'),

  // Giỏ hàng
  getCart: () => fetchApi('/cart'),
  addToCart: (variantId, quantity = 1) => 
    fetchApi('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ variant_id: variantId, quantity })
    }),
  updateCartItem: (itemId, quantity) =>
    fetchApi(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    }),
  removeCartItem: (itemId) =>
    fetchApi(`/cart/items/${itemId}`, { method: 'DELETE' }),

  // Voucher
  validateCoupon: (code, orderAmount) =>
    fetchApi('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, order_amount: orderAmount })
    }),

  // Đơn hàng
  createOrder: (orderData) =>
    fetchApi('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    }),
  trackOrder: (code) => fetchApi(`/orders/track/${encodeURIComponent(code)}`),
  getUserOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/orders/my-orders?${query}`);
  },
  cancelUserOrder: (code, reason = 'Khách hàng đổi ý') =>
    fetchApi(`/orders/${encodeURIComponent(code)}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    }),

  // Người dùng & Xác thực
  login: (identifier, password) =>
    fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    }),
  register: (userData) =>
    fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
  getProfile: () => fetchApi('/auth/profile'),
  updateProfile: (data) =>
    fetchApi('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  changePassword: (old_password, new_password) =>
    fetchApi('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ old_password, new_password })
    }),

  // Sổ địa chỉ
  getAddresses: () => fetchApi('/user/addresses'),
  addAddress: (data) =>
    fetchApi('/user/addresses', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateAddress: (id, data) =>
    fetchApi(`/user/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteAddress: (id) =>
    fetchApi(`/user/addresses/${id}`, { method: 'DELETE' }),
  setDefaultAddress: (id) =>
    fetchApi(`/user/addresses/${id}/default`, { method: 'PUT' }),

  // Sản phẩm yêu thích (Wishlist)
  getWishlist: () => fetchApi('/wishlist'),
  getWishlistIds: () => fetchApi('/wishlist/ids'),
  toggleWishlist: (productId) =>
    fetchApi(`/wishlist/${productId}`, { method: 'POST' }),

  // Đánh giá sản phẩm
  createReview: (data) =>
    fetchApi('/reviews', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getProductReviews: (productId) => fetchApi(`/products/${productId}/reviews`),
  getAdminReviews: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/admin/reviews?${query}`);
  },
  updateAdminReviewStatus: (id, status) =>
    fetchApi(`/admin/reviews/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),
  deleteAdminReview: (id) =>
    fetchApi(`/admin/reviews/${id}`, { method: 'DELETE' }),

  // Quản trị viên (Admin)
  getAdminDashboard: () => fetchApi('/admin/dashboard'),
  getAdminProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/admin/products?${query}`);
  },
  createAdminProduct: (productData) =>
    fetchApi('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    }),
  updateAdminProduct: (id, data) =>
    fetchApi(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  updateVariantStock: (id, stockQuantity, price) =>
    fetchApi(`/admin/variants/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ stock_quantity: stockQuantity, price })
    }),
  deleteAdminProduct: (id) =>
    fetchApi(`/admin/products/${id}`, { method: 'DELETE' }),
  getAdminOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/admin/orders?${query}`);
  },
  updateAdminOrderStatus: (id, status, note = '') =>
    fetchApi(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ order_status: status, note })
    }),
  getAdminCoupons: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/admin/coupons?${query}`);
  },
  createAdminCoupon: (data) =>
    fetchApi('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateAdminCoupon: (id, data) =>
    fetchApi(`/admin/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteAdminCoupon: (id) =>
    fetchApi(`/admin/coupons/${id}`, { method: 'DELETE' }),
  getAdminUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/admin/users?${query}`);
  },
  updateAdminUserStatus: (id, status) =>
    fetchApi(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
};

// Helper hiển thị thông báo Toast
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-circle-exclamation';
  if (type === 'info') icon = 'fa-circle-info';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s forwards cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Định dạng tiền tệ VND (dùng khoảng trắng không ngắt dòng tránh rớt chữ đ xuống dòng mới)
function formatVND(amount) {
  if (isNaN(amount) || amount === null) return '0\u00A0₫';
  return Number(amount).toLocaleString('vi-VN') + '\u00A0₫';
}

// Modal xác nhận thao tác giao diện đẹp, loại bỏ hoàn toàn window.confirm()
function showConfirmModal({
  title = 'Xác Nhận Thao Tác',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
  icon = 'fa-triangle-exclamation',
  confirmText = 'Xác Nhận',
  cancelText = 'Hủy Bỏ',
  isDestructive = true,
  onConfirm
} = {}) {
  const modal = document.getElementById('generic-modal');
  const modalContent = document.getElementById('generic-modal-content');
  if (!modal || !modalContent) {
    if (window.confirm(message)) {
      if (typeof onConfirm === 'function') onConfirm();
    }
    return;
  }

  modalContent.innerHTML = `
    <div style="text-align: center; padding: 12px 6px 8px; max-width: 440px; margin: 0 auto;">
      <div style="width: 58px; height: 58px; border-radius: 50%; background: ${isDestructive ? 'rgba(255, 51, 102, 0.12)' : 'rgba(0, 240, 255, 0.12)'}; color: ${isDestructive ? 'var(--neon-red)' : 'var(--neon-cyan)'}; display: inline-flex; align-items: center; justify-content: center; font-size: 1.6rem; margin-bottom: 16px; border: 1px solid ${isDestructive ? 'rgba(255, 51, 102, 0.3)' : 'rgba(0, 240, 255, 0.3)'};">
        <i class="fa-solid ${icon}"></i>
      </div>
      <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 8px;">${title}</h3>
      <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.55; margin-bottom: 24px;">${message}</p>
      
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button type="button" class="btn btn-outline" id="btn-custom-dialog-cancel" style="min-width: 110px;">${cancelText}</button>
        <button type="button" class="btn ${isDestructive ? 'btn-primary' : 'btn-cyan'}" id="btn-custom-dialog-confirm" style="min-width: 110px; ${isDestructive ? 'background: var(--neon-red); border-color: var(--neon-red);' : ''}">
          ${confirmText}
        </button>
      </div>
    </div>
  `;

  modal.classList.add('active');

  const btnCancel = document.getElementById('btn-custom-dialog-cancel');
  const btnConfirm = document.getElementById('btn-custom-dialog-confirm');

  const closeDialog = () => modal.classList.remove('active');

  btnCancel.onclick = () => closeDialog();
  btnConfirm.onclick = async () => {
    closeDialog();
    if (typeof onConfirm === 'function') {
      await onConfirm();
    }
  };
}

