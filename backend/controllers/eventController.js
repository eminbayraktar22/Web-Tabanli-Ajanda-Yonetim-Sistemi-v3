const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { Event, Category, Tag, Reminder, User } = require('../models'); // Added User model

// 1. Etkinlik Oluştur
exports.createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { title, description, start_datetime, end_datetime, all_day, category_id, tag_ids, shared_emails, rrule, attachment_url } = req.body; // Added rrule and attachment_url

    // Eğer Kategori verildiyse, kullanıcıya ait olup olmadığını kontrol et
    if (category_id) {
      const category = await Category.findOne({ where: { id: category_id, user_id: req.user.id } });
      if (!category) {
        return res.status(403).json({ success: false, message: 'Seçili kategori size ait değil veya bulunamadı' });
      }
    }

    // Etkinliği Oluştur
    const newEvent = await Event.create({
      title,
      description,
      start_datetime,
      end_datetime,
      all_day: all_day || false,
      user_id: req.user.id,
      category_id: category_id || null,
      shared_emails: shared_emails || null,
      rrule: rrule || null,
      attachment_url: attachment_url || null,
    });

    // Valid tag'leri iliştirme
    if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
      const tags = await Tag.findAll({ where: { id: tag_ids, user_id: req.user.id } });
      await newEvent.setTags(tags);
    }

    // İlişkileri ile dön
    const createdEvent = await Event.findByPk(newEvent.id, {
      include: [
        { model: Category, attributes: ['id', 'name', 'color_hex'] },
        { model: Tag, attributes: ['id', 'name'] }
      ]
    });

    res.status(201).json({ success: true, data: createdEvent });

    // --- Socket.IO Canlı Bildirim Gönderimi ---
    if (shared_emails) {
      const emailsArr = shared_emails.split(',').map(e => e.trim()).filter(e => e);
      if (emailsArr.length > 0) {
        const usersToNotify = await User.findAll({ where: { email: emailsArr } });
        const io = req.app.get('io');
        if (io) {
          usersToNotify.forEach(u => {
             io.to(u.id).emit('notification', {
               title: 'Yeni Etkinlik Daveti',
               message: `Biri sizi '${title}' etkinliğine davet etti.`
             });
          });
        }
      }
    }

  } catch (error) {
    console.error('Create Event Error:', error);
    res.status(500).json({ success: false, message: 'Etkinlik oluşturulurken sunucu hatası meydana geldi' });
  }
};

// 2. Tüm Etkinlikleri Listele (Filtrelerle)
exports.getEvents = async (req, res) => {
  try {
    const { start, end, category_id } = req.query;

    // 1. Kullanıcının kendi e-postasını bul (Paylaşılanları çekebilmek için)
    const currentUser = await User.findByPk(req.user.id);
    const myEmail = currentUser ? currentUser.email : '';

    let whereClause = {
      [Op.or]: [
        { user_id: req.user.id }, // Kendi etkinliklerim
        { shared_emails: { [Op.like]: `%${myEmail}%` } } // Bana paylaşılanlar
      ]
    };

    // Tarih aralığı filtresi
    if (start && end) {
      whereClause.start_datetime = {
        [Op.between]: [new Date(start), new Date(end)]
      };
    } else if (start) {
      whereClause.start_datetime = { [Op.gte]: new Date(start) };
    }

    // Kategori filtresi
    if (category_id) {
      // If category_id is provided, it should apply to events owned by the user
      // or shared events that also match the category.
      // This logic might need refinement based on exact requirements for shared events and categories.
      // For now, applying it to the main OR clause.
      whereClause = {
        [Op.and]: [
          whereClause, // Existing user_id or shared_emails condition
          { category_id: category_id }
        ]
      };
    }

    const events = await Event.findAll({
      where: whereClause,
      include: [
        { model: Category, attributes: ['id', 'name', 'color_hex'] },
        { model: Tag, attributes: ['id', 'name'], through: { attributes: [] } }
      ],
      order: [['start_datetime', 'ASC']]
    });

    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    console.error('Get Events Error:', error);
    res.status(500).json({ success: false, message: 'Etkinlikler getirilirken hata oluştu' });
  }
};

// 3. Tekil Etkinlik Getir
exports.getEventById = async (req, res) => {
  try {
    // Check if the user is the owner or if their email is in shared_emails
    const currentUser = await User.findByPk(req.user.id);
    const myEmail = currentUser ? currentUser.email : '';

    const event = await Event.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [
          { user_id: req.user.id },
          { shared_emails: { [Op.like]: `%${myEmail}%` } }
        ]
      },
      include: [
        { model: Category, attributes: ['id', 'name', 'color_hex'] },
        { model: Tag, attributes: ['id', 'name'], through: { attributes: [] } },
        { model: Reminder, attributes: ['id', 'remind_at', 'is_sent'] }
      ]
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Etkinlik bulunamadı' });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Get Event By ID Error:', error);
    res.status(500).json({ success: false, message: 'Etkinlik getirilirken hata oluştu' });
  }
};

