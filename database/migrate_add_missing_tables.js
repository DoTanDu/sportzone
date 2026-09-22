const path = require('path');
const { run, query } = require('../backend/src/config/db');

async function migrate() {
  console.log('🔄 Đang tiến hành cập nhật cấu trúc Database...');

  const tables = [
    `CREATE TABLE IF NOT EXISTS wishlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE (user_id, product_id)
    );`,

    `CREATE TABLE IF NOT EXISTS coupon_usages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coupon_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        order_id INTEGER NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        UNIQUE (coupon_id, user_id)
    );`,

    `CREATE TABLE IF NOT EXISTS payment_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        gateway VARCHAR(30) NOT NULL,
        transaction_code VARCHAR(100),
        amount DECIMAL(12, 2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
        payment_url TEXT,
        gateway_response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS inventory_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_variant_id INTEGER NOT NULL,
        change_type VARCHAR(30) NOT NULL,
        quantity_change INTEGER NOT NULL,
        previous_quantity INTEGER NOT NULL,
        new_quantity INTEGER NOT NULL,
        reference_id VARCHAR(50),
        note VARCHAR(255),
        created_by VARCHAR(100) DEFAULT 'Hệ thống',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
    );`,

    `CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_coupon_usages_user ON coupon_usages(user_id, coupon_id);`,
    `CREATE INDEX IF NOT EXISTS idx_inventory_logs_variant ON inventory_logs(product_variant_id);`
  ];

  for (const sql of tables) {
    await run(sql);
  }

  console.log('✅ Đã cập nhật thành công tất cả các bảng mới vào sports_store.db!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Lỗi migration:', err);
  process.exit(1);
});
