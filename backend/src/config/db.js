const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbPath = path.resolve(__dirname, '../../', process.env.DB_PATH || '../database/sports_store.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Lỗi kết nối Cơ sở dữ liệu:', err.message);
  } else {
    console.log('✅ Đã kết nối thành công đến SQLite Database:', dbPath);
    // Bắt buộc bật ràng buộc khóa ngoại (Foreign Keys)
    db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
      if (pragmaErr) console.error('Lỗi bật foreign_keys:', pragmaErr);
    });
  }
});

// Helper thực thi truy vấn trả về nhiều dòng (Prepared statement chống SQL Injection)
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// Helper thực thi truy vấn trả về 1 dòng duy nhất
const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

// Helper thực thi câu lệnh INSERT / UPDATE / DELETE
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Helper thực thi Transaction (chống Race Condition và tràn/âm kho)
const transaction = async (callback) => {
  await run('BEGIN IMMEDIATE TRANSACTION;');
  try {
    const result = await callback({ query, get, run });
    await run('COMMIT;');
    return result;
  } catch (err) {
    await run('ROLLBACK;');
    throw err;
  }
};

module.exports = {
  db,
  query,
  get,
  run,
  transaction
};
