/* ==========================================================
   SPORTS STORE - GLOBAL STATE MANAGEMENT
   ========================================================== */

const store = {
  user: null,
  cart: {
    items: [],
    subtotal: 0,
    total_items: 0
  },
  categories: [],
  brands: [],
  filters: {
    category_id: null,
    brand_id: null,
    search: '',
    sort: 'featured',
    size: null,
    page: 1,
    limit: 12
  },
  appliedCoupon: null,
  wishlistIds: [],

  // Khởi tạo trạng thái từ LocalStorage
  init() {
    const savedUser = localStorage.getItem('sports_user');
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
      } catch (e) {
        this.user = null;
      }
    }
  },

  setUser(user, token) {
    this.user = user;
    if (user && token) {
      localStorage.setItem('sports_user', JSON.stringify(user));
      localStorage.setItem('sports_auth_token', token);
    } else {
      localStorage.removeItem('sports_user');
      localStorage.removeItem('sports_auth_token');
      this.wishlistIds = [];
    }
    this.updateUserUI();
    this.updateWishlistBadge();

    // Tự động đồng bộ và nạp lại giỏ hàng (bảo lưu hàng trong giỏ khi đăng nhập hoặc đăng xuất)
    if (window.api && typeof window.api.getCart === 'function') {
      window.api.getCart().then(res => {
        if (res && res.data) {
          this.setCart(res.data);
        }
      }).catch(() => {});
    }
  },

  logout() {
    this.setUser(null, null);
    showToast('Đã đăng xuất tài khoản thành công.', 'info');
    // Nếu đang ở trang admin hoặc profile, quay về trang chủ
    if (window.location.hash.startsWith('#admin') || window.location.hash.startsWith('#profile')) {
      window.location.hash = '#home';
    }
  },

  setCart(cartData) {
    this.cart = cartData || { items: [], subtotal: 0, total_items: 0 };
    this.updateCartBadge();
  },

  updateCartBadge() {
    const badge = document.getElementById('nav-cart-count');
    if (badge) {
      badge.textContent = this.cart.total_items || 0;
      badge.style.display = this.cart.total_items > 0 ? 'flex' : 'none';
    }
  },

  setWishlistIds(ids) {
    this.wishlistIds = Array.isArray(ids) ? ids : [];
    this.updateWishlistBadge();
  },

  updateWishlistBadge() {
    const badge = document.getElementById('nav-wishlist-count');
    if (badge) {
      const count = this.wishlistIds.length;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  },

  updateUserUI() {
    const userBtn = document.getElementById('nav-user-btn');
    const adminLink = document.getElementById('nav-admin-link');
    const profileLink = document.getElementById('nav-profile-link');
    const quickAdminBtn = document.getElementById('nav-quick-admin-btn');

    if (userBtn) {
      if (this.user) {
        userBtn.innerHTML = `
          <i class="fa-solid fa-circle-user" style="color: var(--neon-cyan)"></i>
          <span>${this.user.full_name.split(' ').pop()}</span>
        `;
        userBtn.title = `Tài khoản: ${this.user.full_name} (${this.user.email})`;
      } else {
        userBtn.innerHTML = `<i class="fa-solid fa-user"></i>`;
        userBtn.title = 'Đăng nhập / Đăng ký';
      }
    }

    if (profileLink) {
      profileLink.style.display = this.user ? 'inline-flex' : 'none';
    }

    if (adminLink) {
      // Hiển thị nút vào Quản trị Admin nếu có quyền admin/staff
      const isAdminOrStaff = this.user && (this.user.role === 'admin' || this.user.role === 'staff');
      adminLink.style.display = isAdminOrStaff ? 'inline-flex' : 'none';
      if (quickAdminBtn) {
        // Nếu đã hiện link Quản Trị trên menu thì ẩn nút quick admin phụ để tránh thừa thãi
        quickAdminBtn.style.display = isAdminOrStaff ? 'none' : 'inline-flex';
      }
    }
  }
};

store.init();
