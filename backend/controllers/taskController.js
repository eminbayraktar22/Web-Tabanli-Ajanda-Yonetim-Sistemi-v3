const Task = require('../models/Task');
const Category = require('../models/Category');

// GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const whereClause = { user_id: req.user.id };
    if (req.query.category_id) whereClause.category_id = req.query.category_id;

    const tasks = await Task.findAll({
      where: whereClause,
      order: [['order', 'ASC'], ['createdAt', 'DESC']],
      include: [{ model: Category, attributes: ['id', 'name', 'color_hex', 'icon'] }]
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Görevler getirilemedi', error: error.message });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, order, due_date, tags_json, subtasks_json, priority, attachment_url, category_id } = req.body;
    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      order: order || 0,
      due_date: due_date || null,
      tags_json: tags_json || null,
      subtasks_json: subtasks_json || null,
      priority: priority || 'medium',
      attachment_url: attachment_url || null,
      category_id: category_id || null,
      user_id: req.user.id
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Görev oluşturulamadı', error: error.message });
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const { title, description, status, order, due_date, tags_json, subtasks_json, priority, attachment_url, category_id } = req.body;
    const task = await Task.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!task) return res.status(404).json({ success: false, message: 'Görev bulunamadı' });
    
    task.title = title !== undefined ? title : task.title;
    task.description = description !== undefined ? description : task.description;
    task.status = status !== undefined ? status : task.status;
    task.order = order !== undefined ? order : task.order;
    task.due_date = due_date !== undefined ? due_date : task.due_date;
    task.tags_json = tags_json !== undefined ? tags_json : task.tags_json;
    task.subtasks_json = subtasks_json !== undefined ? subtasks_json : task.subtasks_json;
    task.priority = priority !== undefined ? priority : task.priority;
    task.attachment_url = attachment_url !== undefined ? attachment_url : task.attachment_url;
    task.category_id = category_id !== undefined ? category_id : task.category_id;
    
    await task.save();
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Görev güncellenemedi', error: error.message });
  }
};

// POST /api/tasks/reorder (Sürükle bırak sonrası toplu güncelleme)
exports.reorderTasks = async (req, res) => {
  try {
    const { items } = req.body; // [{ id: '...', status: 'in-progress', order: 1 }, ...]
    if (!Array.isArray(items)) {
       return res.status(400).json({ success: false, message: 'Geçersiz veri formatı' });
    }

    // Toplu güncelleme: Her bir işlem için await
    const promises = items.map(item => 
      Task.update(
        { status: item.status, order: item.order },
        { where: { id: item.id, user_id: req.user.id } }
      )
    );
    
    await Promise.all(promises);
    return res.json({ success: true, message: 'Sıralama güncellendi' });
  } catch (error) {
     res.status(500).json({ success: false, message: 'Sıralama güncellenirken hata', error: error.message });
  }
};

// POST /api/tasks/upload
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Dosya bulunamadı' });
    }
    const url = '/uploads/' + req.file.filename;
    res.json({ success: true, url, name: req.file.originalname });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Yükleme başarısız', error: error.message });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const deleted = await Task.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Görev bulunamadı' });
    res.json({ success: true, message: 'Görev silindi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Görev silinemedi', error: error.message });
  }
};
