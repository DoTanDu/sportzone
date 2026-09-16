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
    }
    this.updateUserUI();
  },

  logout() {
    this.setUser(null, null);
    showToast('Đã đăng xuất tài khoản thành công.', 'info');
    // Nếu đang ở trang admin, quay về trang chủ
    if (window.location.hash.startsWith('#admin')) {
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

  updateUserUI() {
    const userBtn = document.getElementById('nav-user-btn');
    const adminLink = document.getElementById('nav-admin-link');

    if (userBtn) {
      if (this.user) {
        userBtn.innerHTML = `
          <i class="fa-solid fa-user-check" style="color: var(--neon-cyan)"></i>
          <span style="font-size: 0.85rem; font-weight: 700; margin-left: 6px;">${this.user.full_name.split(' ').pop()}</span>
        `;
        userBtn.title = `Đã đăng nhập: ${this.user.email} (Bấm để đăng xuất)`;
      } else {
        userBtn.innerHTML = `<i class="fa-solid fa-user"></i>`;
        userBtn.title = 'Đăng nhập / Đăng ký';
      }
    }

    if (adminLink) {
      // Hiển thị nút vào Quản trị Admin nếu có quyền admin/staff
      if (this.user && (this.user.role === 'admin' || this.user.role === 'staff')) {
        adminLink.style.display = 'inline-flex';
      } else {
        adminLink.style.display = 'none';
      }
    }
  }
};

store.init();
