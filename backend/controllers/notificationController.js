const Notification = require('../models/Notification');

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 20
    });
    const unreadCount = await Notification.count({
      where: { user_id: req.user.id, is_read: false }
    });
    res.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ success: false, message: 'Bildirimler getirilemedi' });
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { id: req.params.id, user_id: req.user.id } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'İşlem başarısız' });
  }
};

// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'İşlem başarısız' });
  }
};

// Yardımcı: DB'ye bildirim kaydet + socket emit
exports.createAndEmit = async (io, userId, type, title, message) => {
  try {
    const notif = await Notification.create({ user_id: userId, type, title, message });
    if (io) {
      io.to(userId).emit('notification', { id: notif.id, type, title, message, createdAt: notif.created_at });
    }
    return notif;
  } catch (error) {
    console.error('Create Notification Error:', error);
  }
};
