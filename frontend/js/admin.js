/* ==========================================================
   SPORTS STORE - ADMIN PORTAL MODULE
   Quản lý sản phẩm thể thao, tồn kho và đơn hàng
   ========================================================== */

const admin = {
  currentTab: 'overview', // 'overview', 'products', 'orders'

  // Render màn hình Admin chính
  async render() {
    const container = document.getElementById('admin-view-content');
    if (!container) return;

    // 1. Nếu chưa đăng nhập hoặc không phải admin -> Render màn hình đăng nhập Admin
    if (!store.user || (store.user.role !== 'admin' && store.user.role !== 'staff')) {
      container.innerHTML = this.renderLoginForm();
      this.attachLoginEvents();
      return;
    }

    // 2. Đã đăng nhập -> Render khung làm việc Admin
    container.innerHTML = `
      <div class="admin-portal">
        <div class="admin-header">
          <div>
            <span class="section-tag"><i class="fa-solid fa-shield-halved"></i> Phân Hệ Quản Trị</span>
            <h1 class="section-title">Bảng Điều Khiển Cửa Hàng</h1>
          </div>
          <div style="display: flex; gap: 12px; align-items: center;">
            <span class="badge badge-hot"><i class="fa-solid fa-user-shield"></i> ${store.user.full_name} (${store.user.role})</span>
            <button class="btn btn-outline btn-sm" id="btn-admin-logout">
              <i class="fa-solid fa-right-from-bracket"></i> Đăng Xuất
            </button>
          </div>
        </div>

        <div class="admin-nav-tabs">
          <button class="admin-tab ${this.currentTab === 'overview' ? 'active' : ''}" data-tab="overview">
            <i class="fa-solid fa-chart-pie"></i> Tổng Quan Doanh Thu
          </button>
          <button class="admin-tab ${this.currentTab === 'products' ? 'active' : ''}" data-tab="products">
            <i class="fa-solid fa-boxes-stacked"></i> Quản Lý Sản Phẩm
          </button>
          <button class="admin-tab ${this.currentTab === 'orders' ? 'active' : ''}" data-tab="orders">
            <i class="fa-solid fa-clipboard-list"></i> Quản Lý Đơn Hàng
          </button>
          <button class="admin-tab ${this.currentTab === 'coupons' ? 'active' : ''}" data-tab="coupons">
            <i class="fa-solid fa-ticket"></i> Mã Giảm Giá (Vouchers)
          </button>
          <button class="admin-tab ${this.currentTab === 'reviews' ? 'active' : ''}" data-tab="reviews">
            <i class="fa-solid fa-star-half-stroke"></i> Duyệt Đánh Giá
          </button>
          <button class="admin-tab ${this.currentTab === 'users' ? 'active' : ''}" data-tab="users">
            <i class="fa-solid fa-users"></i> Khách Hàng
          </button>
        </div>

        <div id="admin-tab-body">
          <div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>
        </div>
      </div>
    `;

    // Gắn sự kiện tab
    container.querySelectorAll('.admin-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentTab = btn.dataset.tab;
        this.render();
      });
    });

    const logoutBtn = document.getElementById('btn-admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => store.logout());
    }

    // Tải nội dung tab tương ứng
    if (this.currentTab === 'overview') {
      await this.loadOverviewTab();
    } else if (this.currentTab === 'products') {
      await this.loadProductsTab();
    } else if (this.currentTab === 'orders') {
      await this.loadOrdersTab();
    } else if (this.currentTab === 'coupons') {
      await this.loadCouponsTab();
    } else if (this.currentTab === 'reviews') {
      await this.loadReviewsTab();
    } else if (this.currentTab === 'users') {
      await this.loadUsersTab();
    }
  },

  // Form đăng nhập Admin bảo mật
  renderLoginForm() {
    return `
      <div style="max-width: 440px; margin: 80px auto; padding: 40px; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-md);">
        <div style="text-align: center; margin-bottom: 28px;">
          <div class="cat-icon-wrap" style="color: var(--neon-cyan); margin: 0 auto 12px;"><i class="fa-solid fa-shield-halved fa-2x"></i></div>
          <h2 style="font-size: 1.6rem; font-weight: 800; margin-bottom: 6px;">Đăng Nhập Quản Trị</h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">Cổng bảo mật dành cho Ban quản lý & Nhân viên SportZone</p>
        </div>

        <form id="admin-login-form">
          <div class="form-group">
            <label class="form-label">Tài khoản hoặc Email quản trị</label>
            <input type="text" id="admin-email" class="form-control" placeholder="Nhập tên tài khoản hoặc email..." required autocomplete="username">
          </div>
          <div class="form-group">
            <label class="form-label">Mật khẩu</label>
            <input type="password" id="admin-password" class="form-control" placeholder="••••••••" required autocomplete="current-password">
          </div>
          <button type="submit" class="btn btn-cyan" style="width: 100%; margin-top: 10px;">
            <i class="fa-solid fa-arrow-right-to-bracket"></i> Đăng Nhập Quản Trị
          </button>
        </form>
      </div>
    `;
  },

  attachLoginEvents() {
    const form = document.getElementById('admin-login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('admin-email').value.trim();
      const password = document.getElementById('admin-password').value;

      try {
        const res = await api.login(email, password);
        if (res.data.user.role !== 'admin' && res.data.user.role !== 'staff') {
          showToast('Tài khoản của bạn không có quyền truy cập trang quản trị!', 'error');
          return;
        }
        store.setUser(res.data.user, res.data.token);
        showToast(`Chào mừng ${res.data.user.full_name} quay trở lại!`, 'success');
        this.render();
      } catch (err) {
        showToast(err.message || 'Đăng nhập thất bại.', 'error');
      }
    });
  },

  // 1. Tab Tổng Quan (Overview)
  async loadOverviewTab() {
    const tabBody = document.getElementById('admin-tab-body');
    try {
      const res = await api.getAdminDashboard();
      const stats = res.data;

      tabBody.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon stat-icon-green"><i class="fa-solid fa-money-bill-wave"></i></div>
            <div>
              <div class="stat-val">${formatVND(stats.total_revenue)}</div>
              <div class="stat-label">Doanh thu thực tế</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-cyan"><i class="fa-solid fa-cart-shopping"></i></div>
            <div>
              <div class="stat-val">${stats.total_orders}</div>
              <div class="stat-label">Tổng đơn đặt hàng</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-orange"><i class="fa-solid fa-users"></i></div>
            <div>
              <div class="stat-val">${stats.total_customers}</div>
              <div class="stat-label">Khách hàng thành viên</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-red"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <div>
              <div class="stat-val">${stats.low_stock_variants.length}</div>
              <div class="stat-label">Biến thể sắp hết hàng</div>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 24px;">
          <!-- Cảnh báo hết hàng -->
          <div class="glass-panel" style="padding: 24px;">
            <h3 style="font-size: 1.15rem; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-bell" style="color: var(--neon-red);"></i> Cảnh Báo Tồn Kho Sắp Hết (Dưới 10 sản phẩm)
            </h3>
            <div class="data-table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Biến thể (Size/Màu)</th>
                    <th>Tồn kho</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  ${stats.low_stock_variants.length === 0 ? '<tr><td colspan="4" style="text-align:center;">Kho hàng đầy đủ</td></tr>' : ''}
                  ${stats.low_stock_variants.map(v => `
                    <tr>
                      <td style="font-weight: 600;">${v.product_name}</td>
                      <td><span class="badge badge-sale">${v.size || 'N/A'} - ${v.color || ''}</span></td>
                      <td><strong style="color: var(--neon-red);">${v.stock_quantity}</strong></td>
                      <td>
                        <button class="btn btn-outline btn-sm btn-quick-restock" data-id="${v.id}" data-name="${v.product_name} (${v.size})">
                          <i class="fa-solid fa-plus"></i> Nhập Thêm
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Top bán chạy -->
          <div class="glass-panel" style="padding: 24px;">
            <h3 style="font-size: 1.15rem; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-fire" style="color: var(--neon-orange);"></i> Top Bán Chạy Nhất
            </h3>
            <div style="display: flex; flex-direction: column; gap: 14px;">
              ${stats.top_selling_products.map((p, idx) => `
                <div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: var(--bg-card); border-radius: var(--radius-md);">
                  <span style="font-weight: 900; font-size: 1.2rem; width: 24px; color: ${idx === 0 ? 'var(--neon-yellow)' : 'var(--text-dark)'};">#${idx + 1}</span>
                  <img src="${p.thumbnail_url}" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover;">
                  <div style="flex-grow: 1;">
                    <div style="font-size: 0.9rem; font-weight: 700;">${p.name}</div>
                    <div style="font-size: 0.8rem; color: var(--neon-cyan);">${formatVND(p.base_price)}</div>
                  </div>
                  <span class="badge badge-hot">Đã bán: ${p.sold_count}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      // Gắn sự kiện nhập thêm nhanh với Modal chuyên nghiệp (không dùng prompt)
      tabBody.querySelectorAll('.btn-quick-restock').forEach(btn => {
        btn.addEventListener('click', () => {
          const variantId = btn.dataset.id;
          const variantName = btn.dataset.name;
          const currentStock = btn.closest('tr').querySelector('td strong').textContent.trim();
          this.openQuickRestockModal(variantId, variantName, currentStock);
        });
      });

    } catch (err) {
      tabBody.innerHTML = `<div style="color: var(--neon-red); text-align: center;">Lỗi tải dữ liệu: ${err.message}</div>`;
    }
  },

  // Modal nhập kho nhanh chuyên nghiệp
  openQuickRestockModal(variantId, variantName, currentStock) {
    const modal = document.getElementById('generic-modal');
    const modalContent = document.getElementById('generic-modal-content');

    modalContent.innerHTML = `
      <div style="max-width: 440px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div class="cat-icon-wrap" style="color: var(--neon-cyan); margin: 0 auto 10px; width: 50px; height: 50px; font-size: 1.4rem;">
            <i class="fa-solid fa-boxes-packing"></i>
          </div>
          <h2 style="font-size: 1.35rem; font-weight: 800;">Nhập Thêm Hàng Vào Kho</h2>
          <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 4px;">${variantName}</p>
        </div>

        <form id="form-quick-restock">
          <div class="form-group">
            <label class="form-label">Tồn kho hiện tại trong hệ thống</label>
            <div style="font-size: 1.15rem; font-weight: 800; color: var(--neon-yellow); margin-bottom: 6px;">
              ${currentStock} món
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Số lượng tồn kho cập nhật mới *</label>
            <input type="number" id="restock-qty-input" class="form-control" value="${Number(currentStock) + 20}" min="0" required style="font-size: 1.1rem; font-weight: 700; color: var(--neon-cyan);">
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
            <button type="button" class="btn btn-outline" id="btn-cancel-restock">Hủy</button>
            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Xác Nhận Nhập Kho</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.add('active');

    document.getElementById('btn-cancel-restock').addEventListener('click', () => {
      modal.classList.remove('active');
    });

    document.getElementById('form-quick-restock').addEventListener('submit', async (e) => {
      e.preventDefault();
      const newQty = parseInt(document.getElementById('restock-qty-input').value, 10);
      try {
        await api.updateVariantStock(variantId, newQty);
        showToast('Cập nhật số lượng tồn kho thành công!', 'success');
        modal.classList.remove('active');
        this.loadOverviewTab();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  },

  // 2. Tab Quản lý sản phẩm (Products)
  async loadProductsTab() {
    const tabBody = document.getElementById('admin-tab-body');
    try {
      const res = await api.getAdminProducts({ limit: 50 });
      const products = res.data;
      this.products = products;

      tabBody.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="font-size: 1.25rem;">Danh Sách Sản Phẩm Trong Cửa Hàng (${products.length})</h3>
          <button class="btn btn-primary" id="btn-open-add-product">
            <i class="fa-solid fa-plus"></i> Thêm Sản Phẩm Mới
          </button>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên Sản Phẩm / SKU</th>
                <th>Môn Thể Thao</th>
                <th>Hãng</th>
                <th>Giá Bán</th>
                <th>Tổng Tồn Kho</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td>
                    <img src="${p.thumbnail_url}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover;">
                  </td>
                  <td>
                    <div style="font-weight: 700;">${p.name}</div>
                    <code style="font-size: 0.78rem; color: var(--text-dark);">${p.sku}</code>
                  </td>
                  <td><span class="badge badge-sale">${p.category_name}</span></td>
                  <td><strong>${p.brand_name}</strong></td>
                  <td style="font-weight: 700; color: var(--neon-cyan);">${formatVND(p.base_price)}</td>
                  <td>
                    <span class="badge ${p.total_stock > 10 ? 'badge-stock' : 'badge-low-stock'}">
                      ${p.total_stock} món (${p.variant_count} size/màu)
                    </span>
                  </td>
                  <td>
                    ${p.is_active ? '<span style="color: var(--neon-green); font-weight: 600;">Đang bán</span>' : '<span style="color: var(--text-dark); font-weight: 600;">Đã ẩn</span>'}
                  </td>
                  <td style="white-space: nowrap;">
                    <button class="btn btn-outline btn-sm btn-edit-prod" data-id="${p.id}" style="color: var(--neon-cyan); border-color: rgba(0,240,255,0.4);" title="Chỉnh sửa chi tiết & tồn kho">
                      <i class="fa-solid fa-pen-to-square"></i> Sửa
                    </button>
                    ${p.is_active ? `
                      <button class="btn btn-outline btn-sm btn-toggle-active-row" data-id="${p.id}" data-name="${p.name}" data-action="hide" style="color: #ffb703; border-color: rgba(255,183,3,0.4); margin-left: 4px;" title="Tạm ẩn sản phẩm khỏi cửa hàng">
                        <i class="fa-solid fa-eye-slash"></i> Ẩn
                      </button>
                    ` : `
                      <button class="btn btn-outline btn-sm btn-toggle-active-row" data-id="${p.id}" data-name="${p.name}" data-action="show" style="color: var(--neon-green); border-color: rgba(0,255,157,0.4); margin-left: 4px;" title="Bật hiển thị lại sản phẩm trên web">
                        <i class="fa-solid fa-eye"></i> Hiện
                      </button>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Nút mở modal thêm sản phẩm
      document.getElementById('btn-open-add-product').addEventListener('click', () => {
        this.openAddProductModal();
      });

      // Nút sửa sản phẩm toàn diện (Mở Modal đầy đủ thay vì prompt)
      tabBody.querySelectorAll('.btn-edit-prod').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          this.openEditProductModal(id);
        });
      });

      // Nút ẩn / hiện nhanh sản phẩm (Chỉ ẩn, không xóa vĩnh viễn dữ liệu)
      tabBody.querySelectorAll('.btn-toggle-active-row').forEach(btn => {
        btn.addEventListener('click', () => {
          const prodId = btn.dataset.id;
          const isHide = btn.dataset.action === 'hide';
          const newStatus = isHide ? 0 : 1;
          const prodName = btn.dataset.name;

          showConfirmModal({
            title: isHide ? 'Tạm Ẩn Sản Phẩm Khỏi Web' : 'Bật Hiển Thị Lại Sản Phẩm',
            message: isHide 
              ? `Bạn có chắc chắn muốn tạm ẩn sản phẩm "${prodName}" khỏi cửa hàng? Khách hàng sẽ không nhìn thấy sản phẩm này, nhưng toàn bộ lịch sử đơn hàng và tồn kho vẫn được bảo toàn nguyên vẹn.`
              : `Bạn có chắc chắn muốn bật hiển thị lại sản phẩm "${prodName}" trên cửa hàng để khách tiếp tục mua sắm?`,
            icon: isHide ? 'fa-eye-slash' : 'fa-eye',
            confirmText: isHide ? 'Tạm Ẩn' : 'Bật Hiển Thị',
            cancelText: 'Hủy Bỏ',
            isDestructive: false,
            onConfirm: async () => {
              try {
                await api.updateAdminProduct(prodId, { is_active: newStatus });
                showToast(isHide ? `Đã tạm ẩn sản phẩm "${prodName}" thành công!` : `Đã hiển thị lại sản phẩm "${prodName}"!`, 'success');
                this.loadProductsTab();
              } catch (err) {
                showToast(err.message, 'error');
              }
            }
          });
        });
      });

    } catch (err) {
      tabBody.innerHTML = `<div style="color: var(--neon-red); text-align: center;">Lỗi tải sản phẩm: ${err.message}</div>`;
    }
  },

  // Modal chỉnh sửa sản phẩm toàn diện & quản lý kho theo Size
  openEditProductModal(productId) {
    const p = this.products ? this.products.find(item => item.id == productId) : null;
    if (!p) {
      showToast('Không tìm thấy thông tin sản phẩm!', 'error');
      return;
    }

    const modal = document.getElementById('generic-modal');
    const modalContent = document.getElementById('generic-modal-content');

    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: #fff;">Chỉnh Sửa Dụng Cụ Thể Thao</h2>
          <span style="font-size: 0.85rem; color: var(--text-muted);">Mã SKU: <strong>${p.sku}</strong> • ${p.brand_name} - ${p.category_name}</span>
        </div>
        <span class="badge ${p.is_active ? 'badge-stock' : 'badge-low-stock'}">
          ${p.is_active ? 'Đang mở bán' : 'Tạm ẩn'}
        </span>
      </div>

      <form id="form-edit-product">
        <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Tên sản phẩm *</label>
            <input type="text" id="edit-prod-name" class="form-control" value="${p.name}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Giá bán niêm yết (VNĐ) *</label>
            <input type="number" id="edit-prod-price" class="form-control" value="${p.base_price}" required min="0">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Trạng thái kinh doanh</label>
            <select id="edit-prod-status" class="form-control">
              <option value="1" ${p.is_active ? 'selected' : ''}>Đang mở bán trên cửa hàng</option>
              <option value="0" ${!p.is_active ? 'selected' : ''}>Tạm ẩn khỏi cửa hàng</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Ghim nổi bật (Trang chủ)</label>
            <select id="edit-prod-featured" class="form-control">
              <option value="1" ${p.is_featured ? 'selected' : ''}>Có (Hiển thị mục Hot Trang chủ)</option>
              <option value="0" ${!p.is_featured ? 'selected' : ''}>Không</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Link ảnh thumbnail</label>
          <div style="display: flex; gap: 12px; align-items: center;">
            <input type="url" id="edit-prod-thumb" class="form-control" value="${p.thumbnail_url || ''}">
            <img src="${p.thumbnail_url}" id="edit-thumb-preview" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border-subtle); flex-shrink: 0;">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Mô tả ngắn</label>
          <input type="text" id="edit-prod-desc" class="form-control" value="${p.short_description || ''}">
        </div>

        <!-- Bảng quản lý kho theo Size / Biến thể -->
        <div class="form-group" style="margin-top: 18px;">
          <label class="form-label" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span><i class="fa-solid fa-boxes-stacked" style="color: var(--neon-cyan);"></i> Quản lý kho theo Size & Giá Biến Thể</span>
            <span style="font-size: 0.78rem; color: var(--text-muted);">Cập nhật trực tiếp số lượng tồn kho từng size</span>
          </label>
          <div style="max-height: 180px; overflow-y: auto; background: var(--bg-card); border-radius: var(--radius-md); padding: 8px 12px; border: 1px solid var(--border-subtle);">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem;">
              <thead>
                <tr style="color: var(--text-muted); border-bottom: 1px solid var(--border-subtle); text-align: left;">
                  <th style="padding: 6px 8px;">Kích cỡ (Size)</th>
                  <th style="padding: 6px 8px;">Màu sắc</th>
                  <th style="padding: 6px 8px;">Giá riêng (VNĐ)</th>
                  <th style="padding: 6px 8px;">Tồn kho (Món)</th>
                </tr>
              </thead>
              <tbody>
                ${(p.variants && p.variants.length > 0) ? p.variants.map(v => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <td style="padding: 6px 8px; font-weight: 700; color: #fff;">${v.size || 'Tiêu chuẩn'}</td>
                    <td style="padding: 6px 8px; color: var(--text-muted);">${v.color || 'Mặc định'}</td>
                    <td style="padding: 6px 8px;">
                      <input type="number" class="form-control edit-variant-price" data-vid="${v.id}" value="${v.price}" style="width: 120px; padding: 4px 8px; font-size: 0.82rem;">
                    </td>
                    <td style="padding: 6px 8px;">
                      <input type="number" class="form-control edit-variant-stock" data-vid="${v.id}" value="${v.stock_quantity}" min="0" style="width: 80px; padding: 4px 8px; font-size: 0.84rem; font-weight: 700; color: var(--neon-cyan);">
                    </td>
                  </tr>
                `).join('') : `
                  <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 12px;">Sản phẩm chưa có cấu hình biến thể</td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-subtle); flex-wrap: wrap; gap: 12px;">
          <div>
            <button type="button" class="btn btn-outline btn-sm" id="btn-toggle-active-prod" style="color: ${p.is_active ? '#ffb703' : 'var(--neon-green)'}; border-color: ${p.is_active ? 'rgba(255,183,3,0.4)' : 'rgba(0,255,157,0.4)'};">
              <i class="fa-solid ${p.is_active ? 'fa-eye-slash' : 'fa-eye'}"></i> ${p.is_active ? 'Tạm ẩn khỏi cửa hàng' : 'Bật hiển thị lại'}
            </button>
          </div>
          <div style="display: flex; gap: 12px;">
            <button type="button" class="btn btn-outline" id="btn-cancel-edit-prod">Hủy</button>
            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Lưu Thay Đổi</button>
          </div>
        </div>
      </form>
    `;

    modal.classList.add('active');

    // Xem trước ảnh khi đổi link
    const thumbInput = document.getElementById('edit-prod-thumb');
    const thumbPreview = document.getElementById('edit-thumb-preview');
    if (thumbInput && thumbPreview) {
      thumbInput.addEventListener('input', () => {
        thumbPreview.src = thumbInput.value || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600';
      });
    }

    document.getElementById('btn-cancel-edit-prod').addEventListener('click', () => {
      modal.classList.remove('active');
    });

    // Ẩn hoặc hiện lại sản phẩm (Không xóa vĩnh viễn)
    document.getElementById('btn-toggle-active-prod').addEventListener('click', async () => {
      const newStatus = p.is_active ? 0 : 1;
      try {
        await api.updateAdminProduct(p.id, { is_active: newStatus });
        showToast(newStatus ? 'Đã kích hoạt hiển thị sản phẩm!' : 'Đã tạm ẩn sản phẩm khỏi cửa hàng!', 'info');
        modal.classList.remove('active');
        this.loadProductsTab();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // Submit lưu toàn bộ thông tin sản phẩm và kho
    document.getElementById('form-edit-product').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-prod-name').value.trim();
      const base_price = Number(document.getElementById('edit-prod-price').value);
      const is_active = parseInt(document.getElementById('edit-prod-status').value, 10);
      const is_featured = parseInt(document.getElementById('edit-prod-featured').value, 10);
      const thumbnail_url = document.getElementById('edit-prod-thumb').value.trim();
      const short_description = document.getElementById('edit-prod-desc').value.trim();

      try {
        // 1. Cập nhật thông tin chung sản phẩm
        await api.updateAdminProduct(p.id, {
          name,
          base_price,
          is_active,
          is_featured,
          thumbnail_url,
          short_description
        });

        // 2. Cập nhật kho và giá từng biến thể (nếu có)
        const stockInputs = modalContent.querySelectorAll('.edit-variant-stock');
        const priceInputs = modalContent.querySelectorAll('.edit-variant-price');

        const updatePromises = [];
        stockInputs.forEach(input => {
          const vId = input.dataset.vid;
          const newStock = parseInt(input.value, 10);
          const priceInput = modalContent.querySelector(`.edit-variant-price[data-vid="${vId}"]`);
          const newPrice = priceInput ? Number(priceInput.value) : undefined;
          
          updatePromises.push(api.updateVariantStock(vId, newStock, newPrice));
        });

        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
        }

        showToast('Cập nhật thông tin sản phẩm và kho hàng thành công!', 'success');
        modal.classList.remove('active');
        this.loadProductsTab();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  },

  // Modal thêm sản phẩm mới
  openAddProductModal() {
    const modal = document.getElementById('generic-modal');
    const modalContent = document.getElementById('generic-modal-content');

    modalContent.innerHTML = `
      <h2 style="font-size: 1.5rem; margin-bottom: 20px;">Thêm Dụng Cụ Thể Thao Mới</h2>
      <form id="form-add-product">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Tên sản phẩm *</label>
            <input type="text" id="add-prod-name" class="form-control" placeholder="Ví dụ: Giày Bóng Đá Predator Accuracy" required>
          </div>
          <div class="form-group">
            <label class="form-label">Mã SKU *</label>
            <input type="text" id="add-prod-sku" class="form-control" placeholder="Ví dụ: ADI-PRED-2026" required>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Danh mục môn thể thao *</label>
            <select id="add-prod-cat" class="form-control" required>
              <option value="6">Bóng Đá - Giày cỏ nhân tạo</option>
              <option value="7">Bóng Đá - Quần áo thi đấu</option>
              <option value="8">Bóng Đá - Bóng thi đấu</option>
              <option value="9">Cầu Lông - Vợt cầu lông</option>
              <option value="11">Gym - Tạ tay & Tạ đòn</option>
              <option value="4">Chạy Bộ - Giày chạy bộ</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Thương hiệu *</label>
            <select id="add-prod-brand" class="form-control" required>
              <option value="1">Nike</option>
              <option value="2">Adidas</option>
              <option value="3">Yonex</option>
              <option value="4">Lining</option>
              <option value="5">Mizuno</option>
              <option value="6">Decathlon</option>
              <option value="7">Động Lực</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">Giá bán (VNĐ) *</label>
            <input type="number" id="add-prod-price" class="form-control" placeholder="1500000" required>
          </div>
          <div class="form-group">
            <label class="form-label">Link ảnh đại diện</label>
            <input type="url" id="add-prod-thumb" class="form-control" value="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Mô tả ngắn</label>
          <input type="text" id="add-prod-desc" class="form-control" placeholder="Dụng cụ thể thao chính hãng cao cấp...">
        </div>

        <div class="form-group">
          <label class="form-label">Các kích cỡ (Size) khởi tạo và Tồn kho</label>
          <div style="background: var(--bg-card); padding: 14px; border-radius: var(--radius-md); font-size: 0.88rem;">
            Tự động tạo 3 biến thể: <strong>Size 40, Size 41, Size 42</strong> (Tồn mỗi size: 15 món).
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
          <button type="button" class="btn btn-outline" id="btn-cancel-add-prod">Hủy</button>
          <button type="submit" class="btn btn-primary"><i class="fa-solid fa-check"></i> Lưu Sản Phẩm</button>
        </div>
      </form>
    `;

    modal.classList.add('active');

    document.getElementById('btn-cancel-add-prod').addEventListener('click', () => {
      modal.classList.remove('active');
    });

    document.getElementById('form-add-product').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('add-prod-name').value.trim();
      const sku = document.getElementById('add-prod-sku').value.trim();
      const category_id = parseInt(document.getElementById('add-prod-cat').value, 10);
      const brand_id = parseInt(document.getElementById('add-prod-brand').value, 10);
      const base_price = Number(document.getElementById('add-prod-price').value);
      const thumbnail_url = document.getElementById('add-prod-thumb').value.trim();
      const short_description = document.getElementById('add-prod-desc').value.trim();

      const variants = [
        { size: '40', color: 'Tiêu chuẩn', stock_quantity: 15, price: base_price },
        { size: '41', color: 'Tiêu chuẩn', stock_quantity: 15, price: base_price },
        { size: '42', color: 'Tiêu chuẩn', stock_quantity: 15, price: base_price }
      ];

      try {
        await api.createAdminProduct({
          name,
          sku,
          category_id,
          brand_id,
          base_price,
          thumbnail_url,
          short_description,
          variants
        });

        showToast('Đã thêm sản phẩm thể thao thành công!', 'success');
        modal.classList.remove('active');
        this.loadProductsTab();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  },

  // 3. Tab Quản lý đơn hàng (Orders)
  async loadOrdersTab() {
    const tabBody = document.getElementById('admin-tab-body');
    try {
      const res = await api.getAdminOrders({ limit: 50 });
      const orders = res.data;

      tabBody.innerHTML = `
        <h3 style="font-size: 1.25rem; margin-bottom: 20px;">Danh Sách Đơn Hàng Toàn Hệ Thống (${orders.length})</h3>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng / SĐT</th>
                <th>Địa Chỉ Giao Hàng</th>
                <th>Tổng Tiền</th>
                <th>Thanh Toán</th>
                <th>Trạng Thái Đơn</th>
                <th>Cập Nhật</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td>
                    <a href="javascript:void(0)" class="btn-view-order-detail" data-code="${o.order_code}" style="color: var(--neon-cyan); font-weight: 700; text-decoration: underline;" title="Bấm để xem danh sách món hàng">
                      <i class="fa-solid fa-receipt"></i> ${o.order_code}
                    </a>
                  </td>
                  <td>
                    <div>${o.receiver_name}</div>
                    <small style="color: var(--text-dark);">${o.receiver_phone}</small>
                  </td>
                  <td style="max-width: 240px; font-size: 0.82rem;">${o.shipping_address}</td>
                  <td style="font-weight: 800; color: #fff;">${formatVND(o.total_amount)}</td>
                  <td>
                    <span class="badge ${o.payment_status === 'paid' ? 'badge-stock' : 'badge-sale'}">
                      ${o.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </td>
                  <td>
                    <select class="form-control order-status-select" data-id="${o.id}" style="padding: 6px 10px; font-size: 0.82rem; font-weight: 700;">
                      <option value="pending" ${o.order_status === 'pending' ? 'selected' : ''}>Chờ duyệt</option>
                      <option value="confirmed" ${o.order_status === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option>
                      <option value="processing" ${o.order_status === 'processing' ? 'selected' : ''}>Đang đóng gói</option>
                      <option value="shipping" ${o.order_status === 'shipping' ? 'selected' : ''}>Đang giao hàng</option>
                      <option value="delivered" ${o.order_status === 'delivered' ? 'selected' : ''}>Đã giao thành công</option>
                      <option value="cancelled" ${o.order_status === 'cancelled' ? 'selected' : ''}>Đã hủy đơn</option>
                    </select>
                  </td>
                  <td style="white-space: nowrap;">
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-outline btn-sm btn-update-order-status" data-id="${o.id}" title="Lưu trạng thái mới">
                        <i class="fa-solid fa-floppy-disk"></i> Lưu
                      </button>
                      <button class="btn btn-outline btn-sm btn-view-order-detail" data-code="${o.order_code}" style="color: var(--neon-cyan); border-color: rgba(0,240,255,0.4);" title="Xem chi tiết các mặt hàng">
                        <i class="fa-solid fa-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Gắn sự kiện cập nhật trạng thái đơn
      tabBody.querySelectorAll('.btn-update-order-status').forEach(btn => {
        btn.addEventListener('click', async () => {
          const orderId = btn.dataset.id;
          const select = tabBody.querySelector(`.order-status-select[data-id="${orderId}"]`);
          const newStatus = select.value;

          try {
            await api.updateAdminOrderStatus(orderId, newStatus, `Quản trị viên cập nhật sang trạng thái: ${newStatus}`);
            showToast('Đã cập nhật trạng thái đơn hàng thành công!', 'success');
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });

      // Gắn sự kiện xem chi tiết các mặt hàng trong đơn
      tabBody.querySelectorAll('.btn-view-order-detail').forEach(btn => {
        btn.addEventListener('click', () => {
          const code = btn.dataset.code;
          this.openAdminOrderDetailModal(code);
        });
      });

    } catch (err) {
      tabBody.innerHTML = `<div style="color: var(--neon-red); text-align: center;">Lỗi tải đơn hàng: ${err.message}</div>`;
    }
  },

  // --- TAB 4: QUẢN LÝ MÃ GIẢM GIÁ (COUPONS) ---
  async loadCouponsTab() {
    const tabBody = document.getElementById('admin-tab-body');
    if (!tabBody) return;

    try {
      const res = await api.getAdminCoupons();
      const coupons = res.data;

      tabBody.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; align-items: start;">
          <!-- Danh sách Voucher -->
          <div class="glass-panel" style="padding: 20px;">
            <h3 style="font-size: 1.15rem; margin-bottom: 16px;">
              <i class="fa-solid fa-ticket" style="color: var(--neon-cyan);"></i> Danh Sách Mã Giảm Giá (${coupons.length})
            </h3>

            <div style="display: flex; flex-direction: column; gap: 12px; max-height: 480px; overflow-y: auto;">
              ${coupons.map(c => `
                <div style="background: var(--bg-card); padding: 14px 18px; border-radius: var(--radius-md); border-left: 4px solid ${c.is_active ? 'var(--neon-green)' : 'var(--text-dark)'};">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <strong style="color: var(--neon-cyan); font-size: 1.1rem; letter-spacing: 0.05em;">${c.code}</strong>
                    <span class="badge ${c.is_active ? 'badge-stock' : 'badge-sale'}">${c.is_active ? 'Hoạt động' : 'Tạm khóa'}</span>
                  </div>
                  <div style="font-size: 0.88rem; color: #fff; margin-bottom: 4px;">
                    Giảm: <strong>${c.discount_type === 'percentage' ? c.discount_value + '%' : formatVND(c.discount_value)}</strong>
                    ${c.max_discount_amount ? ` (Tối đa ${formatVND(c.max_discount_amount)})` : ''}
                  </div>
                  <div style="font-size: 0.82rem; color: var(--text-muted);">
                    Đơn tối thiểu: ${formatVND(c.min_order_value)} • Đã dùng: <strong>${c.used_count}/${c.usage_limit}</strong> lượt
                  </div>
                  <div style="font-size: 0.78rem; color: var(--text-dark); margin-top: 4px;">
                    Hạn: ${new Date(c.start_date).toLocaleDateString('vi-VN')} - ${new Date(c.end_date).toLocaleDateString('vi-VN')}
                  </div>
                  <div style="margin-top: 10px; display: flex; justify-content: flex-end; gap: 8px;">
                    ${c.is_active ? `
                      <button class="btn btn-outline btn-sm btn-deactivate-coupon" data-id="${c.id}" style="padding: 3px 10px; font-size: 0.75rem; color: #ffb703; border-color: rgba(255,183,3,0.4);" title="Tạm khóa mã">
                        <i class="fa-solid fa-pause"></i> Tạm khóa
                      </button>
                    ` : `
                      <button class="btn btn-outline btn-sm btn-activate-coupon" data-id="${c.id}" style="padding: 3px 10px; font-size: 0.75rem; color: var(--neon-green); border-color: rgba(0,255,157,0.4);" title="Bật hoạt động lại">
                        <i class="fa-solid fa-play"></i> Kích hoạt
                      </button>
                    `}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Form tạo Voucher mới -->
          <div class="glass-panel" style="padding: 24px;">
            <h3 style="font-size: 1.15rem; margin-bottom: 16px;">
              <i class="fa-solid fa-plus-circle" style="color: var(--neon-cyan);"></i> Thêm Bất Kỳ Voucher Mới Nào
            </h3>
            <form id="form-create-coupon">
              <div class="form-group">
                <label class="form-label">Mã Voucher (Mã code) *</label>
                <input type="text" id="coupon-code" class="form-control" placeholder="VD: SPORTZONE2026, SUMMER50, VIP..." required style="text-transform: uppercase; font-weight: 700;">
              </div>
              <div class="form-group">
                <label class="form-label">Mô tả chương trình ưu đãi</label>
                <input type="text" id="coupon-desc" class="form-control" placeholder="VD: Giảm giá ngày hội thể thao">
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">Loại giảm giá</label>
                  <select id="coupon-type" class="form-control">
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed_amount">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Giá trị giảm *</label>
                  <input type="number" id="coupon-value" class="form-control" placeholder="VD: 15 (cho 15%) hoặc 100000" required min="1">
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">Đơn tối thiểu (VNĐ)</label>
                  <input type="number" id="coupon-min-order" class="form-control" value="0" min="0">
                </div>
                <div class="form-group">
                  <label class="form-label">Giảm tối đa (VNĐ)</label>
                  <input type="number" id="coupon-max-discount" class="form-control" placeholder="Để trống nếu không giới hạn">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Số lượt sử dụng tối đa</label>
                <input type="number" id="coupon-usage-limit" class="form-control" value="100" min="1">
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">Ngày bắt đầu *</label>
                  <input type="date" id="coupon-start-date" class="form-control" required value="${new Date().toISOString().slice(0, 10)}">
                </div>
                <div class="form-group">
                  <label class="form-label">Ngày kết thúc *</label>
                  <input type="date" id="coupon-end-date" class="form-control" required value="${new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0, 10)}">
                </div>
              </div>
              <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
                <i class="fa-solid fa-floppy-disk"></i> Lưu & Kích Hoạt Voucher Ngay
              </button>
            </form>
          </div>
        </div>
      `;

      // Submit tạo coupon
      document.getElementById('form-create-coupon').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await api.createAdminCoupon({
            code: document.getElementById('coupon-code').value.trim().toUpperCase(),
            description: document.getElementById('coupon-desc').value.trim(),
            discount_type: document.getElementById('coupon-type').value,
            discount_value: Number(document.getElementById('coupon-value').value),
            min_order_value: Number(document.getElementById('coupon-min-order').value || 0),
            max_discount_amount: document.getElementById('coupon-max-discount').value ? Number(document.getElementById('coupon-max-discount').value) : null,
            usage_limit: parseInt(document.getElementById('coupon-usage-limit').value || 100, 10),
            start_date: document.getElementById('coupon-start-date').value + ' 00:00:00',
            end_date: document.getElementById('coupon-end-date').value + ' 23:59:59'
          });
          showToast('Đã tạo mã giảm giá mới thành công!', 'success');
          this.loadCouponsTab();
        } catch (cErr) {
          showToast(cErr.message, 'error');
        }
      });

      // Tạm khóa coupon
      tabBody.querySelectorAll('.btn-deactivate-coupon').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await api.updateAdminCoupon(btn.dataset.id, { is_active: 0 });
            showToast('Đã tạm khóa mã giảm giá!', 'info');
            this.loadCouponsTab();
          } catch (xErr) {
            showToast(xErr.message, 'error');
          }
        });
      });

      // Kích hoạt lại coupon
      tabBody.querySelectorAll('.btn-activate-coupon').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await api.updateAdminCoupon(btn.dataset.id, { is_active: 1 });
            showToast('Đã kích hoạt lại mã giảm giá!', 'success');
            this.loadCouponsTab();
          } catch (xErr) {
            showToast(xErr.message, 'error');
          }
        });
      });
    } catch (err) {
      tabBody.innerHTML = `<div style="color: var(--neon-red); text-align: center;">Lỗi tải mã giảm giá: ${err.message}</div>`;
    }
  },

  // --- TAB 5: DUYỆT ĐÁNH GIÁ SẢN PHẨM ---
  async loadReviewsTab() {
    const tabBody = document.getElementById('admin-tab-body');
    if (!tabBody) return;

    try {
      const res = await api.getAdminReviews({ limit: 50 });
      const reviews = res.data;

      tabBody.innerHTML = `
        <div class="glass-panel" style="padding: 24px;">
          <h3 style="font-size: 1.15rem; margin-bottom: 16px;">
            <i class="fa-solid fa-star-half-stroke" style="color: var(--neon-cyan);"></i> Kiểm Duyệt Đánh Giá Sản Phẩm (${reviews.length})
          </h3>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Khách hàng</th>
                  <th>Sao</th>
                  <th>Bình luận</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                ${reviews.length === 0 ? '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Không có đánh giá nào cần duyệt.</td></tr>' : ''}
                ${reviews.map(r => `
                  <tr>
                    <td><strong>${r.product_name}</strong></td>
                    <td>
                      <div>${r.user_name}</div>
                      <small style="color: var(--text-muted);">${r.user_email}</small>
                    </td>
                    <td><span style="color: #ffb703; font-weight: 700;">${'★'.repeat(r.rating)} (${r.rating}/5)</span></td>
                    <td style="max-width: 240px; font-size: 0.85rem; color: var(--text-muted);">${r.comment || 'Không có nhận xét'}</td>
                    <td>
                      <span class="badge ${r.status === 'approved' ? 'badge-stock' : (r.status === 'rejected' ? 'badge-sale' : 'badge-hot')}">
                        ${r.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style="display: flex; gap: 6px;">
                        ${r.status !== 'approved' ? `
                          <button class="btn btn-outline btn-sm btn-approve-review" data-id="${r.id}" style="color: var(--neon-green); border-color: var(--neon-green);" title="Duyệt đánh giá">
                            <i class="fa-solid fa-check"></i>
                          </button>
                        ` : ''}
                        ${r.status !== 'rejected' ? `
                          <button class="btn btn-outline btn-sm btn-reject-review" data-id="${r.id}" style="color: var(--neon-red); border-color: var(--neon-red);" title="Ẩn/Từ chối">
                            <i class="fa-solid fa-xmark"></i>
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      tabBody.querySelectorAll('.btn-approve-review').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await api.updateAdminReviewStatus(btn.dataset.id, 'approved');
            showToast('Đã duyệt đánh giá!', 'success');
            this.loadReviewsTab();
          } catch (e) {
            showToast(e.message, 'error');
          }
        });
      });

      tabBody.querySelectorAll('.btn-reject-review').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await api.updateAdminReviewStatus(btn.dataset.id, 'rejected');
            showToast('Đã từ chối/ẩn đánh giá!', 'success');
            this.loadReviewsTab();
          } catch (e) {
            showToast(e.message, 'error');
          }
        });
      });

    } catch (err) {
      tabBody.innerHTML = `<div style="color: var(--neon-red); text-align: center;">Lỗi tải đánh giá: ${err.message}</div>`;
    }
  },

  // Modal xem chi tiết đơn hàng toàn diện cho Quản trị viên
  async openAdminOrderDetailModal(orderCode) {
    const modal = document.getElementById('generic-modal');
    const modalContent = document.getElementById('generic-modal-content');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `<div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color: var(--neon-cyan);"></i></div>`;
    modal.classList.add('active');

    try {
      const res = await api.trackOrder(orderCode);
      const o = res.data;

      const statusMap = {
        pending: { text: 'Chờ duyệt', badge: 'badge-hot' },
        confirmed: { text: 'Đã xác nhận', badge: 'badge-stock' },
        processing: { text: 'Đang đóng gói', badge: 'badge-stock' },
        shipping: { text: 'Đang vận chuyển', badge: 'badge-stock' },
        delivered: { text: 'Đã giao thành công', badge: 'badge-stock' },
        cancelled: { text: 'Đã hủy đơn', badge: 'badge-low-stock' }
      };

      const st = statusMap[o.order_status] || { text: o.order_status, badge: 'badge-stock' };

      modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #fff;">Chi Tiết Đơn Hàng</h2>
            <span style="font-size: 0.88rem; color: var(--text-muted);">Mã đơn: <strong style="color: var(--neon-cyan);">${o.order_code}</strong> • Ngày đặt: ${new Date(o.created_at).toLocaleString('vi-VN')}</span>
          </div>
          <span class="badge ${st.badge}" style="font-size: 0.9rem; padding: 6px 14px;">${st.text}</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--neon-cyan); margin-bottom: 8px;">
              <i class="fa-solid fa-location-dot"></i> Thông Tin Người Nhận
            </h4>
            <div style="font-size: 0.88rem; line-height: 1.6;">
              <div><strong>${o.receiver_name}</strong> - <span>${o.receiver_phone}</span></div>
              <div style="color: var(--text-muted);">${o.shipping_address}</div>
              ${o.note ? `<div style="margin-top: 6px; color: #ffb703; font-style: italic;"><i class="fa-solid fa-comment-dots"></i> Ghi chú: ${o.note}</div>` : ''}
            </div>
          </div>

          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--neon-cyan); margin-bottom: 8px;">
              <i class="fa-solid fa-credit-card"></i> Thông Tin Thanh Toán
            </h4>
            <div style="font-size: 0.88rem; line-height: 1.6;">
              <div>Phương thức: <strong>${o.payment_method === 'banking' ? 'Chuyển khoản VietQR' : (o.payment_method === 'momo' ? 'Ví điện tử MoMo' : 'Thanh toán COD khi nhận hàng')}</strong></div>
              <div>Trạng thái: <span class="badge ${o.payment_status === 'paid' ? 'badge-stock' : 'badge-low-stock'}">${o.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></div>
              ${o.cancel_reason ? `<div style="margin-top: 6px; color: var(--neon-red);"><i class="fa-solid fa-ban"></i> Lý do hủy: ${o.cancel_reason}</div>` : ''}
            </div>
          </div>
        </div>

        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 10px;">
          <i class="fa-solid fa-boxes-stacked" style="color: var(--neon-cyan);"></i> Danh Sách Sản Phẩm Trong Đơn (${(o.items || []).length})
        </h4>

        <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; margin-bottom: 16px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.86rem;">
            <thead>
              <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--border-subtle); text-align: left; color: var(--text-muted);">
                <th style="padding: 10px 14px;">Sản phẩm</th>
                <th style="padding: 10px 14px;">Phân loại / Size</th>
                <th style="padding: 10px 14px; text-align: right;">Đơn giá</th>
                <th style="padding: 10px 14px; text-align: center;">SL</th>
                <th style="padding: 10px 14px; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${(o.items || []).map(item => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                  <td style="padding: 10px 14px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <img src="${item.thumbnail_url || item.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'}" style="width: 38px; height: 38px; border-radius: 6px; object-fit: cover;">
                      <strong style="color: #fff;">${item.product_name}</strong>
                    </div>
                  </td>
                  <td style="padding: 10px 14px; color: var(--text-muted);">${item.variant_label || 'Tiêu chuẩn'}</td>
                  <td style="padding: 10px 14px; text-align: right;">${formatVND(item.unit_price)}</td>
                  <td style="padding: 10px 14px; text-align: center; font-weight: 700;">x${item.quantity}</td>
                  <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: var(--neon-cyan);">${formatVND(item.total_price)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
          <div style="min-width: 260px; font-size: 0.9rem; line-height: 1.8;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Tạm tính:</span>
              <span>${formatVND(o.subtotal || o.total_amount)}</span>
            </div>
            ${o.discount_amount ? `
              <div style="display: flex; justify-content: space-between; color: var(--neon-green);">
                <span>Giảm giá (Voucher):</span>
                <span>-${formatVND(o.discount_amount)}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 800; border-top: 1px solid var(--border-subtle); padding-top: 6px; margin-top: 4px;">
              <span>Tổng thanh toán:</span>
              <span style="color: var(--neon-cyan);">${formatVND(o.total_amount)}</span>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <button type="button" class="btn btn-outline" id="btn-close-order-detail-modal">Đóng</button>
        </div>
      `;

      document.getElementById('btn-close-order-detail-modal').addEventListener('click', () => {
        modal.classList.remove('active');
      });

    } catch (err) {
      modalContent.innerHTML = `<div style="color: var(--neon-red); text-align: center; padding: 30px;">Lỗi tải chi tiết đơn hàng: ${err.message}</div>`;
    }
  },

  // --- TAB 6: QUẢN LÝ TÀI KHOẢN KHÁCH HÀNG ---
  async loadUsersTab() {
    const tabBody = document.getElementById('admin-tab-body');
    if (!tabBody) return;

    try {
      const res = await api.getAdminUsers({ limit: 50 });
      const users = res.data;

      tabBody.innerHTML = `
        <div class="glass-panel" style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff;">
                <i class="fa-solid fa-users" style="color: var(--neon-cyan);"></i> Quản Lý Khách Hàng (${users.length})
              </h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Danh sách tài khoản khách hàng đã đăng ký trên SportZone</p>
            </div>
            <div style="display: flex; gap: 10px;">
              <span class="badge badge-stock"><i class="fa-solid fa-user-check"></i> Hoạt động: ${users.filter(u => u.status === 'active').length}</span>
              <span class="badge badge-low-stock"><i class="fa-solid fa-user-lock"></i> Đã khóa: ${users.filter(u => u.status !== 'active').length}</span>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Khách Hàng</th>
                  <th>Email & SĐT</th>
                  <th>Ngày Đăng Ký</th>
                  <th>Số Đơn Đã Mua</th>
                  <th>Tổng Chi Tiêu</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                ${users.length === 0 ? '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">Chưa có tài khoản khách hàng nào trong hệ thống.</td></tr>' : ''}
                ${users.map(u => `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--bg-card); display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--neon-cyan); border: 1px solid var(--border-subtle);">
                          ${(u.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong style="color: #fff;">${u.full_name || 'Khách hàng'}</strong>
                          <div style="font-size: 0.76rem; color: var(--text-muted);">ID: #${u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>${u.email}</div>
                      <div style="font-size: 0.82rem; color: var(--text-muted);"><i class="fa-solid fa-phone" style="font-size: 0.75rem;"></i> ${u.phone || 'Chưa cập nhật'}</div>
                    </td>
                    <td style="font-size: 0.85rem; color: var(--text-muted);">
                      ${new Date(u.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <span class="badge ${u.total_orders > 0 ? 'badge-hot' : 'badge-stock'}">${u.total_orders} đơn</span>
                    </td>
                    <td style="font-weight: 700; color: var(--neon-cyan);">
                      ${formatVND(u.total_spent)}
                    </td>
                    <td>
                      <span class="badge ${u.status === 'active' ? 'badge-stock' : 'badge-low-stock'}">
                        ${u.status === 'active' ? 'Hoạt động' : (u.status === 'banned' ? 'Đã khóa' : 'Tạm dừng')}
                      </span>
                    </td>
                    <td>
                      ${u.status === 'active' ? `
                        <button class="btn btn-outline btn-sm btn-toggle-user-status" data-id="${u.id}" data-status="banned" data-name="${u.full_name}" style="color: var(--neon-red); border-color: rgba(255,51,102,0.4);" title="Khóa tài khoản này">
                          <i class="fa-solid fa-user-lock"></i> Khóa
                        </button>
                      ` : `
                        <button class="btn btn-outline btn-sm btn-toggle-user-status" data-id="${u.id}" data-status="active" data-name="${u.full_name}" style="color: var(--neon-green); border-color: rgba(0,255,157,0.4);" title="Mở khóa tài khoản">
                          <i class="fa-solid fa-user-check"></i> Mở Khóa
                        </button>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Gắn sự kiện khóa / mở khóa khách hàng
      tabBody.querySelectorAll('.btn-toggle-user-status').forEach(btn => {
        btn.addEventListener('click', () => {
          const userId = btn.dataset.id;
          const newStatus = btn.dataset.status;
          const userName = btn.dataset.name;
          const isBan = newStatus === 'banned';

          showConfirmModal({
            title: isBan ? 'Khóa Tài Khoản Khách Hàng' : 'Mở Khóa Tài Khoản',
            message: isBan 
              ? `Bạn có chắc chắn muốn khóa tài khoản "${userName}"? Khách hàng này sẽ không thể đăng nhập hoặc đặt hàng.`
              : `Bạn có chắc chắn muốn mở khóa tài khoản "${userName}" để khách hàng hoạt động bình thường?`,
            confirmText: isBan ? 'Khóa Tài Khoản' : 'Mở Khóa',
            cancelText: 'Hủy Bỏ',
            isDestructive: isBan,
            onConfirm: async () => {
              try {
                await api.updateAdminUserStatus(userId, newStatus);
                showToast(isBan ? 'Đã khóa tài khoản khách hàng!' : 'Đã mở khóa tài khoản thành công!', 'success');
                this.loadUsersTab();
              } catch (err) {
                showToast(err.message, 'error');
              }
            }
          });
        });
      });

    } catch (err) {
      tabBody.innerHTML = `<div style="color: var(--neon-red); text-align: center;">Lỗi tải danh sách khách hàng: ${err.message}</div>`;
    }
  }
};

