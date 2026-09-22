/* ==========================================================
   SPORTS STORE - MAIN FRONTEND APPLICATION
   SPA Router, Renderers, Shopping Cart & Checkout Flow
   ========================================================== */

const app = {
  activeView: 'home', // 'home', 'shop', 'tracking', 'profile', 'admin'
  selectedProduct: null,
  selectedVariant: null,

  async init() {
    // 1. Tải danh mục, thương hiệu, giỏ hàng và danh sách yêu thích
    try {
      const [catsRes, brandsRes, cartRes] = await Promise.all([
        api.getCategories(),
        api.getBrands(),
        api.getCart()
      ]);
      store.categories = catsRes.data;
      store.brands = brandsRes.data;
      store.setCart(cartRes.data);

      if (store.user) {
        try {
          const wishRes = await api.getWishlistIds();
          store.setWishlistIds(wishRes.data || []);
        } catch (wErr) {
          console.warn('Lỗi tải wishlist:', wErr);
        }
      }
    } catch (err) {
      console.warn('Lỗi tải dữ liệu khởi tạo:', err);
    }

    // 2. Gắn sự kiện lắng nghe Hash Router
    window.addEventListener('hashchange', () => this.handleRouting());
    this.handleRouting();

    // 3. Gắn các sự kiện toàn cục (Navbar, Cart Drawer, Search, Auth Modal)
    this.attachGlobalEvents();
  },

  // Xử lý điều hướng Hash SPA
  handleRouting() {
    const hash = window.location.hash || '#home';
    const viewName = hash.replace('#', '').split('?')[0];

    this.activeView = ['home', 'shop', 'tracking', 'profile', 'admin'].includes(viewName) ? viewName : 'home';

    // Cập nhật trạng thái active trên navbar
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${this.activeView}`);
    });

    // Ẩn tất cả view, chỉ hiển thị view hiện tại
    document.querySelectorAll('.app-view').forEach(view => {
      view.style.display = 'none';
    });

    const activeElem = document.getElementById(`view-${this.activeView}`);
    if (activeElem) {
      activeElem.style.display = 'block';
    }

    // Cuộn lên đầu trang
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Gọi hàm render tương ứng
    if (this.activeView === 'home') this.renderHome();
    else if (this.activeView === 'shop') this.renderShop();
    else if (this.activeView === 'tracking') this.renderTracking();
    else if (this.activeView === 'profile') this.renderProfile();
    else if (this.activeView === 'admin') admin.render();
  },

  // --- 1. RENDER TRANG CHỦ (HOME) ---
  async renderHome() {
    const container = document.getElementById('view-home');
    if (!container) return;

    container.innerHTML = `
      <!-- Hero Section -->
      <section class="hero">
        <div class="container hero-grid">
          <div>
            <div class="hero-tag">
              <i class="fa-solid fa-bolt"></i> Siêu Thị Thể Thao Đẳng Cấp 2026
            </div>
            <h1 class="hero-title">
              Bứt Phá <span class="highlight-text">Mọi Giới Hạn</span> Chinh Phục Đỉnh Cao
            </h1>
            <p class="hero-desc">
              Trang bị đầy đủ dụng cụ thể thao đỉnh cao từ các thương hiệu hàng đầu thế giới: Nike, Adidas, Yonex, Mizuno... Cam kết chính hãng 100%, bảo hành uy tín và giao hàng siêu tốc.
            </p>
            <div class="hero-buttons">
              <a href="#shop" class="btn btn-primary">
                <i class="fa-solid fa-fire"></i> Khám Phá Cửa Hàng
              </a>
              <button class="btn btn-outline" id="btn-scroll-categories">
                <i class="fa-solid fa-list"></i> Danh Mục Môn Thể Thao
              </button>
            </div>

            <div class="hero-features">
              <div class="feat-item">
                <div class="feat-icon"><i class="fa-solid fa-certificate"></i></div>
                <div class="feat-info">
                  <h4>100% Chính Hãng</h4>
                  <p>Cam kết nguồn gốc rõ ràng</p>
                </div>
              </div>
              <div class="feat-item">
                <div class="feat-icon"><i class="fa-solid fa-truck-fast"></i></div>
                <div class="feat-info">
                  <h4>Giao Nhanh 24/7</h4>
                  <p>Freeship cho đơn từ 500k</p>
                </div>
              </div>
              <div class="feat-item">
                <div class="feat-icon"><i class="fa-solid fa-rotate-left"></i></div>
                <div class="feat-info">
                  <h4>Đổi Trả 7 Ngày</h4>
                  <p>Đổi size giày dễ dàng</p>
                </div>
              </div>
            </div>
          </div>

          <div class="hero-visual">
            <div class="hero-card-preview">
              <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" alt="Giày Thể Thao Cao Cấp">
              <div class="hero-floating-badge">
                <div>
                  <span class="badge badge-sale">Flash Sale Tuần Này</span>
                  <h4 style="margin-top: 4px; font-size: 1.1rem;">Nike Mercurial Vapor 15</h4>
                  <div style="color: var(--neon-cyan); font-weight: 800;">1.950.000 đ</div>
                </div>
                <a href="#shop" class="btn btn-cyan btn-sm">Mua Ngay</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Danh Mục Môn Thể Thao -->
      <section class="container" id="home-categories" style="padding: 40px 0;">
        <div class="section-header">
          <div>
            <span class="section-tag">Bộ Môn Thể Thao</span>
            <h2 class="section-title">Chọn Môn Bạn Yêu Thích</h2>
          </div>
          <a href="#shop" class="btn btn-outline btn-sm">Xem tất cả <i class="fa-solid fa-arrow-right"></i></a>
        </div>

        <div class="categories-grid">
          ${store.categories.map(c => `
            <div class="category-card" data-cat-id="${c.id}">
              <div class="cat-icon-wrap">
                <i class="fa-solid ${c.icon || 'fa-medal'}"></i>
              </div>
              <h3>${c.name}</h3>
              <span>${c.subcategories ? c.subcategories.length : 0} phân loại con</span>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Thương Hiệu Nổi Tiếng -->
      <section class="brands-strip">
        <div class="container">
          <div class="brands-flex">
            ${store.brands.map(b => `
              <div class="brand-item" data-brand-id="${b.id}">${b.name}</div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Banner Voucher Khuyến Mãi -->
      <section class="container" style="margin-bottom: 50px;">
        <div class="glass-panel" style="padding: 30px 40px; background: linear-gradient(135deg, rgba(255, 87, 34, 0.15) 0%, rgba(0, 240, 255, 0.1) 100%); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
          <div>
            <span class="badge badge-sale" style="margin-bottom: 8px;">Ưu Đãi Độc Quyền</span>
            <h3 style="font-size: 1.6rem; margin-bottom: 4px;">Mã Giảm Giá Chào Mừng Thành Viên</h3>
            <p style="color: var(--text-muted);">Nhập mã <strong style="color: var(--neon-cyan)">WELCOME10</strong> để được giảm ngay 10% (tối đa 100.000đ) khi đặt hàng!</p>
          </div>
          <button class="btn btn-cyan btn-sm" onclick="navigator.clipboard.writeText('WELCOME10'); showToast('Đã copy mã WELCOME10!', 'info');">
            <i class="fa-regular fa-copy"></i> Sao Chép Mã
          </button>
        </div>
      </section>

      <!-- Sản phẩm nổi bật -->
      <section class="container" style="padding: 20px 0 80px;">
        <div class="section-header">
          <div>
            <span class="section-tag">Hot Nhất Hiện Nay</span>
            <h2 class="section-title">Sản Phẩm Thể Thao Nổi Bật</h2>
          </div>
          <a href="#shop" class="btn btn-outline btn-sm">Xem tất cả <i class="fa-solid fa-arrow-right"></i></a>
        </div>

        <div class="products-grid" id="home-featured-products">
          <div style="text-align: center; grid-column: 1/-1; padding: 40px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>
        </div>
      </section>
    `;

    // Tải sản phẩm nổi bật
    try {
      const featured = await api.getFeaturedProducts();
      const prodGrid = document.getElementById('home-featured-products');
      if (prodGrid) {
        prodGrid.innerHTML = featured.data.map(p => this.renderProductCard(p)).join('');
        this.attachProductCardEvents(prodGrid);
      }
    } catch (e) {
      console.error(e);
    }

    // Sự kiện click danh mục
    container.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', () => {
        store.filters.category_id = card.dataset.catId;
        window.location.hash = '#shop';
      });
    });

    // Sự kiện click thương hiệu
    container.querySelectorAll('.brand-item').forEach(item => {
      item.addEventListener('click', () => {
        store.filters.brand_id = item.dataset.brandId;
        window.location.hash = '#shop';
      });
    });

    const scrollBtn = document.getElementById('btn-scroll-categories');
    if (scrollBtn) {
      scrollBtn.addEventListener('click', () => {
        document.getElementById('home-categories').scrollIntoView({ behavior: 'smooth' });
      });
    }
  },

  // --- 2. RENDER CỬA HÀNG (SHOP & CATALOG) ---
  async renderShop() {
    const container = document.getElementById('view-shop');
    if (!container) return;

    container.innerHTML = `
      <div class="container shop-layout">
        <!-- Sidebar Bộ Lọc -->
        <aside class="filter-sidebar">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="font-size: 1.15rem; font-weight: 800;"><i class="fa-solid fa-filter"></i> Bộ Lọc</h3>
            <button class="btn btn-outline btn-sm" id="btn-reset-filters" style="padding: 4px 10px; font-size: 0.75rem;">Đặt Lại</button>
          </div>

          <!-- Môn thể thao -->
          <div class="filter-group">
            <h4 class="filter-title">Môn Thể Thao</h4>
            <div class="filter-pills">
              <button class="filter-pill ${!store.filters.category_id ? 'active' : ''}" data-cat="">Tất cả</button>
              ${store.categories.map(c => `
                <button class="filter-pill ${store.filters.category_id == c.id ? 'active' : ''}" data-cat="${c.id}">${c.name}</button>
              `).join('')}
            </div>
          </div>

          <!-- Thương hiệu -->
          <div class="filter-group">
            <h4 class="filter-title">Thương Hiệu</h4>
            <div class="filter-pills">
              <button class="filter-pill ${!store.filters.brand_id ? 'active' : ''}" data-brand="">Tất cả</button>
              ${store.brands.map(b => `
                <button class="filter-pill ${store.filters.brand_id == b.id ? 'active' : ''}" data-brand="${b.id}">${b.name}</button>
              `).join('')}
            </div>
          </div>

          <!-- Kích thước (Size giày/áo) -->
          <div class="filter-group">
            <h4 class="filter-title">Kích Cỡ (Size)</h4>
            <div class="filter-pills">
              <button class="filter-pill ${!store.filters.size ? 'active' : ''}" data-size="">Tất cả</button>
              <button class="filter-pill ${store.filters.size === '39' ? 'active' : ''}" data-size="39">39</button>
              <button class="filter-pill ${store.filters.size === '40' ? 'active' : ''}" data-size="40">40</button>
              <button class="filter-pill ${store.filters.size === '41' ? 'active' : ''}" data-size="41">41</button>
              <button class="filter-pill ${store.filters.size === '42' ? 'active' : ''}" data-size="42">42</button>
              <button class="filter-pill ${store.filters.size === '43' ? 'active' : ''}" data-size="43">43</button>
              <button class="filter-pill ${store.filters.size === '4U-G5' ? 'active' : ''}" data-size="4U-G5">4U (Vợt)</button>
            </div>
          </div>
        </aside>

        <!-- Main Product Area -->
        <main>
          <div class="shop-toolbar">
            <div id="shop-result-count" style="font-size: 0.95rem; color: var(--text-muted);">
              Đang tải danh sách...
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 0.85rem; color: var(--text-muted);">Sắp xếp:</span>
              <select id="shop-sort-select" class="sort-select">
                <option value="featured" ${store.filters.sort === 'featured' ? 'selected' : ''}>Nổi bật nhất</option>
                <option value="price_asc" ${store.filters.sort === 'price_asc' ? 'selected' : ''}>Giá: Thấp đến Cao</option>
                <option value="price_desc" ${store.filters.sort === 'price_desc' ? 'selected' : ''}>Giá: Cao đến Thấp</option>
                <option value="sold" ${store.filters.sort === 'sold' ? 'selected' : ''}>Bán chạy nhất</option>
                <option value="newest" ${store.filters.sort === 'newest' ? 'selected' : ''}>Mới nhất</option>
              </select>
            </div>
          </div>

          <!-- Lưới sản phẩm -->
          <div class="products-grid" id="shop-products-grid">
            <div style="text-align: center; grid-column: 1/-1; padding: 60px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>
          </div>

          <!-- Phân trang -->
          <div class="pagination" id="shop-pagination"></div>
        </main>
      </div>
    `;

    this.attachFilterEvents();
    await this.fetchAndRenderShopProducts();
  },

  async fetchAndRenderShopProducts() {
    const grid = document.getElementById('shop-products-grid');
    const countElem = document.getElementById('shop-result-count');
    const paginationElem = document.getElementById('shop-pagination');
    if (!grid) return;

    grid.innerHTML = `<div style="text-align: center; grid-column: 1/-1; padding: 60px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;

    try {
      const params = {
        page: store.filters.page,
        limit: store.filters.limit,
        sort: store.filters.sort,
        ...(store.filters.category_id && { category_id: store.filters.category_id }),
        ...(store.filters.brand_id && { brand_id: store.filters.brand_id }),
        ...(store.filters.size && { size: store.filters.size }),
        ...(store.filters.search && { search: store.filters.search })
      };

      const res = await api.getProducts(params);
      const { data: products, pagination } = res;

      if (countElem) {
        countElem.innerHTML = `Hiển thị <strong>${products.length}</strong> trên tổng số <strong>${pagination.total}</strong> sản phẩm`;
      }

      if (products.length === 0) {
        grid.innerHTML = `
          <div style="text-align: center; grid-column: 1/-1; padding: 60px;">
            <i class="fa-solid fa-box-open fa-3x" style="color: var(--text-dark); margin-bottom: 16px;"></i>
            <h3>Không tìm thấy sản phẩm phù hợp</h3>
            <p style="color: var(--text-muted); margin-top: 6px;">Hãy thử đổi tiêu chí tìm kiếm hoặc xóa bớt bộ lọc.</p>
          </div>
        `;
        paginationElem.innerHTML = '';
        return;
      }

      grid.innerHTML = products.map(p => this.renderProductCard(p)).join('');
      this.attachProductCardEvents(grid);

      // Render Pagination
      this.renderPagination(paginationElem, pagination);

    } catch (err) {
      grid.innerHTML = `<div style="text-align:center; color: var(--neon-red); grid-column: 1/-1;">Lỗi tải sản phẩm: ${err.message}</div>`;
    }
  },

  attachFilterEvents() {
    const container = document.getElementById('view-shop');
    if (!container) return;

    // Filter Môn thể thao
    container.querySelectorAll('[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        store.filters.category_id = btn.dataset.cat || null;
        store.filters.page = 1;
        this.renderShop();
      });
    });

    // Filter Thương hiệu
    container.querySelectorAll('[data-brand]').forEach(btn => {
      btn.addEventListener('click', () => {
        store.filters.brand_id = btn.dataset.brand || null;
        store.filters.page = 1;
        this.renderShop();
      });
    });

    // Filter Kích thước
    container.querySelectorAll('[data-size]').forEach(btn => {
      btn.addEventListener('click', () => {
        store.filters.size = btn.dataset.size || null;
        store.filters.page = 1;
        this.renderShop();
      });
    });

    // Sắp xếp
    const sortSelect = document.getElementById('shop-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        store.filters.sort = e.target.value;
        store.filters.page = 1;
        this.fetchAndRenderShopProducts();
      });
    }

    // Reset filters
    const resetBtn = document.getElementById('btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        store.filters = { category_id: null, brand_id: null, search: '', sort: 'featured', size: null, page: 1, limit: 12 };
        this.renderShop();
      });
    }
  },

  renderPagination(container, pagination) {
    if (!container || pagination.totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = `
      <button class="page-btn" ${!pagination.hasPrev ? 'disabled' : ''} data-page="${pagination.page - 1}">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
    `;

    for (let i = 1; i <= pagination.totalPages; i++) {
      html += `
        <button class="page-btn ${i === pagination.page ? 'active' : ''}" data-page="${i}">${i}</button>
      `;
    }

    html += `
      <button class="page-btn" ${!pagination.hasNext ? 'disabled' : ''} data-page="${pagination.page + 1}">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    `;

    container.innerHTML = html;

    container.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page, 10);
        store.filters.page = page;
        this.fetchAndRenderShopProducts();
        window.scrollTo({ top: 300, behavior: 'smooth' });
      });
    });
  },

  // Helper render Product Card HTML
  renderProductCard(product) {
    const isWished = store.wishlistIds.includes(product.id);
    return `
      <div class="product-card" data-slug="${product.slug}">
        <div class="product-thumb">
          <div class="card-badges">
            ${product.is_featured ? '<span class="badge badge-sale"><i class="fa-solid fa-fire"></i> Hot</span>' : ''}
            <span class="badge badge-hot">${product.brand_name || 'Chính Hãng'}</span>
          </div>
          <button class="btn-wishlist-toggle ${isWished ? 'active' : ''}" data-product-id="${product.id}" title="${isWished ? 'Bỏ yêu thích' : 'Yêu thích'}">
            <i class="fa-${isWished ? 'solid' : 'regular'} fa-heart"></i>
          </button>
          <img src="${product.thumbnail_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'}" alt="${product.name}" loading="lazy">
        </div>

        <div class="product-body">
          <div class="prod-brand">${product.category_name || 'Thể Thao'}</div>
          <h3 class="prod-title" title="${product.name}">${product.name}</h3>

          <div class="prod-meta">
            <div class="prod-rating">
              <i class="fa-solid fa-star"></i>
              <span>${product.avg_rating || '5.0'}</span>
            </div>
            <span>•</span>
            <span>Đã bán ${product.sold_count || 0}</span>
          </div>

          <div class="prod-price-box">
            <div>
              <span class="current-price">${formatVND(product.base_price)}</span>
            </div>
            <button class="btn-add-cart btn-quick-view" data-slug="${product.slug}" title="Xem chi tiết & Chọn size">
              <i class="fa-solid fa-cart-plus"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  attachProductCardEvents(container) {
    container.querySelectorAll('.product-card').forEach(card => {
      const slug = card.dataset.slug;
      card.querySelector('.product-thumb').addEventListener('click', (e) => {
        if (!e.target.closest('.btn-wishlist-toggle')) {
          this.openProductDetailModal(slug);
        }
      });
      card.querySelector('.prod-title').addEventListener('click', () => this.openProductDetailModal(slug));
      card.querySelector('.btn-quick-view').addEventListener('click', (e) => {
        e.stopPropagation();
        this.openProductDetailModal(slug);
      });
    });

    // Sự kiện nút Yêu thích
    container.querySelectorAll('.btn-wishlist-toggle').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!store.user) {
          showToast('Vui lòng đăng nhập để lưu sản phẩm yêu thích!', 'info');
          app.openAuthModal();
          return;
        }

        const pid = parseInt(btn.dataset.productId, 10);
        try {
          const res = await api.toggleWishlist(pid);
          if (res.in_wishlist) {
            if (!store.wishlistIds.includes(pid)) store.wishlistIds.push(pid);
            btn.classList.add('active');
            btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
            btn.title = 'Bỏ yêu thích';
          } else {
            store.wishlistIds = store.wishlistIds.filter(id => id !== pid);
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
            btn.title = 'Yêu thích';
          }
          store.updateWishlistBadge();
          showToast(res.message, 'success');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  },

  // --- 3. MODAL CHI TIẾT SẢN PHẨM & CHỌN SIZE ---
  async openProductDetailModal(slug) {
    const modal = document.getElementById('generic-modal');
    const modalContent = document.getElementById('generic-modal-content');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `<div style="text-align: center; padding: 60px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;
    modal.classList.add('active');

    try {
      const res = await api.getProductBySlug(slug);
      const product = res.data;
      this.selectedProduct = product;
      this.selectedVariant = product.variants.length > 0 ? product.variants[0] : null;

      modalContent.innerHTML = `
        <div class="product-detail-grid">
          <!-- Ảnh sản phẩm -->
          <div class="detail-gallery">
            <img id="detail-main-img" src="${product.thumbnail_url}" alt="${product.name}">
          </div>

          <!-- Thông tin sản phẩm & chọn size -->
          <div class="detail-info">
            <span class="badge badge-sale">${product.brand_name} • ${product.category_name}</span>
            <h2 style="font-size: 1.6rem; font-weight: 800; margin: 10px 0 6px;">${product.name}</h2>
            
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
              <div class="prod-rating" style="font-size: 1rem;">
                <i class="fa-solid fa-star"></i>
                <span>${product.stats.avg_rating} (${product.stats.total_reviews} đánh giá)</span>
              </div>
              <span style="color: var(--text-dark)">|</span>
              <span style="font-size: 0.88rem; color: var(--text-muted);">Mã SKU: <strong>${product.sku}</strong></span>
            </div>

            <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 900; color: #fff; margin-bottom: 20px;">
              <span id="detail-price">${formatVND(this.selectedVariant ? this.selectedVariant.price : product.base_price)}</span>
            </div>

            <!-- Bộ chọn biến thể (Size giày / Thông số vợt / Tạ) -->
            <div class="variant-selector">
              <div class="variant-label">
                <span>Chọn Kích Thước / Size:</span>
                <span id="detail-stock-count" style="color: var(--neon-green); font-size: 0.82rem;">
                  ${this.selectedVariant ? `Còn ${this.selectedVariant.stock_quantity} món` : ''}
                </span>
              </div>
              <div class="variant-chips" id="detail-variant-chips">
                ${product.variants.map((v, i) => `
                  <button class="size-chip ${i === 0 ? 'selected' : ''}" data-variant-id="${v.id}">
                    ${v.size || 'Tiêu chuẩn'} ${v.color ? '(' + v.color + ')' : ''}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Bộ đếm số lượng & Nút mua -->
            <div style="display: flex; align-items: center; gap: 16px; margin: 24px 0;">
              <div class="qty-stepper">
                <button class="qty-btn" id="btn-qty-minus"><i class="fa-solid fa-minus"></i></button>
                <input type="text" class="qty-input" id="detail-qty-input" value="1" readonly>
                <button class="qty-btn" id="btn-qty-plus"><i class="fa-solid fa-plus"></i></button>
              </div>

              <button class="btn btn-primary" id="btn-modal-add-cart" style="flex-grow: 1;">
                <i class="fa-solid fa-cart-shopping"></i> Thêm Vào Giỏ Hàng
              </button>
            </div>

            <!-- Mô tả sản phẩm -->
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 18px; margin-top: 20px;">
              <h4 style="font-size: 0.95rem; text-transform: uppercase; margin-bottom: 8px;">Mô tả sản phẩm</h4>
              <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; white-space: pre-line;">
                ${product.description || product.short_description || 'Dụng cụ thể thao chính hãng chất lượng cao.'}
              </p>
            </div>

            <!-- Khu vực Đánh giá & Bình luận -->
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 22px; margin-top: 22px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h4 style="font-size: 1rem; text-transform: uppercase; color: #fff;">
                  <i class="fa-solid fa-comments" style="color: var(--neon-cyan);"></i> Đánh Giá (${product.reviews ? product.reviews.length : 0})
                </h4>
                <div class="prod-rating">
                  <i class="fa-solid fa-star" style="color: #ffb703;"></i>
                  <strong>${product.stats ? product.stats.avg_rating : '5.0'} / 5.0</strong>
                </div>
              </div>

              <!-- Form gửi đánh giá -->
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;">
                <div style="font-size: 0.88rem; font-weight: 700; margin-bottom: 4px;">Đánh giá của bạn về sản phẩm này:</div>
                <div class="rating-picker" id="modal-rating-picker" data-rating="5">
                  <i class="fa-solid fa-star active" data-val="1"></i>
                  <i class="fa-solid fa-star active" data-val="2"></i>
                  <i class="fa-solid fa-star active" data-val="3"></i>
                  <i class="fa-solid fa-star active" data-val="4"></i>
                  <i class="fa-solid fa-star active" data-val="5"></i>
                </div>
                <textarea id="modal-review-comment" class="form-control" rows="2" placeholder="Nhận xét của bạn về chất lượng dụng cụ, cảm giác sử dụng..." style="margin-bottom: 10px;"></textarea>
                <button class="btn btn-primary btn-sm" id="btn-submit-modal-review">
                  <i class="fa-solid fa-paper-plane"></i> Gửi Đánh Giá
                </button>
              </div>

              <!-- Danh sách bình luận -->
              <div id="modal-reviews-list" style="display: flex; flex-direction: column; gap: 12px; max-height: 260px; overflow-y: auto;">
                ${(!product.reviews || product.reviews.length === 0) ? `
                  <div style="text-align: center; color: var(--text-muted); font-size: 0.88rem; padding: 16px;">
                    Chưa có đánh giá nào. Hãy là người đầu tiên trải nghiệm và đánh giá sản phẩm này!
                  </div>
                ` : product.reviews.map(r => `
                  <div style="background: var(--bg-card); padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                      <div style="font-weight: 700; font-size: 0.88rem; color: #fff;">
                        ${r.user_name || 'Khách hàng'}
                        ${r.is_verified_buyer ? '<span class="badge badge-stock" style="font-size: 0.7rem; margin-left: 6px;"><i class="fa-solid fa-circle-check"></i> Đã mua hàng</span>' : ''}
                      </div>
                      <div style="color: #ffb703; font-size: 0.82rem;">
                        ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
                      </div>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0; line-height: 1.5;">${r.comment || 'Sản phẩm thể thao rất tốt, đúng mô tả.'}</p>
                    <div style="font-size: 0.75rem; color: var(--text-dark); margin-top: 4px;">${new Date(r.created_at).toLocaleDateString('vi-VN')}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;

      // Gắn sự kiện chọn biến thể (Size)
      modalContent.querySelectorAll('.size-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          modalContent.querySelectorAll('.size-chip').forEach(c => c.classList.remove('selected'));
          chip.classList.add('selected');
          const variantId = chip.dataset.variantId;
          this.selectedVariant = product.variants.find(v => v.id == variantId);

          if (this.selectedVariant) {
            document.getElementById('detail-price').textContent = formatVND(this.selectedVariant.price);
            document.getElementById('detail-stock-count').textContent = `Còn ${this.selectedVariant.stock_quantity} món`;
          }
        });
      });

      // Gắn sự kiện tăng/giảm số lượng
      const qtyInput = document.getElementById('detail-qty-input');
      document.getElementById('btn-qty-minus').addEventListener('click', () => {
        let val = parseInt(qtyInput.value, 10);
        if (val > 1) qtyInput.value = val - 1;
      });
      document.getElementById('btn-qty-plus').addEventListener('click', () => {
        let val = parseInt(qtyInput.value, 10);
        const max = this.selectedVariant ? this.selectedVariant.stock_quantity : 99;
        if (val < max) qtyInput.value = val + 1;
        else showToast(`Kho chỉ còn ${max} sản phẩm!`, 'info');
      });

      // Gắn sự kiện chọn số sao đánh giá
      const ratingPicker = document.getElementById('modal-rating-picker');
      if (ratingPicker) {
        ratingPicker.querySelectorAll('i').forEach(star => {
          star.addEventListener('click', () => {
            const val = parseInt(star.dataset.val, 10);
            ratingPicker.dataset.rating = val;
            ratingPicker.querySelectorAll('i').forEach(s => {
              const sVal = parseInt(s.dataset.val, 10);
              s.classList.toggle('active', sVal <= val);
            });
          });
        });
      }

      // Gắn sự kiện gửi đánh giá
      const btnSubmitReview = document.getElementById('btn-submit-modal-review');
      if (btnSubmitReview) {
        btnSubmitReview.addEventListener('click', async () => {
          if (!store.user) {
            showToast('Vui lòng đăng nhập để gửi đánh giá!', 'info');
            app.openAuthModal();
            return;
          }

          const starRating = parseInt(ratingPicker.dataset.rating || '5', 10);
          const comment = document.getElementById('modal-review-comment').value.trim();

          try {
            const res = await api.createReview({
              product_id: product.id,
              rating: starRating,
              comment
            });

            showToast(res.message, 'success');
            // Cập nhật ngay vào danh sách review trên modal
            const list = document.getElementById('modal-reviews-list');
            if (list) {
              const newReviewHtml = `
                <div style="background: var(--bg-card); padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--neon-cyan);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div style="font-weight: 700; font-size: 0.88rem; color: #fff;">
                      ${store.user.full_name}
                      <span class="badge badge-sale" style="font-size: 0.7rem; margin-left: 6px;">Vừa gửi</span>
                    </div>
                    <div style="color: #ffb703; font-size: 0.82rem;">
                      ${'★'.repeat(starRating)}${'☆'.repeat(5 - starRating)}
                    </div>
                  </div>
                  <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0; line-height: 1.5;">${comment || 'Sản phẩm thể thao rất tốt.'}</p>
                  <div style="font-size: 0.75rem; color: var(--text-dark); margin-top: 4px;">Vừa xong</div>
                </div>
              `;
              list.insertAdjacentHTML('afterbegin', newReviewHtml);
            }
            document.getElementById('modal-review-comment').value = '';
          } catch (rErr) {
            showToast(rErr.message, 'error');
          }
        });
      }

      // Thêm vào giỏ hàng
      document.getElementById('btn-modal-add-cart').addEventListener('click', async () => {
        if (!this.selectedVariant) {
          showToast('Vui lòng chọn kích cỡ/biến thể sản phẩm!', 'error');
          return;
        }
        const qty = parseInt(qtyInput.value, 10);
        try {
          await api.addToCart(this.selectedVariant.id, qty);
          const cartRes = await api.getCart();
          store.setCart(cartRes.data);
          showToast(`Đã thêm "${product.name}" vào giỏ hàng!`, 'success');
          modal.classList.remove('active');
          this.openCartDrawer();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });

    } catch (err) {
      modalContent.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--neon-red);">Lỗi: ${err.message}</div>`;
    }
  },

  // --- 4. GIỎ HÀNG & THANH TOÁN (DRAWER) ---
  async openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (!drawer || !overlay) return;

    try {
      const cartRes = await api.getCart();
      store.setCart(cartRes.data);
      this.renderCartDrawerContent();
      overlay.classList.add('active');
    } catch (err) {
      showToast('Lỗi tải giỏ hàng.', 'error');
    }
  },

  closeCartDrawer() {
    const overlay = document.getElementById('cart-drawer-overlay');
    if (overlay) overlay.classList.remove('active');
  },

  renderCartDrawerContent(isCheckoutMode = false) {
    const body = document.getElementById('drawer-cart-body');
    const footer = document.getElementById('drawer-cart-footer');
    if (!body || !footer) return;

    if (store.cart.items.length === 0) {
      body.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <i class="fa-solid fa-bag-shopping fa-3x" style="color: var(--text-dark); margin-bottom: 16px;"></i>
          <h3>Giỏ hàng đang trống</h3>
          <p style="color: var(--text-muted); margin-top: 6px;">Hãy lựa chọn những món đồ thể thao chất lượng nhé!</p>
          <a href="#shop" class="btn btn-cyan btn-sm" style="margin-top: 20px;" onclick="app.closeCartDrawer()">
            Mua sắm ngay
          </a>
        </div>
      `;
      footer.style.display = 'none';
      return;
    }

    footer.style.display = 'block';

    if (!isCheckoutMode) {
      // Màn hình 1: Danh sách giỏ hàng
      body.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${store.cart.items.map(item => `
            <div class="cart-item">
              <img src="${item.image_url}" class="cart-item-thumb">
              <div class="cart-item-info">
                <div class="cart-item-title">${item.product_name}</div>
                <div class="cart-item-variant">Size: ${item.size || 'Tiêu chuẩn'} ${item.color ? '- ' + item.color : ''}</div>
                <div class="cart-item-bottom">
                  <span style="font-weight: 800; color: #fff;">${formatVND(item.price)}</span>
                  <div class="qty-stepper" style="transform: scale(0.85);">
                    <button class="qty-btn btn-cart-minus" data-id="${item.cart_item_id}" data-qty="${item.quantity - 1}">-</button>
                    <span class="qty-input">${item.quantity}</span>
                    <button class="qty-btn btn-cart-plus" data-id="${item.cart_item_id}" data-qty="${item.quantity + 1}">+</button>
                  </div>
                  <button class="btn-icon btn-cart-remove" data-id="${item.cart_item_id}" style="width: 30px; height: 30px; color: var(--neon-red);" title="Xóa">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      // Tính toán voucher (nếu có)
      const subtotal = store.cart.subtotal;
      const discount = store.appliedCoupon ? store.appliedCoupon.discount_amount : 0;
      const shippingFee = subtotal >= 500000 ? 0 : 30000;
      const finalTotal = Math.max(0, subtotal + shippingFee - discount);

      footer.innerHTML = `
        <!-- Mã giảm giá -->
        <div class="coupon-box">
          <input type="text" id="cart-coupon-input" class="coupon-input" placeholder="MÃ GIẢM GIÁ (VD: WELCOME10)" value="${store.appliedCoupon ? store.appliedCoupon.code : ''}">
          <button class="btn btn-outline btn-sm" id="btn-apply-coupon">Áp Dụng</button>
        </div>
        ${store.appliedCoupon ? `<div style="font-size: 0.8rem; color: var(--neon-green); margin-bottom: 12px;"><i class="fa-solid fa-check"></i> Đã áp dụng mã: ${store.appliedCoupon.code} (-${formatVND(discount)})</div>` : ''}

        <div class="summary-row">
          <span>Tạm tính:</span>
          <span>${formatVND(subtotal)}</span>
        </div>
        <div class="summary-row">
          <span>Phí vận chuyển:</span>
          <span>${shippingFee === 0 ? '<strong style="color: var(--neon-green)">Miễn phí</strong>' : formatVND(shippingFee)}</span>
        </div>
        ${discount > 0 ? `
          <div class="summary-row" style="color: var(--neon-green);">
            <span>Giảm giá voucher:</span>
            <span>-${formatVND(discount)}</span>
          </div>
        ` : ''}
        <div class="summary-row summary-total">
          <span>Tổng thanh toán:</span>
          <span style="color: var(--neon-cyan);">${formatVND(finalTotal)}</span>
        </div>

        <button class="btn btn-primary" id="btn-proceed-checkout" style="width: 100%; margin-top: 16px;">
          <i class="fa-solid fa-credit-card"></i> Tiến Hành Đặt Hàng
        </button>
      `;

      // Gắn sự kiện tăng giảm & xóa
      body.querySelectorAll('.btn-cart-minus, .btn-cart-plus').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const qty = parseInt(btn.dataset.qty, 10);
          try {
            await api.updateCartItem(id, qty);
            const cartRes = await api.getCart();
            store.setCart(cartRes.data);
            this.renderCartDrawerContent();
          } catch (e) {
            showToast(e.message, 'error');
          }
        });
      });

      body.querySelectorAll('.btn-cart-remove').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          try {
            await api.removeCartItem(id);
            const cartRes = await api.getCart();
            store.setCart(cartRes.data);
            this.renderCartDrawerContent();
          } catch (e) {
            showToast(e.message, 'error');
          }
        });
      });

      // Áp voucher
      document.getElementById('btn-apply-coupon').addEventListener('click', async () => {
        const code = document.getElementById('cart-coupon-input').value.trim();
        if (!code) return;
        try {
          const res = await api.validateCoupon(code, store.cart.subtotal);
          store.appliedCoupon = res.data;
          showToast(res.message, 'success');
          this.renderCartDrawerContent();
        } catch (e) {
          showToast(e.message, 'error');
        }
      });

      // Nút chuyển sang form thanh toán
      document.getElementById('btn-proceed-checkout').addEventListener('click', () => {
        this.renderCartDrawerContent(true);
      });

    } else {
      // Màn hình 2: Form nhập thông tin nhận hàng
      body.innerHTML = `
        <div style="margin-bottom: 16px;">
          <button class="btn btn-outline btn-sm" id="btn-back-to-cart" style="padding: 4px 10px;">
            <i class="fa-solid fa-arrow-left"></i> Quay lại giỏ hàng
          </button>
        </div>

        <h3 style="font-size: 1.2rem; margin-bottom: 16px;">Thông Tin Giao Hàng</h3>
        <form id="form-checkout">
          <div class="form-group">
            <label class="form-label">Họ và tên người nhận *</label>
            <input type="text" id="order-name" class="form-control" value="${store.user ? store.user.full_name : ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Số điện thoại *</label>
            <input type="tel" id="order-phone" class="form-control" placeholder="0901234567" required>
          </div>
          <div class="form-group">
            <label class="form-label">Địa chỉ giao hàng đầy đủ *</label>
            <input type="text" id="order-address" class="form-control" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP" required>
          </div>
          <div class="form-group">
            <label class="form-label">Phương thức thanh toán</label>
            <select id="order-payment" class="form-control">
              <option value="cod">Thanh toán khi nhận hàng (COD)</option>
              <option value="banking">Chuyển khoản ngân hàng (VietQR Pay)</option>
              <option value="momo">Ví điện tử MoMo (Quét mã MoMo QR động)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Ghi chú giao hàng</label>
            <textarea id="order-note" class="form-control" rows="2" placeholder="Giao giờ hành chính, gọi trước khi giao..."></textarea>
          </div>
        </form>
      `;

      footer.innerHTML = `
        <button class="btn btn-primary" id="btn-submit-order" style="width: 100%;">
          <i class="fa-solid fa-check"></i> Xác Nhận Đặt Hàng Ngay
        </button>
      `;

      document.getElementById('btn-back-to-cart').addEventListener('click', () => {
        this.renderCartDrawerContent(false);
      });

      document.getElementById('btn-submit-order').addEventListener('click', async () => {
        const name = document.getElementById('order-name').value.trim();
        const phone = document.getElementById('order-phone').value.trim();
        const address = document.getElementById('order-address').value.trim();
        const payment = document.getElementById('order-payment').value;
        const note = document.getElementById('order-note').value.trim();

        if (!name || !phone || !address) {
          showToast('Vui lòng điền đầy đủ họ tên, SĐT và địa chỉ!', 'error');
          return;
        }

        const items = store.cart.items.map(it => ({
          variant_id: it.variant_id,
          quantity: it.quantity
        }));

        try {
          const res = await api.createOrder({
            receiver_name: name,
            receiver_phone: phone,
            shipping_address: address,
            payment_method: payment,
            note,
            items,
            coupon_code: store.appliedCoupon ? store.appliedCoupon.code : null
          });

          // Xóa giỏ hàng
          store.appliedCoupon = null;
          const cartRes = await api.getCart();
          store.setCart(cartRes.data);

          // Hiển thị màn hình thành công
          const isBanking = res.data.payment_method === 'banking';
          const isMomo = res.data.payment_method === 'momo';
          const vietQrUrl = 'assets/images/qr_vietqr.png';
          const momoQrUrl = 'assets/images/qr_momo.png';

          body.innerHTML = `
            <div style="text-align: center; padding: 24px 10px;">
              <div class="cat-icon-wrap" style="color: var(--neon-green); width: 68px; height: 68px; margin: 0 auto 12px;">
                <i class="fa-solid fa-circle-check fa-2x"></i>
              </div>
              <h2 style="font-size: 1.4rem; margin-bottom: 6px;">Đặt Hàng Thành Công!</h2>
              <p style="color: var(--text-muted); font-size: 0.88rem;">Cảm ơn bạn đã tin tưởng SportZone.</p>
              
              <div style="background: var(--bg-card); padding: 14px; border-radius: var(--radius-md); margin: 16px 0; border: 1px dashed var(--neon-cyan);">
                <div style="font-size: 0.8rem; color: var(--text-muted);">MÃ ĐƠN HÀNG CỦA BẠN:</div>
                <strong style="font-size: 1.25rem; color: var(--neon-cyan); letter-spacing: 0.05em;">${res.data.order_code}</strong>
                <div style="font-size: 0.85rem; color: #fff; margin-top: 4px;">Tổng thanh toán: <strong style="color: var(--neon-green);">${formatVND(res.data.total_amount)}</strong></div>
              </div>

              ${isBanking ? `
                <div class="vietqr-card">
                  <div style="font-weight: 800; color: var(--neon-cyan); font-size: 0.95rem; margin-bottom: 4px;">
                    <i class="fa-solid fa-qrcode"></i> QUÉT MÃ VIETQR ĐỂ THANH TOÁN
                  </div>
                  <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">Mở app ngân hàng bất kỳ để quét mã chuyển khoản:</p>
                  
                  <img src="${vietQrUrl}" class="vietqr-img" alt="VietQR Techcombank Sportzone ${res.data.order_code}">

                  <div class="vietqr-copy-row">
                    <span>Ngân hàng: <strong>Techcombank</strong></span>
                  </div>
                  <div class="vietqr-copy-row">
                    <span>Số tài khoản: <strong>1907 2002 4640 14</strong></span>
                    <button class="btn-copy" onclick="navigator.clipboard.writeText('19072002464014'); showToast('Đã copy số tài khoản!', 'info');">Copy</button>
                  </div>
                  <div class="vietqr-copy-row">
                    <span>Tên tài khoản: <strong>Sportzone</strong></span>
                    <button class="btn-copy" onclick="navigator.clipboard.writeText('Sportzone'); showToast('Đã copy tên tài khoản!', 'info');">Copy</button>
                  </div>
                  <div class="vietqr-copy-row">
                    <span>Số tiền: <strong style="color: var(--neon-green);">${formatVND(res.data.total_amount)}</strong></span>
                    <button class="btn-copy" onclick="navigator.clipboard.writeText('${res.data.total_amount}'); showToast('Đã copy số tiền!', 'info');">Copy</button>
                  </div>
                  <div class="vietqr-copy-row">
                    <span>Nội dung CK: <strong style="color: var(--neon-cyan);">${res.data.order_code}</strong></span>
                    <button class="btn-copy" onclick="navigator.clipboard.writeText('${res.data.order_code}'); showToast('Đã copy mã đơn!', 'info');">Copy</button>
                  </div>
                </div>
              ` : ''}

              ${isMomo ? `
                <div class="momo-card">
                  <div class="momo-header">
                    <i class="fa-solid fa-wallet"></i> THANH TOÁN VÍ MOMO QR
                    <span class="momo-badge">MoMo QR</span>
                  </div>
                  <p style="font-size: 0.8rem; color: #ffb8da; margin-bottom: 10px;">Mở ứng dụng MoMo và quét mã bên dưới để thanh toán:</p>
                  
                  <img src="${momoQrUrl}" class="momo-img" alt="MoMo QR Sportzone ${res.data.order_code}">

                  <div class="momo-copy-row">
                    <span>Tên tài khoản: <strong>Sportzone</strong></span>
                    <button class="btn-momo-copy" onclick="navigator.clipboard.writeText('Sportzone'); showToast('Đã copy tên tài khoản!', 'info');">Copy</button>
                  </div>
                  <div class="momo-copy-row">
                    <span>Ví nhận: <strong>Ví MoMo Sportzone</strong></span>
                  </div>
                  <div class="momo-copy-row">
                    <span>Số tiền: <strong style="color: #ff3e98; font-size: 1rem;">${formatVND(res.data.total_amount)}</strong></span>
                    <button class="btn-momo-copy" onclick="navigator.clipboard.writeText('${res.data.total_amount}'); showToast('Đã copy số tiền!', 'info');">Copy</button>
                  </div>
                  <div class="momo-copy-row">
                    <span>Nội dung: <strong style="color: #ff5da8;">${res.data.order_code}</strong></span>
                    <button class="btn-momo-copy" onclick="navigator.clipboard.writeText('${res.data.order_code}'); showToast('Đã copy mã đơn!', 'info');">Copy</button>
                  </div>
                  
                  <a href="momo://?action=payWithApp&amount=${res.data.total_amount}&note=${encodeURIComponent(res.data.order_code)}" class="btn-momo-app">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Mở App MoMo Để Thanh Toán
                  </a>
                </div>
              ` : ''}

              <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 16px;">
                <a href="#tracking?code=${res.data.order_code}" class="btn btn-cyan btn-sm" onclick="app.closeCartDrawer()">
                  <i class="fa-solid fa-truck-ramp-box"></i> Tra Cứu Hành Trình Đơn Hàng
                </a>
                <a href="#profile" class="btn btn-outline btn-sm" onclick="app.closeCartDrawer()">
                  <i class="fa-solid fa-user-circle"></i> Xem Trong Đơn Hàng Của Tôi
                </a>
              </div>
            </div>
          `;
          footer.style.display = 'none';

        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  },

  // --- 5. TRA CỨU ĐƠN HÀNG (TRACKING) ---
  renderTracking() {
    const container = document.getElementById('view-tracking');
    if (!container) return;

    // Đọc mã đơn từ query hash nếu có
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const prefillCode = urlParams.get('code') || '';

    container.innerHTML = `
      <div class="container" style="max-width: 760px; padding: 60px 20px 100px;">
        <div style="text-align: center; margin-bottom: 36px;">
          <span class="section-tag">Kiểm Tra Trực Tuyến</span>
          <h1 class="section-title">Tra Cứu Hành Trình Đơn Hàng</h1>
          <p style="color: var(--text-muted); margin-top: 8px;">Nhập mã đơn hàng (VD: DH20260916001) để xem tiến độ giao hàng thời gian thực.</p>
        </div>

        <div class="glass-panel" style="padding: 24px; margin-bottom: 30px;">
          <div style="display: flex; gap: 10px;">
            <input type="text" id="track-order-input" class="form-control" placeholder="Nhập mã đơn hàng..." value="${prefillCode}" style="text-transform: uppercase; font-weight: 700;">
            <button class="btn btn-primary" id="btn-do-track"><i class="fa-solid fa-magnifying-glass"></i> Tra Cứu</button>
          </div>
        </div>

        <div id="track-result-container"></div>
      </div>
    `;

    const trackBtn = document.getElementById('btn-do-track');
    const input = document.getElementById('track-order-input');

    trackBtn.addEventListener('click', () => {
      const code = input.value.trim();
      if (code) this.fetchOrderTrackingData(code);
    });

    if (prefillCode) {
      this.fetchOrderTrackingData(prefillCode);
    }
  },

  async fetchOrderTrackingData(code) {
    const container = document.getElementById('track-result-container');
    if (!container) return;

    container.innerHTML = `<div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;

    try {
      const res = await api.trackOrder(code);
      const order = res.data;

      container.innerHTML = `
        <div class="glass-panel" style="padding: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border-subtle); padding-bottom: 20px; margin-bottom: 24px;">
            <div>
              <span class="badge badge-sale">Đơn hàng thể thao</span>
              <h3 style="font-size: 1.4rem; margin-top: 6px;">Mã: <strong style="color: var(--neon-cyan);">${order.order_code}</strong></h3>
              <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Người nhận: ${order.receiver_name} (${order.receiver_phone})</div>
              <div style="font-size: 0.85rem; color: var(--text-muted);">Địa chỉ: ${order.shipping_address}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.8rem; color: var(--text-muted);">Tổng giá trị</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: #fff;">${formatVND(order.total_amount)}</div>
              <span class="badge ${order.payment_status === 'paid' ? 'badge-stock' : 'badge-sale'}">
                ${order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </div>
          </div>

          <!-- Dòng thời gian Timeline -->
          <h4 style="font-size: 1rem; text-transform: uppercase; margin-bottom: 16px;">Hành trình giao nhận:</h4>
          <div class="timeline-track">
            ${order.timeline.map(t => `
              <div class="timeline-node">
                <div class="timeline-dot"></div>
                <div class="timeline-status">${t.status.toUpperCase()} - ${t.note || ''}</div>
                <div class="timeline-time">${new Date(t.created_at).toLocaleString('vi-VN')} (Bởi: ${t.created_by})</div>
              </div>
            `).join('')}
          </div>

          <!-- Danh sách món đồ đã mua -->
          <h4 style="font-size: 1rem; text-transform: uppercase; margin: 24px 0 12px;">Sản phẩm đã đặt:</h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${order.items.map(it => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-card); border-radius: var(--radius-md);">
                <div>
                  <div style="font-weight: 700; font-size: 0.95rem;">${it.product_name}</div>
                  <small style="color: var(--neon-cyan);">${it.variant_label || ''}</small>
                </div>
                <div>${formatVND(it.unit_price)} x <strong>${it.quantity}</strong> = <strong>${formatVND(it.total_price)}</strong></div>
              </div>
            `).join('')}
          </div>

          ${order.payment_status === 'unpaid' && order.payment_method === 'momo' ? `
            <div class="momo-card" style="margin-top: 24px;">
              <div class="momo-header">
                <i class="fa-solid fa-wallet"></i> MÃ MOMO QR THANH TOÁN ĐƠN HÀNG
                <span class="momo-badge">MoMo QR</span>
              </div>
              <p style="font-size: 0.8rem; color: #ffb8da; margin-bottom: 10px;">Đơn hàng chưa được thanh toán. Quét mã bên dưới để hoàn tất:</p>
              
              <img src="assets/images/qr_momo.png" class="momo-img" alt="MoMo QR Sportzone ${order.order_code}">

              <div class="momo-copy-row">
                <span>Tên tài khoản: <strong>Sportzone</strong></span>
                <button class="btn-momo-copy" onclick="navigator.clipboard.writeText('Sportzone'); showToast('Đã copy tên tài khoản!', 'info');">Copy</button>
              </div>
              <div class="momo-copy-row">
                <span>Ví nhận: <strong>Ví MoMo Sportzone</strong></span>
              </div>
              <div class="momo-copy-row">
                <span>Số tiền: <strong style="color: #ff3e98; font-size: 1rem;">${formatVND(order.total_amount)}</strong></span>
                <button class="btn-momo-copy" onclick="navigator.clipboard.writeText('${order.total_amount}'); showToast('Đã copy số tiền!', 'info');">Copy</button>
              </div>
              <div class="momo-copy-row">
                <span>Nội dung: <strong style="color: #ff5da8;">${order.order_code}</strong></span>
                <button class="btn-momo-copy" onclick="navigator.clipboard.writeText('${order.order_code}'); showToast('Đã copy mã đơn!', 'info');">Copy</button>
              </div>
              
              <a href="momo://?action=payWithApp&amount=${order.total_amount}&note=${encodeURIComponent(order.order_code)}" class="btn-momo-app">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Mở App MoMo Để Thanh Toán
              </a>
            </div>
          ` : ''}

          ${order.payment_status === 'unpaid' && order.payment_method === 'banking' ? `
            <div class="vietqr-card" style="margin-top: 24px;">
              <div style="font-weight: 800; color: var(--neon-cyan); font-size: 0.95rem; margin-bottom: 4px;">
                <i class="fa-solid fa-qrcode"></i> QUÉT MÃ VIETQR ĐỂ THANH TOÁN
              </div>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">Đơn hàng chưa thanh toán. Quét mã bằng app ngân hàng để chuyển khoản:</p>
              
              <img src="assets/images/qr_vietqr.png" class="vietqr-img" alt="VietQR Techcombank Sportzone ${order.order_code}">

              <div class="vietqr-copy-row">
                <span>Ngân hàng: <strong>Techcombank</strong></span>
              </div>
              <div class="vietqr-copy-row">
                <span>Số tài khoản: <strong>1907 2002 4640 14</strong></span>
                <button class="btn-copy" onclick="navigator.clipboard.writeText('19072002464014'); showToast('Đã copy số tài khoản!', 'info');">Copy</button>
              </div>
              <div class="vietqr-copy-row">
                <span>Tên tài khoản: <strong>Sportzone</strong></span>
                <button class="btn-copy" onclick="navigator.clipboard.writeText('Sportzone'); showToast('Đã copy tên tài khoản!', 'info');">Copy</button>
              </div>
              <div class="vietqr-copy-row">
                <span>Số tiền: <strong style="color: var(--neon-green);">${formatVND(order.total_amount)}</strong></span>
                <button class="btn-copy" onclick="navigator.clipboard.writeText('${order.total_amount}'); showToast('Đã copy số tiền!', 'info');">Copy</button>
              </div>
              <div class="vietqr-copy-row">
                <span>Nội dung CK: <strong style="color: var(--neon-cyan);">${order.order_code}</strong></span>
                <button class="btn-copy" onclick="navigator.clipboard.writeText('${order.order_code}'); showToast('Đã copy mã đơn!', 'info');">Copy</button>
              </div>
            </div>
          ` : ''}
        </div>
      `;

    } catch (err) {
      container.innerHTML = `
        <div class="glass-panel" style="padding: 40px; text-align: center; color: var(--neon-red);">
          <i class="fa-solid fa-triangle-exclamation fa-2x" style="margin-bottom: 12px;"></i>
          <h3>Không tìm thấy mã đơn hàng "${code}"</h3>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 6px;">Vui lòng kiểm tra lại mã đơn hoặc liên hệ tổng đài để được hỗ trợ.</p>
        </div>
      `;
    }
  },

  // --- 6. GẮN SỰ KIỆN TOÀN CỤC ---
  attachGlobalEvents() {
    // Nút giỏ hàng Navbar
    const navCartBtn = document.getElementById('nav-cart-btn');
    if (navCartBtn) {
      navCartBtn.addEventListener('click', () => this.openCartDrawer());
    }

    // Đóng drawer giỏ hàng
    const closeDrawerBtn = document.getElementById('btn-close-drawer');
    const drawerOverlay = document.getElementById('cart-drawer-overlay');
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', () => this.closeCartDrawer());
    if (drawerOverlay) {
      drawerOverlay.addEventListener('click', (e) => {
        if (e.target === drawerOverlay) this.closeCartDrawer();
      });
    }

    // Đóng modal generic
    const modal = document.getElementById('generic-modal');
    const modalClose = document.getElementById('btn-close-generic-modal');
    if (modalClose) modalClose.addEventListener('click', () => modal.classList.remove('active'));
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }

    // Tìm kiếm ô search trên navbar
    const searchInput = document.getElementById('nav-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = searchInput.value.trim();
          store.filters.search = val;
          store.filters.page = 1;
          window.location.hash = '#shop';
        }
      });
    }

    // Nút user trên Navbar -> Vào trang cá nhân hoặc mở modal đăng nhập
    const userBtn = document.getElementById('nav-user-btn');
    if (userBtn) {
      userBtn.addEventListener('click', () => {
        if (store.user) {
          window.location.hash = '#profile';
        } else {
          this.openAuthModal();
        }
      });
    }

    // Nút danh sách yêu thích Navbar
    const navWishBtn = document.getElementById('nav-wishlist-btn');
    if (navWishBtn) {
      navWishBtn.addEventListener('click', () => {
        if (store.user) {
          window.location.hash = '#profile?tab=wishlist';
        } else {
          showToast('Vui lòng đăng nhập để xem danh sách yêu thích!', 'info');
          this.openAuthModal();
        }
      });
    }
  },

  // --- 7. MODAL XÁC THỰC (ĐĂNG NHẬP & ĐĂNG KÝ 2 TAB) ---
  openAuthModal(defaultTab = 'login') {
    const modal = document.getElementById('generic-modal');
    const modalContent = document.getElementById('generic-modal-content');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div style="max-width: 440px; margin: 0 auto;">
        <div class="auth-nav-tabs">
          <button class="auth-nav-tab ${defaultTab === 'login' ? 'active' : ''}" id="tab-btn-login">
            <i class="fa-solid fa-right-to-bracket"></i> Đăng Nhập
          </button>
          <button class="auth-nav-tab ${defaultTab === 'register' ? 'active' : ''}" id="tab-btn-register">
            <i class="fa-solid fa-user-plus"></i> Đăng Ký
          </button>
        </div>

        <!-- FORM ĐĂNG NHẬP -->
        <div id="auth-panel-login" style="display: ${defaultTab === 'login' ? 'block' : 'none'};">
          <form id="form-customer-login">
            <div class="form-group">
              <label class="form-label">Tên tài khoản hoặc Email</label>
              <input type="text" id="cust-login-email" class="form-control" placeholder="Nhập tên tài khoản hoặc email..." required>
            </div>
            <div class="form-group">
              <label class="form-label">Mật khẩu</label>
              <input type="password" id="cust-login-pwd" class="form-control" placeholder="••••••••" required>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
              <i class="fa-solid fa-right-to-bracket"></i> Đăng Nhập
            </button>
          </form>

          <div style="text-align: center; margin-top: 18px; font-size: 0.85rem; color: var(--text-muted);">
            Chưa có tài khoản? <a href="javascript:void(0)" id="link-switch-register" style="color: var(--neon-cyan); font-weight: 700;">Đăng ký ngay</a>
          </div>
        </div>

        <!-- FORM ĐĂNG KÝ -->
        <div id="auth-panel-register" style="display: ${defaultTab === 'register' ? 'block' : 'none'};">
          <form id="form-customer-register">
            <div class="form-group">
              <label class="form-label">Tên tài khoản (Username) *</label>
              <input type="text" id="reg-username" class="form-control" placeholder="VD: sport_fan99, ducminh..." required minlength="3">
              <small style="color: var(--text-muted); font-size: 0.75rem;">Dùng để đăng nhập vào hệ thống</small>
            </div>
            <div class="form-group">
              <label class="form-label">Họ và tên *</label>
              <input type="text" id="reg-name" class="form-control" placeholder="Nguyễn Văn A" required>
            </div>
            <div class="form-group">
              <label class="form-label">Địa chỉ Email *</label>
              <input type="email" id="reg-email" class="form-control" placeholder="email@example.com" required>
            </div>
            <div class="form-group">
              <label class="form-label">Số điện thoại</label>
              <input type="tel" id="reg-phone" class="form-control" placeholder="0901234567">
            </div>
            <div class="form-group">
              <label class="form-label">Mật khẩu * (Tối thiểu 6 ký tự)</label>
              <input type="password" id="reg-pwd" class="form-control" placeholder="••••••••" required minlength="6">
            </div>
            <div class="form-group">
              <label class="form-label">Xác nhận mật khẩu *</label>
              <input type="password" id="reg-pwd-confirm" class="form-control" placeholder="••••••••" required minlength="6">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
              <i class="fa-solid fa-user-plus"></i> Tạo Tài Khoản Mới
            </button>
          </form>

          <div style="text-align: center; margin-top: 18px; font-size: 0.85rem; color: var(--text-muted);">
            Đã có tài khoản? <a href="javascript:void(0)" id="link-switch-login" style="color: var(--neon-cyan); font-weight: 700;">Đăng nhập</a>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');

    // Tab switcher
    const loginTabBtn = document.getElementById('tab-btn-login');
    const regTabBtn = document.getElementById('tab-btn-register');
    const loginPanel = document.getElementById('auth-panel-login');
    const regPanel = document.getElementById('auth-panel-register');

    const switchToTab = (tab) => {
      loginTabBtn.classList.toggle('active', tab === 'login');
      regTabBtn.classList.toggle('active', tab === 'register');
      loginPanel.style.display = tab === 'login' ? 'block' : 'none';
      regPanel.style.display = tab === 'register' ? 'block' : 'none';
    };

    loginTabBtn.addEventListener('click', () => switchToTab('login'));
    regTabBtn.addEventListener('click', () => switchToTab('register'));
    document.getElementById('link-switch-register').addEventListener('click', () => switchToTab('register'));
    document.getElementById('link-switch-login').addEventListener('click', () => switchToTab('login'));

    // Xử lý submit Đăng Nhập
    document.getElementById('form-customer-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = document.getElementById('cust-login-email').value.trim();
      const password = document.getElementById('cust-login-pwd').value;

      try {
        const res = await api.login(identifier, password);
        store.setUser(res.data.user, res.data.token);

        try {
          const wRes = await api.getWishlistIds();
          store.setWishlistIds(wRes.data || []);
        } catch (we) {}

        showToast(`Xin chào ${res.data.user.full_name}!`, 'success');
        modal.classList.remove('active');
        if (window.location.hash === '#profile') this.renderProfile();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // Xử lý submit Đăng Ký
    document.getElementById('form-customer-register').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('reg-username').value.trim();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const pwd = document.getElementById('reg-pwd').value;
      const pwdConfirm = document.getElementById('reg-pwd-confirm').value;

      if (username.length < 3) {
        showToast('Tên tài khoản phải có ít nhất 3 ký tự!', 'error');
        return;
      }

      if (pwd !== pwdConfirm) {
        showToast('Mật khẩu xác nhận không khớp!', 'error');
        return;
      }

      try {
        const res = await api.register({ username, full_name: name, email, phone, password: pwd });
        store.setUser(res.data.user, res.data.token);
        showToast('Đăng ký tài khoản thành công! Chào mừng bạn đến với SportZone.', 'success');
        modal.classList.remove('active');
        if (window.location.hash === '#profile') this.renderProfile();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  },

  // --- 8. TRANG CÁ NHÂN & ĐƠN HÀNG CỦA TÔI (CUSTOMER PORTAL) ---
  async renderProfile() {
    const container = document.getElementById('view-profile');
    if (!container) return;

    if (!store.user) {
      container.innerHTML = `
        <div style="max-width: 480px; margin: 80px auto; padding: 40px; background: var(--bg-surface); border-radius: var(--radius-lg); text-align: center; border: 1px solid var(--border-subtle);">
          <div class="cat-icon-wrap" style="color: var(--neon-cyan); margin: 0 auto 16px;"><i class="fa-solid fa-user-lock fa-2x"></i></div>
          <h2 style="font-size: 1.5rem; margin-bottom: 8px;">Yêu Cầu Đăng Nhập</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px;">Vui lòng đăng nhập hoặc tạo tài khoản để quản lý đơn hàng, danh sách yêu thích và sổ địa chỉ.</p>
          <button class="btn btn-primary" onclick="app.openAuthModal('login')">
            <i class="fa-solid fa-right-to-bracket"></i> Đăng Nhập Ngay
          </button>
          <button class="btn btn-outline" style="margin-left: 8px;" onclick="app.openAuthModal('register')">
            Đăng Ký
          </button>
        </div>
      `;
      return;
    }

    // Đọc tab từ url hash query
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const activeTab = urlParams.get('tab') || 'orders';

    container.innerHTML = `
      <div class="profile-portal">
        <div class="profile-header">
          <div>
            <span class="section-tag"><i class="fa-solid fa-circle-user"></i> Tài Khoản Khách Hàng</span>
            <h1 class="section-title">Xin chào, <span style="color: var(--neon-cyan);">${store.user.full_name}</span></h1>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">Email: <strong>${store.user.email}</strong> • Vai trò: <strong>${store.user.role}</strong></p>
          </div>
          <div>
            <button class="btn btn-outline btn-sm" id="btn-profile-logout" style="color: var(--neon-red); border-color: rgba(255,51,102,0.4);">
              <i class="fa-solid fa-arrow-right-from-bracket"></i> Đăng Xuất
            </button>
          </div>
        </div>

        <div class="profile-nav-tabs">
          <button class="profile-tab ${activeTab === 'orders' ? 'active' : ''}" data-tab="orders">
            <i class="fa-solid fa-boxes-packing"></i> Đơn Hàng Của Tôi
          </button>
          <button class="profile-tab ${activeTab === 'addresses' ? 'active' : ''}" data-tab="addresses">
            <i class="fa-solid fa-location-dot"></i> Sổ Địa Chỉ
          </button>
          <button class="profile-tab ${activeTab === 'wishlist' ? 'active' : ''}" data-tab="wishlist">
            <i class="fa-solid fa-heart" style="color: #ff3366;"></i> Sản Phẩm Yêu Thích (${store.wishlistIds.length})
          </button>
          <button class="profile-tab ${activeTab === 'account' ? 'active' : ''}" data-tab="account">
            <i class="fa-solid fa-gear"></i> Cài Đặt Tài Khoản
          </button>
        </div>

        <div id="profile-tab-content">
          <div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>
        </div>
      </div>
    `;

    // Gắn sự kiện chuyển tab
    container.querySelectorAll('.profile-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        window.location.hash = `#profile?tab=${tab}`;
      });
    });

    document.getElementById('btn-profile-logout').addEventListener('click', () => {
      store.logout();
    });

    // Tải nội dung tab tương ứng
    if (activeTab === 'orders') await this.loadProfileOrdersTab();
    else if (activeTab === 'addresses') await this.loadProfileAddressesTab();
    else if (activeTab === 'wishlist') await this.loadProfileWishlistTab();
    else if (activeTab === 'account') await this.loadProfileAccountTab();
  },

  // 8.1 Tab Đơn Hàng Của Tôi
  async loadProfileOrdersTab() {
    const tabContent = document.getElementById('profile-tab-content');
    if (!tabContent) return;

    try {
      const res = await api.getUserOrders({ limit: 20 });
      const orders = res.data;

      if (!orders || orders.length === 0) {
        tabContent.innerHTML = `
          <div style="text-align: center; padding: 60px 20px; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
            <i class="fa-solid fa-box-open fa-3x" style="color: var(--text-dark); margin-bottom: 16px;"></i>
            <h3>Bạn chưa có đơn đặt hàng nào</h3>
            <p style="color: var(--text-muted); margin-top: 6px;">Hãy khám phá các trang thiết bị thể thao chất lượng tại SportZone!</p>
            <a href="#shop" class="btn btn-cyan btn-sm" style="margin-top: 18px;">
              <i class="fa-solid fa-fire"></i> Khám Phá Cửa Hàng
            </a>
          </div>
        `;
        return;
      }

      tabContent.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
          ${orders.map(ord => `
            <div class="glass-panel" style="padding: 22px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border-subtle); padding-bottom: 14px; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
                <div>
                  <span class="badge ${ord.order_status === 'delivered' ? 'badge-stock' : (ord.order_status === 'cancelled' ? 'badge-sale' : 'badge-hot')}">
                    ${ord.order_status.toUpperCase()}
                  </span>
                  <strong style="font-size: 1.15rem; color: var(--neon-cyan); margin-left: 10px;">${ord.order_code}</strong>
                  <span style="font-size: 0.82rem; color: var(--text-muted); margin-left: 8px;">(${new Date(ord.created_at).toLocaleDateString('vi-VN')})</span>
                </div>
                <div>
                  <span style="font-size: 0.85rem; color: var(--text-muted);">Tổng thanh toán: </span>
                  <strong style="font-size: 1.2rem; color: #fff;">${formatVND(ord.total_amount)}</strong>
                </div>
              </div>

              <!-- Danh sách items -->
              <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                ${ord.items ? ord.items.map(it => `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255,255,255,0.02); border-radius: var(--radius-sm);">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <img src="${it.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100'}" style="width: 44px; height: 44px; object-fit: cover; border-radius: var(--radius-sm);">
                      <div>
                        <div style="font-weight: 700; font-size: 0.9rem;">${it.product_name}</div>
                        <small style="color: var(--neon-cyan);">${it.variant_label || 'Tiêu chuẩn'}</small>
                      </div>
                    </div>
                    <div style="font-size: 0.88rem;">
                      ${formatVND(it.unit_price)} × <strong>${it.quantity}</strong> = <strong>${formatVND(it.total_price)}</strong>
                    </div>
                  </div>
                `).join('') : ''}
              </div>

              <!-- Nút hành động -->
              <div style="display: flex; justify-content: flex-end; gap: 10px; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 14px;">
                <a href="#tracking?code=${ord.order_code}" class="btn btn-outline btn-sm">
                  <i class="fa-solid fa-truck-ramp-box"></i> Tra Cứu Vận Chuyển
                </a>

                ${ord.order_status === 'pending' ? `
                  <button class="btn btn-sm btn-cancel-order" data-code="${ord.order_code}" style="background: rgba(255,51,102,0.15); color: var(--neon-red); border: 1px solid var(--neon-red);">
                    <i class="fa-solid fa-ban"></i> Hủy Đơn Hàng
                  </button>
                ` : ''}

                ${ord.order_status === 'delivered' ? `
                  <button class="btn btn-cyan btn-sm btn-review-order" data-slug="${ord.items && ord.items[0] ? ord.items[0].product_slug : ''}">
                    <i class="fa-solid fa-star"></i> Đánh Giá Sản Phẩm
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      // Gắn sự kiện Hủy đơn hàng (Mở Modal hiện đại thay vì prompt)
      tabContent.querySelectorAll('.btn-cancel-order').forEach(btn => {
        btn.addEventListener('click', () => {
          const code = btn.dataset.code;
          this.openCancelOrderModal(code);
        });
      });

      // Gắn sự kiện Đánh giá sản phẩm đã giao
      tabContent.querySelectorAll('.btn-review-order').forEach(btn => {
        btn.addEventListener('click', () => {
          const slug = btn.dataset.slug;
          if (slug) this.openProductDetailModal(slug);
        });
      });

    } catch (err) {
      tabContent.innerHTML = `<div style="color: var(--neon-red); padding: 40px; text-align: center;">Lỗi tải đơn hàng: ${err.message}</div>`;
    }
  },

  // Modal xác nhận và chọn lý do hủy đơn hàng chuyên nghiệp
  openCancelOrderModal(orderCode) {
    const modal = document.getElementById('generic-modal');
    const modalContent = document.getElementById('generic-modal-content');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="width: 58px; height: 58px; border-radius: 50%; background: rgba(255, 51, 102, 0.12); color: var(--neon-red); display: inline-flex; align-items: center; justify-content: center; font-size: 1.6rem; margin-bottom: 12px; border: 1px solid rgba(255, 51, 102, 0.3);">
          <i class="fa-solid fa-ban"></i>
        </div>
        <h2 style="font-size: 1.35rem; font-weight: 800; color: #fff;">Xác Nhận Hủy Đơn Hàng</h2>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">
          Mã đơn: <strong style="color: var(--neon-cyan); letter-spacing: 0.5px;">${orderCode}</strong>
        </p>
      </div>

      <form id="form-cancel-user-order">
        <div class="form-group">
          <label class="form-label">Vui lòng chọn lý do hủy đơn *</label>
          <select id="cancel-reason-preset" class="form-control" required style="font-weight: 500;">
            <option value="Thay đổi nhu cầu mua sắm">Thay đổi nhu cầu mua sắm</option>
            <option value="Muốn đổi kích cỡ (Size) hoặc mẫu mã sản phẩm khác">Muốn đổi kích cỡ (Size) hoặc mẫu mã sản phẩm khác</option>
            <option value="Thời gian giao hàng dự kiến chưa phù hợp">Thời gian giao hàng dự kiến chưa phù hợp</option>
            <option value="Muốn cập nhật lại địa chỉ nhận hàng">Muốn cập nhật lại địa chỉ nhận hàng</option>
            <option value="Tìm thấy mức giá hoặc khuyến mãi tốt hơn">Tìm thấy mức giá hoặc khuyến mãi tốt hơn</option>
            <option value="other">Lý do khác (Nhập chi tiết)</option>
          </select>
        </div>

        <div class="form-group" id="cancel-custom-reason-wrap" style="display: none;">
          <label class="form-label">Chi tiết lý do khác *</label>
          <textarea id="cancel-custom-reason" class="form-control" rows="2" placeholder="Vui lòng nhập lý do cụ thể..."></textarea>
        </div>

        <div style="background: rgba(255, 183, 3, 0.08); border: 1px solid rgba(255, 183, 3, 0.25); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 22px; font-size: 0.84rem; color: #ffb703; display: flex; gap: 10px; align-items: flex-start; line-height: 1.45;">
          <i class="fa-solid fa-triangle-exclamation" style="margin-top: 2px; flex-shrink: 0;"></i>
          <span>Khi hủy đơn hàng, hệ thống sẽ tự động hoàn trả số lượng dụng cụ thể thao về kho. Bạn có thể đặt lại bất cứ lúc nào.</span>
        </div>

        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button type="button" class="btn btn-outline" id="btn-abort-cancel-order">Giữ Lại Đơn Hàng</button>
          <button type="submit" class="btn btn-primary" style="background: var(--neon-red); border-color: var(--neon-red);">
            <i class="fa-solid fa-xmark"></i> Xác Nhận Hủy
          </button>
        </div>
      </form>
    `;

    modal.classList.add('active');

    const presetSelect = document.getElementById('cancel-reason-preset');
    const customWrap = document.getElementById('cancel-custom-reason-wrap');
    const customInput = document.getElementById('cancel-custom-reason');

    presetSelect.addEventListener('change', () => {
      if (presetSelect.value === 'other') {
        customWrap.style.display = 'block';
        customInput.required = true;
        customInput.focus();
      } else {
        customWrap.style.display = 'none';
        customInput.required = false;
      }
    });

    document.getElementById('btn-abort-cancel-order').addEventListener('click', () => {
      modal.classList.remove('active');
    });

    document.getElementById('form-cancel-user-order').addEventListener('submit', async (e) => {
      e.preventDefault();
      let reason = presetSelect.value;
      if (reason === 'other') {
        reason = customInput.value.trim() || 'Khách hủy đơn';
      }

      try {
        const res = await api.cancelUserOrder(orderCode, reason);
        showToast(res.message || 'Đã hủy đơn hàng thành công!', 'success');
        modal.classList.remove('active');
        this.loadProfileOrdersTab();
      } catch (cErr) {
        showToast(cErr.message, 'error');
      }
    });
  },

  // 8.2 Tab Sổ Địa Chỉ
  async loadProfileAddressesTab() {
    const tabContent = document.getElementById('profile-tab-content');
    if (!tabContent) return;

    try {
      const res = await api.getAddresses();
      const addresses = res.data;

      tabContent.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; align-items: start;">
          <!-- Danh sách địa chỉ đã lưu -->
          <div>
            <h3 style="font-size: 1.15rem; margin-bottom: 16px;">
              <i class="fa-solid fa-list-check" style="color: var(--neon-cyan);"></i> Địa Chỉ Nhận Hàng Của Bạn (${addresses.length})
            </h3>
            
            ${addresses.length === 0 ? `
              <div style="padding: 30px; background: var(--bg-surface); border-radius: var(--radius-md); text-align: center; color: var(--text-muted); border: 1px solid var(--border-subtle);">
                Bạn chưa lưu địa chỉ nào. Hãy thêm địa chỉ để thanh toán nhanh hơn!
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 14px;">
                ${addresses.map(a => `
                  <div class="glass-panel" style="padding: 16px 20px; border-left: 4px solid ${a.is_default ? 'var(--neon-green)' : 'var(--border-subtle)'};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                      <strong style="color: #fff; font-size: 1rem;">${a.receiver_name}</strong>
                      ${a.is_default ? '<span class="badge badge-stock"><i class="fa-solid fa-check"></i> Mặc định</span>' : ''}
                    </div>
                    <div style="font-size: 0.88rem; color: var(--neon-cyan); margin-bottom: 4px;"><i class="fa-solid fa-phone"></i> ${a.receiver_phone}</div>
                    <div style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5;">${a.street_address}${a.ward ? ', ' + a.ward : ''}${a.district ? ', ' + a.district : ''}, ${a.city_province}</div>

                    <div style="display: flex; gap: 12px; margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
                      ${!a.is_default ? `
                        <button class="btn btn-outline btn-sm btn-set-default-addr" data-id="${a.id}" style="padding: 2px 8px; font-size: 0.75rem;">
                          Đặt làm mặc định
                        </button>
                      ` : ''}
                      <button class="btn btn-outline btn-sm btn-del-addr" data-id="${a.id}" style="padding: 2px 8px; font-size: 0.75rem; color: var(--neon-red); border-color: rgba(255,51,102,0.4);">
                        <i class="fa-solid fa-trash"></i> Xóa
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Form thêm địa chỉ mới -->
          <div class="glass-panel" style="padding: 24px;">
            <h3 style="font-size: 1.15rem; margin-bottom: 16px;">
              <i class="fa-solid fa-plus-circle" style="color: var(--neon-cyan);"></i> Thêm Địa Chỉ Nhận Hàng Mới
            </h3>
            <form id="form-add-address">
              <div class="form-group">
                <label class="form-label">Tên người nhận hàng *</label>
                <input type="text" id="new-addr-name" class="form-control" value="${store.user.full_name}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Số điện thoại liên hệ *</label>
                <input type="tel" id="new-addr-phone" class="form-control" value="${store.user.phone || ''}" placeholder="0901234567" required>
              </div>
              <div class="form-group">
                <label class="form-label">Số nhà, Tên đường chi tiết *</label>
                <input type="text" id="new-addr-street" class="form-control" placeholder="123 Đường Thể Thao..." required>
              </div>
              <div class="form-group">
                <label class="form-label">Phường / Xã</label>
                <input type="text" id="new-addr-ward" class="form-control" placeholder="Phường Bến Nghé">
              </div>
              <div class="form-group">
                <label class="form-label">Quận / Huyện</label>
                <input type="text" id="new-addr-district" class="form-control" placeholder="Quận 1">
              </div>
              <div class="form-group">
                <label class="form-label">Tỉnh / Thành phố *</label>
                <input type="text" id="new-addr-city" class="form-control" placeholder="Hồ Chí Minh hoặc Hà Nội..." required>
              </div>
              <div style="margin-bottom: 16px;">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.88rem; cursor: pointer;">
                  <input type="checkbox" id="new-addr-default" checked> Đặt làm địa chỉ mặc định
                </label>
              </div>
              <button type="submit" class="btn btn-primary" style="width: 100%;">
                <i class="fa-solid fa-floppy-disk"></i> Lưu Địa Chỉ
              </button>
            </form>
          </div>
        </div>
      `;

      // Xử lý thêm địa chỉ
      document.getElementById('form-add-address').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await api.addAddress({
            receiver_name: document.getElementById('new-addr-name').value.trim(),
            receiver_phone: document.getElementById('new-addr-phone').value.trim(),
            street_address: document.getElementById('new-addr-street').value.trim(),
            ward: document.getElementById('new-addr-ward').value.trim(),
            district: document.getElementById('new-addr-district').value.trim(),
            city_province: document.getElementById('new-addr-city').value.trim(),
            is_default: document.getElementById('new-addr-default').checked
          });
          showToast('Đã thêm địa chỉ mới thành công!', 'success');
          this.loadProfileAddressesTab();
        } catch (aErr) {
          showToast(aErr.message, 'error');
        }
      });

      // Xử lý đặt mặc định
      tabContent.querySelectorAll('.btn-set-default-addr').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await api.setDefaultAddress(btn.dataset.id);
            showToast('Đã đặt làm địa chỉ mặc định!', 'success');
            this.loadProfileAddressesTab();
          } catch (dErr) {
            showToast(dErr.message, 'error');
          }
        });
      });

      // Xử lý xóa địa chỉ (Dùng showConfirmModal hiện đại)
      tabContent.querySelectorAll('.btn-del-addr').forEach(btn => {
        btn.addEventListener('click', () => {
          const addrId = btn.dataset.id;
          showConfirmModal({
            title: 'Xóa Địa Chỉ Nhận Hàng',
            message: 'Bạn có chắc chắn muốn xóa địa chỉ này khỏi sổ địa chỉ giao hàng?',
            confirmText: 'Xóa Địa Chỉ',
            cancelText: 'Giữ Lại',
            isDestructive: true,
            onConfirm: async () => {
              try {
                await api.deleteAddress(addrId);
                showToast('Đã xóa địa chỉ thành công!', 'success');
                this.loadProfileAddressesTab();
              } catch (xErr) {
                showToast(xErr.message, 'error');
              }
            }
          });
        });
      });

    } catch (err) {
      tabContent.innerHTML = `<div style="color: var(--neon-red); padding: 40px; text-align: center;">Lỗi: ${err.message}</div>`;
    }
  },

  // 8.3 Tab Sản Phẩm Yêu Thích (Wishlist)
  async loadProfileWishlistTab() {
    const tabContent = document.getElementById('profile-tab-content');
    if (!tabContent) return;

    try {
      const res = await api.getWishlist();
      const items = res.data;

      if (!items || items.length === 0) {
        tabContent.innerHTML = `
          <div style="text-align: center; padding: 60px 20px; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
            <i class="fa-regular fa-heart fa-3x" style="color: #ff3366; margin-bottom: 16px;"></i>
            <h3>Danh sách yêu thích đang trống</h3>
            <p style="color: var(--text-muted); margin-top: 6px;">Bấm vào biểu tượng trái tim ở góc mỗi sản phẩm để lưu lại những món bạn thích nhất!</p>
            <a href="#shop" class="btn btn-cyan btn-sm" style="margin-top: 18px;">
              <i class="fa-solid fa-bag-shopping"></i> Đi Mua Sắm Ngay
            </a>
          </div>
        `;
        return;
      }

      tabContent.innerHTML = `
        <div class="products-grid">
          ${items.map(p => `
            <div class="product-card" data-slug="${p.slug}">
              <div class="product-thumb">
                <button class="btn-wishlist-toggle active" data-product-id="${p.product_id}" title="Bỏ yêu thích">
                  <i class="fa-solid fa-heart"></i>
                </button>
                <img src="${p.thumbnail_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'}" alt="${p.name}">
              </div>
              <div class="product-body">
                <div class="prod-brand">${p.brand_name} • ${p.category_name}</div>
                <h3 class="prod-title">${p.name}</h3>
                <div class="prod-price-box">
                  <span class="current-price">${formatVND(p.base_price)}</span>
                  <button class="btn btn-primary btn-sm btn-quick-view" data-slug="${p.slug}">
                    <i class="fa-solid fa-cart-shopping"></i> Mua Ngay
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      this.attachProductCardEvents(tabContent);

    } catch (err) {
      tabContent.innerHTML = `<div style="color: var(--neon-red); padding: 40px; text-align: center;">Lỗi tải danh sách yêu thích: ${err.message}</div>`;
    }
  },

  // 8.4 Tab Cài Đặt Tài Khoản & Đổi Mật Khẩu
  async loadProfileAccountTab() {
    const tabContent = document.getElementById('profile-tab-content');
    if (!tabContent) return;

    tabContent.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
        <!-- Thông tin cá nhân -->
        <div class="glass-panel" style="padding: 24px;">
          <h3 style="font-size: 1.15rem; margin-bottom: 16px;">
            <i class="fa-solid fa-id-card" style="color: var(--neon-cyan);"></i> Cập Nhật Thông Tin Cá Nhân
          </h3>
          <form id="form-update-profile">
            <div class="form-group">
              <label class="form-label">Email đăng ký (Không thể thay đổi)</label>
              <input type="email" class="form-control" value="${store.user.email}" disabled style="opacity: 0.7;">
            </div>
            <div class="form-group">
              <label class="form-label">Họ và tên *</label>
              <input type="text" id="acc-name" class="form-control" value="${store.user.full_name}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Số điện thoại</label>
              <input type="tel" id="acc-phone" class="form-control" value="${store.user.phone || ''}" placeholder="0901234567">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
              <i class="fa-solid fa-check"></i> Lưu Thay Đổi
            </button>
          </form>
        </div>

        <!-- Đổi mật khẩu -->
        <div class="glass-panel" style="padding: 24px;">
          <h3 style="font-size: 1.15rem; margin-bottom: 16px;">
            <i class="fa-solid fa-key" style="color: var(--neon-orange);"></i> Đổi Mật Khẩu
          </h3>
          <form id="form-change-pwd">
            <div class="form-group">
              <label class="form-label">Mật khẩu hiện tại *</label>
              <input type="password" id="acc-old-pwd" class="form-control" placeholder="••••••••" required>
            </div>
            <div class="form-group">
              <label class="form-label">Mật khẩu mới * (Tối thiểu 6 ký tự)</label>
              <input type="password" id="acc-new-pwd" class="form-control" placeholder="••••••••" required minlength="6">
            </div>
            <div class="form-group">
              <label class="form-label">Xác nhận mật khẩu mới *</label>
              <input type="password" id="acc-confirm-pwd" class="form-control" placeholder="••••••••" required minlength="6">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px; background: var(--grad-primary);">
              <i class="fa-solid fa-shield"></i> Cập Nhật Mật Khẩu
            </button>
          </form>
        </div>
      </div>
    `;

    // Submit cập nhật thông tin
    document.getElementById('form-update-profile').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('acc-name').value.trim();
      const phone = document.getElementById('acc-phone').value.trim();
      try {
        const res = await api.updateProfile({ full_name: name, phone });
        store.setUser(res.data, localStorage.getItem('sports_auth_token'));
        showToast('Đã cập nhật thông tin cá nhân thành công!', 'success');
        this.renderProfile();
      } catch (uErr) {
        showToast(uErr.message, 'error');
      }
    });

    // Submit đổi mật khẩu
    document.getElementById('form-change-pwd').addEventListener('submit', async (e) => {
      e.preventDefault();
      const oldPwd = document.getElementById('acc-old-pwd').value;
      const newPwd = document.getElementById('acc-new-pwd').value;
      const confirmPwd = document.getElementById('acc-confirm-pwd').value;

      if (newPwd !== confirmPwd) {
        showToast('Mật khẩu mới xác nhận không khớp!', 'error');
        return;
      }

      try {
        const res = await api.changePassword(oldPwd, newPwd);
        showToast(res.message, 'success');
        document.getElementById('acc-old-pwd').value = '';
        document.getElementById('acc-new-pwd').value = '';
        document.getElementById('acc-confirm-pwd').value = '';
      } catch (pErr) {
        showToast(pErr.message, 'error');
      }
    });
  }
};

// Khởi chạy ứng dụng khi DOM tải xong
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
