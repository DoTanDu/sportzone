const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run, query } = require('../config/db');
const { JWT_SECRET } = require('../middlewares/auth');

// Đăng ký tài khoản mới
const register = async (req, res, next) => {
  try {
    const { full_name, email, phone, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải chứa ít nhất 6 ký tự.'
      });
    }

    // Kiểm tra trùng email
    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await run(
      `INSERT INTO users (full_name, email, phone, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'customer', 'active')`,
      [full_name.trim(), email.trim().toLowerCase(), phone ? phone.trim() : null, passwordHash]
    );

    const user = {
      id: result.id,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      role: 'customer'
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      data: {
        token,
        user
      }
    });
  } catch (err) {
    next(err);
  }
};

// Đăng nhập (Chấp nhận tài khoản dạng 'admin' hoặc email)
const login = async (req, res, next) => {
  try {
    const accountInput = (req.body.email || req.body.username || '').trim().toLowerCase();
    const { password } = req.body;

    if (!accountInput || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.'
      });
    }

    // Chấp nhận 'admin' hoặc email tương ứng
    const user = await get(
      'SELECT id, full_name, email, password_hash, role, status, avatar_url FROM users WHERE email = ? OR email = ?',
      [accountInput, accountInput === 'admin' ? 'admin@sportstore.vn' : accountInput]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản hoặc mật khẩu không chính xác.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị tạm khóa hoặc ngừng hoạt động.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản hoặc mật khẩu không chính xác.'
      });
    }

    const tokenPayload = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// Lấy thông tin cá nhân kèm sổ địa chỉ
const getProfile = async (req, res, next) => {
  try {
    const user = await get(
      'SELECT id, full_name, email, phone, role, avatar_url, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng.' });
    }

    const addresses = await query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC',
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        ...user,
        addresses
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getProfile
};
