const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Event, Task } = require('../models');

// GET /api/users/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash', 'reset_token', 'reset_token_expires'] }
    });
    if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });

    const [totalEvents, totalTasks] = await Promise.all([
      Event.count({ where: { workspace_id: req.workspace_id } }),
      Task.count({ where: { workspace_id: req.workspace_id } })
    ]);

    // Üyelik süresi (gün olarak)
    const membershipDays = Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        totalEvents,
        totalTasks,
        membershipDays
      }
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({ success: false, message: 'Kullanıcı bilgileri getirilemedi' });
  }
};

// PUT /api/users/me
exports.updateMe = async (req, res) => {
  try {
    const { name, avatar_url, ai_provider, ai_model, ai_api_key } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });

    if (name) user.name = name;
    if (avatar_url !== undefined) user.avatar_url = avatar_url;
    if (ai_provider !== undefined) user.ai_provider = ai_provider;
    if (ai_model !== undefined) user.ai_model = ai_model;
    if (ai_api_key !== undefined) user.ai_api_key = ai_api_key;

    await user.save();

    res.json({
      success: true,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        avatar_url: user.avatar_url,
        ai_provider: user.ai_provider,
        ai_model: user.ai_model,
        ai_api_key: user.ai_api_key
      }
    });
  } catch (error) {
    console.error('UpdateMe Error:', error);
    res.status(500).json({ success: false, message: 'Profil güncellenemedi' });
  }
};

// PUT /api/users/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Mevcut ve yeni şifre zorunludur' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Yeni şifre en az 6 karakter olmalıdır' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mevcut şifre yanlış' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Şifre başarıyla güncellendi' });
  } catch (error) {
    console.error('ChangePassword Error:', error);
    res.status(500).json({ success: false, message: 'Şifre güncellenemedi' });
  }
};
