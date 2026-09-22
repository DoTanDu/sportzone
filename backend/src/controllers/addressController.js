const { get, query, run } = require('../config/db');

// 1. Lấy toàn bộ sổ địa chỉ của người dùng
const getAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addresses = await query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC',
      [userId]
    );
    res.json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
};

// 2. Thêm địa chỉ nhận hàng mới
const addAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      receiver_name,
      receiver_phone,
      street_address,
      ward = '',
      district = '',
      city_province,
      is_default = false
    } = req.body;

    if (!receiver_name || !receiver_phone || !street_address || !city_province) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ tên người nhận, số điện thoại, địa chỉ chi tiết và Tỉnh/Thành phố.'
      });
    }

    // Nếu đánh dấu mặc định hoặc đây là địa chỉ đầu tiên, hủy mặc định các địa chỉ cũ
    const countRes = await get('SELECT COUNT(id) AS cnt FROM addresses WHERE user_id = ?', [userId]);
    const shouldBeDefault = is_default || countRes.cnt === 0;

    if (shouldBeDefault) {
      await run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }

    const result = await run(
      `INSERT INTO addresses (
        user_id, receiver_name, receiver_phone, street_address, ward, district, city_province, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        receiver_name.trim(),
        receiver_phone.trim(),
        street_address.trim(),
        ward.trim(),
        district.trim(),
        city_province.trim(),
        shouldBeDefault ? 1 : 0
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Đã thêm địa chỉ giao hàng mới thành công!',
      data: { id: result.id }
    });
  } catch (err) {
    next(err);
  }
};

// 3. Cập nhật thông tin địa chỉ
const updateAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      receiver_name,
      receiver_phone,
      street_address,
      ward,
      district,
      city_province,
      is_default
    } = req.body;

    const existing = await get('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ này.' });
    }

    if (is_default) {
      await run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }

    await run(
      `UPDATE addresses SET
        receiver_name = COALESCE(?, receiver_name),
        receiver_phone = COALESCE(?, receiver_phone),
        street_address = COALESCE(?, street_address),
        ward = COALESCE(?, ward),
        district = COALESCE(?, district),
        city_province = COALESCE(?, city_province),
        is_default = COALESCE(?, is_default)
       WHERE id = ? AND user_id = ?`,
      [
        receiver_name ? receiver_name.trim() : null,
        receiver_phone ? receiver_phone.trim() : null,
        street_address ? street_address.trim() : null,
        ward ? ward.trim() : null,
        district ? district.trim() : null,
        city_province ? city_province.trim() : null,
        is_default !== undefined ? (is_default ? 1 : 0) : null,
        id,
        userId
      ]
    );

    res.json({ success: true, message: 'Cập nhật địa chỉ nhận hàng thành công!' });
  } catch (err) {
    next(err);
  }
};

// 4. Đặt địa chỉ làm mặc định
const setDefaultAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const address = await get('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ này.' });
    }

    await run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    await run('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({ success: true, message: 'Đã đặt làm địa chỉ giao hàng mặc định.' });
  } catch (err) {
    next(err);
  }
};

// 5. Xóa địa chỉ
const deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const address = await get('SELECT id, is_default FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ này.' });
    }

    await run('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);

    // Nếu xóa địa chỉ mặc định, set địa chỉ còn lại làm mặc định
    if (address.is_default) {
      const nextAddr = await get('SELECT id FROM addresses WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
      if (nextAddr) {
        await run('UPDATE addresses SET is_default = 1 WHERE id = ?', [nextAddr.id]);
      }
    }

    res.json({ success: true, message: 'Đã xóa địa chỉ thành công.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress
};
