const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const isMysql = process.env.DB_CLIENT === 'mysql' || Boolean(process.env.DB_HOST && process.env.DB_NAME);

let query, get, run, transaction, db;

if (isMysql) {
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sportzone',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
  });

  db = pool;
  console.log(`✅ Đang sử dụng MySQL Database: ${process.env.DB_USER || 'root'}@${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'sportzone'}`);

  query = async (sql, params = []) => {
    const [rows] = await pool.query(sql, params);
    return rows;
  };

  get = async (sql, params = []) => {
    const [rows] = await pool.query(sql, params);
    return rows[0] || null;
  };

  run = async (sql, params = []) => {
    const [result] = await pool.query(sql, params);
    return { id: result.insertId, changes: result.affectedRows };
  };

  transaction = async (callback) => {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      const txQuery = async (sql, params = []) => {
        const [rows] = await conn.query(sql, params);
        return rows;
      };
      const txGet = async (sql, params = []) => {
        const [rows] = await conn.query(sql, params);
        return rows[0] || null;
      };
      const txRun = async (sql, params = []) => {
        const [result] = await conn.query(sql, params);
        return { id: result.insertId, changes: result.affectedRows };
      };
      const result = await callback({ query: txQuery, get: txGet, run: txRun });
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  };
} else {
  // SQLite Fallback
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.resolve(__dirname, '../../', process.env.DB_PATH || '../database/sports_store.db');

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Lỗi kết nối Cơ sở dữ liệu:', err.message);
    } else {
      console.log('✅ Đã kết nối thành công đến SQLite Database:', dbPath);
      db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
        if (pragmaErr) console.error('Lỗi bật foreign_keys:', pragmaErr);
      });
    }
  });

  query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  };

  get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  };

  run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, changes: this.changes });
      });
    });
  };

  transaction = async (callback) => {
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
}

module.exports = {
  db,
  query,
  get,
  run,
  transaction
};