// 4. Etkinlik Güncelle
exports.updateEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { title, description, start_datetime, end_datetime, all_day, category_id, tag_ids, shared_emails, rrule, attachment_url } = req.body; // Added rrule and attachment

    // Etkinliği Bul (Sadece sahibi güncelleyebilir)
    let event = await Event.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!event) return res.status(404).json({ success: false, message: 'Etkinlik bulunamadı veya yetkiniz yok' });

    // Kategori Sahiplik Kontrolü
    if (category_id && category_id !== event.category_id) {
       const category = await Category.findOne({ where: { id: category_id, user_id: req.user.id } });
       if (!category) return res.status(403).json({ success: false, message: 'Seçili kategori size ait değil veya bulunamadı' });
    }

    // Kaydı Güncelle
    await event.update({
      title: title || event.title,
      description: description !== undefined ? description : event.description,
      start_datetime: start_datetime || event.start_datetime,
      end_datetime: end_datetime || event.end_datetime,
      all_day: all_day !== undefined ? all_day : event.all_day,
      category_id: category_id !== undefined ? category_id : event.category_id,
      shared_emails: shared_emails !== undefined ? shared_emails : event.shared_emails,
      rrule: rrule !== undefined ? rrule : event.rrule,
      attachment_url: attachment_url !== undefined ? attachment_url : event.attachment_url,
    });

    // Tag'leri Güncelle (Verildiyse)
    if (tag_ids !== undefined) {
      if (Array.isArray(tag_ids) && tag_ids.length > 0) {
        const tags = await Tag.findAll({ where: { id: tag_ids, user_id: req.user.id } });
        await event.setTags(tags);
      } else {
        await event.setTags([]); // Boş dizi gelirse veya null gelirse etiketleri temizle
      }
    }

    // Güncel Hali Çek
    event = await Event.findByPk(event.id, {
      include: [
        { model: Category, attributes: ['id', 'name', 'color_hex'] },
        { model: Tag, attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });

    res.json({ success: true, data: event });

    // --- Socket.IO Canlı Bildirim Gönderimi ---
    if (shared_emails) {
      const emailsArr = shared_emails.split(',').map(e => e.trim()).filter(e => e);
      if (emailsArr.length > 0) {
        const usersToNotify = await User.findAll({ where: { email: emailsArr } });
        const io = req.app.get('io');
        if (io) {
          usersToNotify.forEach(u => {
             io.to(u.id).emit('notification', {
               title: 'Etkinlik Güncellendi',
               message: `Davetli olduğunuz '${title || event.title}' etkinliğinde değişiklik yapıldı.`
             });
          });
        }
      }
    }

  } catch (error) {
    console.error('Update Event Error:', error);
    res.status(500).json({ success: false, message: 'Etkinlik güncellenirken hata oluştu' });
  }
};

// 5. Etkinlik Sil
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!event) return res.status(404).json({ success: false, message: 'Etkinlik bulunamadı' });

    // İlişkili EventTags ve Reminders db on_delete: CASCADE configiyle silinir
    await event.destroy();

    res.status(204).json({ success: true, message: 'Etkinlik başarıyla silindi' }); // No Content
  } catch (error) {
    console.error('Delete Event Error:', error);
    res.status(500).json({ success: false, message: 'Etkinlik silinirken hata oluştu' });
  }
};

// 6. Etkinlikleri Dışa Aktar (.ICS Formatı)
exports.exportEvents = async (req, res) => {
  try {
    const currentUser = await User.findByPk(req.user.id);
    const myEmail = currentUser ? currentUser.email : '';

    const events = await Event.findAll({
      where: {
        [Op.or]: [
          { user_id: req.user.id },
          { shared_emails: { [Op.like]: `%${myEmail}%` } }
        ]
      }
    });

    // ICS Date Format (YYYYMMDDTHHMMSSZ)
    const formatDate = (date) => {
      if (!date) return '';
      return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    let icsContent = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//AjandaSys//TR\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n`;

    for (const ev of events) {
      icsContent += `BEGIN:VEVENT\r\n`;
      icsContent += `UID:${ev.id}@ajandasys.local\r\n`;
      icsContent += `DTSTAMP:${formatDate(new Date())}\r\n`;
      icsContent += `DTSTART:${formatDate(ev.start_datetime)}\r\n`;
      icsContent += `DTEND:${formatDate(ev.end_datetime)}\r\n`;
      icsContent += `SUMMARY:${ev.title}\r\n`;
      if (ev.description) {
        icsContent += `DESCRIPTION:${ev.description.replace(/\r?\n/g, '\\n')}\r\n`;
      }
      icsContent += `END:VEVENT\r\n`;
    }

    icsContent += `END:VCALENDAR\r\n`;

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ajanda_disa_aktarim.ics"');
    res.send(icsContent);
  } catch (error) {
    console.error('Export Events Error:', error);
    res.status(500).json({ success: false, message: 'Dışa aktarım sırasında hata oluştu' });
  }
};

// 7. Etkinlik Dosya Yükle
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Lütfen bir dosya seçin' });
    }
    // Sadece path URL'yi frontend'e dön
    const url = '/uploads/' + req.file.filename;
    res.json({ success: true, url, name: req.file.originalname });
  } catch (error) {
    console.error('Attachment Upload Error:', error);
    res.status(500).json({ success: false, message: 'Dosya yüklenemedi' });
  }
};
