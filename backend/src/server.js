const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middlewares/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình CORS cho phép frontend kết nối
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));

// Giới hạn kích thước payload (Chống tràn RAM/Buffer Overflow do request quá lớn)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging đơn giản trong môi trường dev
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

const path = require('path');

// Phục vụ giao diện Frontend tĩnh
app.use(express.static(path.join(__dirname, '../../frontend')));

// Định tuyến API chính
app.use('/api', apiRoutes);

// Fallback phục vụ Single-Page Application (SPA) cho mọi trang giao diện
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Xử lý Route API không tồn tại (404)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy tài nguyên API: ${req.method} ${req.originalUrl}`
  });
});

// Middleware xử lý lỗi toàn cục
app.use(errorHandler);

// Khởi động server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 SPORTS STORE BACKEND API ĐANG CHẠY`);
    console.log(`🔗 Cổng kết nối: http://localhost:${PORT}`);
    console.log(`🔍 Kiểm tra Health: http://localhost:${PORT}/api/health`);
    console.log(`📦 Danh sách sản phẩm: http://localhost:${PORT}/api/products`);
    console.log(`==================================================\n`);
  });
}

module.exports = app;
