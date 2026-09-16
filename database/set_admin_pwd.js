const bcrypt = require('../backend/node_modules/bcryptjs');
const sqlite3 = require('../backend/node_modules/sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'sports_store.db');
const db = new sqlite3.Database(dbPath);

const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync('admin', salt);

db.run(
  'UPDATE users SET password_hash = ? WHERE email = ?',
  [hash, 'admin@sportstore.vn'],
  function(err) {
    if (err) {
      console.error('Lỗi:', err);
    } else {
      console.log('✅ Đã cập nhật thành công mật khẩu admin = admin, changes:', this.changes);
      console.log('Hash mới:', hash);
      console.log('Kiểm tra khớp:', bcrypt.compareSync('admin', hash));
    }
    db.close();
  }
);
