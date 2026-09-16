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
    }
  },

  // Form đăng nhập Admin
  renderLoginForm() {
    return `
      <div style="max-width: 440px; margin: 80px auto; padding: 40px; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-md);">
        <div style="text-align: center; margin-bottom: 28px;">
          <div class="cat-icon-wrap" style="color: var(--neon-cyan);"><i class="fa-solid fa-lock"></i></div>
          <h2 style="font-size: 1.6rem; font-weight: 800; margin-bottom: 6px;">Đăng Nhập Quản Trị</h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">Dành riêng cho Quản lý & Nhân viên thể thao</p>
        </div>

        <div style="background: rgba(0, 240, 255, 0.08); border: 1px dashed var(--neon-cyan); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 20px; font-size: 0.85rem;">
          <strong>Tài khoản Quản trị viên (Admin):</strong><br>
          • Tài khoản: <code style="color: var(--neon-cyan); font-weight: bold; font-size: 1rem;">admin</code><br>
          • Mật khẩu: <code style="color: var(--neon-orange); font-weight: bold; font-size: 1rem;">admin</code>
        </div>

        <form id="admin-login-form">
          <div class="form-group">
            <label class="form-label">Tài khoản quản trị</label>
            <input type="text" id="admin-email" class="form-control" value="admin" placeholder="Nhập: admin" required>
          </div>
          <div class="form-group">
            <label class="form-label">Mật khẩu</label>
            <input type="password" id="admin-password" class="form-control" value="admin" placeholder="Nhập: admin" required>
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

      // Gắn sự kiện nhập thêm nhanh
      tabBody.querySelectorAll('.btn-quick-restock').forEach(btn => {
        btn.addEventListener('click', () => {
          const variantId = btn.dataset.id;
          const variantName = btn.dataset.name;
          const newQty = prompt(`Nhập số lượng tồn kho mới cho [${variantName}]:`, '50');
          if (newQty && !isNaN(newQty)) {
            api.updateVariantStock(variantId, parseInt(newQty, 10))
              .then(() => {
                showToast('Cập nhật số lượng tồn kho thành công!', 'success');
                this.loadOverviewTab();
              })
              .catch(err => showToast(err.message, 'error'));
          }
        });
      });

    } catch (err) {
      tabBody.innerHTML = `<div style="color: var(--neon-red); text-align: center;">Lỗi tải dữ liệu: ${err.message}</div>`;
    }
  },

  // 2. Tab Quản lý sản phẩm (Products)
  async loadProductsTab() {
    const tabBody = document.getElementById('admin-tab-body');
    try {
      const res = await api.getAdminProducts({ limit: 50 });
      const products = res.data;

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
                    ${p.is_active ? '<span style="color: var(--neon-green)">Đang bán</span>' : '<span style="color: var(--text-dark)">Đã ẩn</span>'}
                  </td>
                  <td>
                    <button class="btn btn-outline btn-sm btn-edit-prod" data-id="${p.id}" data-name="${p.name}" data-price="${p.base_price}">
                      <i class="fa-solid fa-pen-to-square"></i> Sửa
                    </button>
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

      // Nút sửa sản phẩm nhanh
      tabBody.querySelectorAll('.btn-edit-prod').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const currentPrice = btn.dataset.price;
          const currentName = btn.dataset.name;

          const newPrice = prompt(`Cập nhật giá bán mới cho sản phẩm "${currentName}":`, currentPrice);
          if (newPrice && !isNaN(newPrice)) {
            api.updateAdminProduct(id, { base_price: Number(newPrice) })
              .then(() => {
                showToast('Cập nhật giá sản phẩm thành công!', 'success');
                this.loadProductsTab();
              })
              .catch(err => showToast(err.message, 'error'));
          }
        });
      });

    } catch (err) {
      tabBody.innerHTML = `<div style="color: var(--neon-red); text-align: center;">Lỗi tải sản phẩm: ${err.message}</div>`;
    }
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
                  <td><strong style="color: var(--neon-cyan);">${o.order_code}</strong></td>
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
                  <td>
                    <button class="btn btn-outline btn-sm btn-update-order-status" data-id="${o.id}">
                      <i class="fa-solid fa-floppy-disk"></i> Lưu
                    </button>
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

    } catch (err) {
      tabBody.innerHTML = `<div style="color: var(--neon-red); text-align: center;">Lỗi tải đơn hàng: ${err.message}</div>`;
    }
  }
};
