const { validationResult } = require('express-validator');
const { Tag } = require('../models');
const { Sequelize } = require('sequelize');

// 1. Etiketleri Listele (Kullanım sayısıyla)
exports.getTags = async (req, res) => {
  try {
    const tags = await Tag.findAll({
      where: { user_id: req.user.id },
      attributes: {
        include: [
          [
            // Junction (Ara) tablo EventTags'den bu etiketin kaç etkinlikte kullanıldığını sayar
            Sequelize.literal(`(
              SELECT COUNT(*)
              FROM EventTags AS eventTags
              WHERE
                eventTags.tag_id = Tag.id
            )`),
            'usageCount'
          ]
        ]
      },
      order: [['name', 'ASC']]
    });
    res.json({ success: true, count: tags.length, data: tags });
  } catch (error) {
    console.error('Get Tags Error:', error);
    res.status(500).json({ success: false, message: 'Etiketler getirilirken hata oluştu' });
  }
};

// 2. Etiket Oluştur
exports.createTag = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { name } = req.body;
    
    // Aynı isimde var mı (Case insensitive gibi yapılabilir, basit tutuldu)?
    const existing = await Tag.findOne({ where: { name, user_id: req.user.id } });
    if(existing) {
        return res.status(409).json({ success: false, message: 'Bu isimde bir etiket zaten mevcut' });
    }

    const newTag = await Tag.create({
      name,
      user_id: req.user.id
    });

    res.status(201).json({ success: true, data: newTag });
  } catch (error) {
    console.error('Create Tag Error:', error);
    res.status(500).json({ success: false, message: 'Etiket oluşturulurken hata oluştu' });
  }
};

// 3. Etiket Güncelle
exports.updateTag = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { name } = req.body;

    const tag = await Tag.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!tag) return res.status(404).json({ success: false, message: 'Etiket bulunamadı' });

    await tag.update({ name: name !== undefined ? name : tag.name });

    res.json({ success: true, data: tag });
  } catch (error) {
    console.error('Update Tag Error:', error);
    res.status(500).json({ success: false, message: 'Etiket güncellenirken hata oluştu' });
  }
};

// 4. Etiket Sil
exports.deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!tag) return res.status(404).json({ success: false, message: 'Etiket bulunamadı' });

    // Başarıyla silindiğinde ara tablodaki referansları modeldeki onDelete: CASCADE ayarı siler
    await tag.destroy();

    res.status(204).json({ success: true, message: 'Etiket başarıyla silindi' }); // No Content
  } catch (error) {
    console.error('Delete Tag Error:', error);
    res.status(500).json({ success: false, message: 'Etiket silinirken hata oluştu' });
  }
};
