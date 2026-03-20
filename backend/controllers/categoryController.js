const { validationResult } = require('express-validator');
const { Category, Event, Task } = require('../models');
const { Sequelize } = require('sequelize');

// 1. Kategorileri Listele (Event sayısıyla birlikte)
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { user_id: req.user.id },
      attributes: {
        include: [
          [
            Sequelize.literal(`(
              SELECT COUNT(*)
              FROM Events AS event
              WHERE
                event.category_id = Category.id
            )`),
            'eventCount'
          ],
          [
            Sequelize.literal(`(
              SELECT COUNT(*)
              FROM Tasks AS task
              WHERE
                task.category_id = Category.id
            )`),
            'taskCount'
          ]
        ]
      },
      order: [['name', 'ASC']]
    });
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    console.error('Get Categories Error:', error);
    res.status(500).json({ success: false, message: 'Kategoriler getirilirken hata oluştu' });
  }
};

// 2. Kategori Oluştur
exports.createCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { name, color_hex, icon } = req.body;
    
    const newCategory = await Category.create({
      name,
      color_hex: color_hex || '#3b82f6',
      icon: icon || 'Folder',
      user_id: req.user.id
    });

    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    console.error('Create Category Error:', error);
    res.status(500).json({ success: false, message: 'Kategori oluşturulurken hata oluştu' });
  }
};

// 3. Kategori Güncelle
exports.updateCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { name, color_hex, icon } = req.body;

    const category = await Category.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!category) return res.status(404).json({ success: false, message: 'Kategori bulunamadı' });

    await category.update({
      name: name !== undefined ? name : category.name,
      color_hex: color_hex !== undefined ? color_hex : category.color_hex,
      icon: icon !== undefined ? icon : category.icon
    });

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Update Category Error:', error);
    res.status(500).json({ success: false, message: 'Kategori güncellenirken hata oluştu' });
  }
};

// 4. Kategori Sil
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!category) return res.status(404).json({ success: false, message: 'Kategori bulunamadı' });

    // Veritabanı (Event -> Category) onDelete: 'SET NULL' şeklinde ilişkili
    // Kategori silinince eventi olan satırların category_id'si null olacak
    await category.destroy();

    res.status(204).json({ success: true, message: 'Kategori başarıyla silindi' }); // No Content
  } catch (error) {
    console.error('Delete Category Error:', error);
    res.status(500).json({ success: false, message: 'Kategori silinirken hata oluştu' });
  }
};
