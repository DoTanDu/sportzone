const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run, query } = require('../config/db');
const { JWT_SECRET } = require('../middlewares/auth');

// Đăng ký tài khoản mới (Hỗ trợ Tên tài khoản - Username và Email)
const register = async (req, res, next) => {
  try {
    const { full_name, email, phone, password } = req.body;
    let username = (req.body.username || '').trim().toLowerCase();

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

    // Nếu không nhập username, tự sinh từ tiền tố email
    if (!username) {
      username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || `user_${Date.now().toString().slice(-6)}`;
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Tên tài khoản phải chứa ít nhất 3 ký tự.'
      });
    }

    // Kiểm tra trùng username
    const existingUsername = await get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: `Tên tài khoản "${username}" đã có người sử dụng. Vui lòng chọn tên tài khoản khác.`
      });
    }

    // Kiểm tra trùng email
    const existingEmail = await get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await run(
      `INSERT INTO users (username, full_name, email, phone, password_hash, role, status)
       VALUES (?, ?, ?, ?, ?, 'customer', 'active')`,
      [username, full_name.trim(), email.trim().toLowerCase(), phone ? phone.trim() : null, passwordHash]
    );

    const user = {
      id: result.id,
      username,
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

// Đăng nhập (Chấp nhận đăng nhập bằng Tên tài khoản HOẶC Email)
const login = async (req, res, next) => {
  try {
    const accountInput = (req.body.identifier || req.body.username || req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    if (!accountInput || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ tên tài khoản hoặc email và mật khẩu.'
      });
    }

    // Tìm theo username hoặc email
    const user = await get(
      'SELECT id, username, full_name, email, password_hash, role, status, avatar_url FROM users WHERE username = ? OR email = ?',
      [accountInput, accountInput]
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

    const payload = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
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
      'SELECT id, username, full_name, email, phone, role, avatar_url, created_at FROM users WHERE id = ?',
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

// Cập nhật thông tin cá nhân
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, avatar_url } = req.body;

    if (!full_name || full_name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Họ tên không được để trống.' });
    }

    await run(
      `UPDATE users SET
        full_name = ?,
        phone = COALESCE(?, phone),
        avatar_url = COALESCE(?, avatar_url),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [full_name.trim(), phone ? phone.trim() : null, avatar_url ? avatar_url.trim() : null, userId]
    );

    const updatedUser = await get(
      'SELECT id, full_name, email, phone, role, avatar_url FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công!',
      data: updatedUser
    });
  } catch (err) {
    next(err);
  }
};

// Đổi mật khẩu
const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ mật khẩu cũ và mật khẩu mới.'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải chứa ít nhất 6 ký tự.'
      });
    }

    const user = await get('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    }

    const isMatch = await bcrypt.compare(old_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(new_password, salt);

    await run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newHash, userId]);

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};
