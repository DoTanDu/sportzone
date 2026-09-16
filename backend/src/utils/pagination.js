const MAX_PAGE_SIZE = parseInt(process.env.MAX_PAGE_SIZE, 10) || 50;
const DEFAULT_PAGE_SIZE = parseInt(process.env.DEFAULT_PAGE_SIZE, 10) || 12;

/**
 * Chuẩn hóa tham số phân trang an toàn
 * Ngăn chặn hiện tượng tràn bộ nhớ (Out of memory) do client yêu cầu LIMIT quá lớn hoặc âm.
 */
const getPagination = (queryPage, queryLimit) => {
  let page = parseInt(queryPage, 10);
  let limit = parseInt(queryLimit, 10);

  if (isNaN(page) || page < 1) {
    page = 1;
  }

  if (isNaN(limit) || limit < 1) {
    limit = DEFAULT_PAGE_SIZE;
  } else if (limit > MAX_PAGE_SIZE) {
    // Khống chế trần tối đa, tránh client truyền limit=1000000 gây sập DB
    limit = MAX_PAGE_SIZE;
  }

  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset
  };
};

/**
 * Đóng gói metadata phân trang trả về cho client
 */
const formatPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

module.exports = {
  getPagination,
  formatPaginationResponse,
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE
};
