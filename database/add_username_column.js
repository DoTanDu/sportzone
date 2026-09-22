const { run, query } = require('../backend/src/config/db');

async function migrate() {
  console.log('🔄 Đang tiến hành thêm cột `username` vào bảng `users`...');

  const cols = await query('PRAGMA table_info(users)');
  const hasUsername = cols.some(c => c.name === 'username');

  if (!hasUsername) {
    console.log('-> Thêm cột username VARCHAR(50)...');
    await run('ALTER TABLE users ADD COLUMN username VARCHAR(50)');
    await run('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)');
  } else {
    console.log('-> Cột username đã tồn tại.');
  }

  // Cập nhật username cho tài khoản admin
  await run(`UPDATE users SET username = 'admin' WHERE role = 'admin' AND (username IS NULL OR username = '')`);

  // Cập nhật username cho demo user
  await run(`UPDATE users SET username = 'sportzone_user' WHERE email = 'user@sportzone.vn' AND (username IS NULL OR username = '')`);

  // Cập nhật cho các tài khoản test còn lại nếu có
  const remaining = await query(`SELECT id, email FROM users WHERE username IS NULL OR username = ''`);
  for (const u of remaining) {
    let base = u.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
    let uname = (base || 'user') + '_' + u.id;
    await run('UPDATE users SET username = ? WHERE id = ?', [uname, u.id]);
  }

  console.log('✅ Hoàn tất migration cột username cho bảng users!');
  const users = await query('SELECT id, username, email, full_name, role FROM users');
  console.log('Danh sách tài khoản hiện có:', users);
}

migrate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Lỗi migration:', err);
    process.exit(1);
  });
