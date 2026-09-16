const errorHandler = (err, req, res, next) => {
  console.error('❌ [Server Error]:', err);

  // Xử lý lỗi SQLite Constraint (ví dụ: trùng lặp UNIQUE, khóa ngoại FOREIGN KEY)
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu đã tồn tại trong hệ thống (trùng lặp email, mã SKU hoặc tên).'
    });
  }

  if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({
      success: false,
      message: 'Ràng buộc quan hệ không hợp lệ (mã danh mục, hãng hoặc sản phẩm không tồn tại).'
    });
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
