const { validationResult } = require('express-validator');
const { Reminder, Event } = require('../models');
const { Op } = require('sequelize');

// 1. Kullanıcının bekleyen aktif Hatırlatıcılarını Listele
exports.getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.findAll({
      where: { 
        user_id: req.user.id,
        is_sent: false,
        remind_at: { [Op.gte]: new Date() } // Sadece gelecekteki hatırlatıcılar
      },
      include: [
        { model: Event, attributes: ['id', 'title', 'start_datetime'] }
      ],
      order: [['remind_at', 'ASC']]
    });

    res.json({ success: true, count: reminders.length, data: reminders });
  } catch (error) {
    console.error('Get Reminders Error:', error);
    res.status(500).json({ success: false, message: 'Hatırlatıcılar getirilirken hata oluştu' });
  }
};

// 2. Hatırlatıcı Oluştur
exports.createReminder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { event_id, remind_at } = req.body;

    // Etkinliğin kullanıcıya ait olduğundan emin ol
    const event = await Event.findOne({ where: { id: event_id, user_id: req.user.id } });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Etkinlik bulunamadı veya yetkiniz yok' });
    }

    // Seçilen zaman kendi içinde geçerli mi (Örn: Geçmiş zamana hatırlatıcı koyulamaz)
    if (new Date(remind_at) <= new Date()) {
       return res.status(400).json({ success: false, message: 'Hatırlatıcı tarihi geçmiş bir zaman olamaz' });
    }

    const newReminder = await Reminder.create({
      remind_at,
      user_id: req.user.id,
      event_id: event.id,
      is_sent: false
    });

    res.status(201).json({ success: true, data: newReminder });
  } catch (error) {
    console.error('Create Reminder Error:', error);
    res.status(500).json({ success: false, message: 'Hatırlatıcı oluşturulurken hata oluştu' });
  }
};

// 3. Hatırlatıcı İptal Et / Sil
exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!reminder) return res.status(404).json({ success: false, message: 'Hatırlatıcı bulunamadı' });

    await reminder.destroy();

    res.status(204).json({ success: true, message: 'Hatırlatıcı başarıyla iptal edildi' }); // No Content
  } catch (error) {
    console.error('Delete Reminder Error:', error);
    res.status(500).json({ success: false, message: 'Hatırlatıcı iptal edilirken hata oluştu' });
  }
};
