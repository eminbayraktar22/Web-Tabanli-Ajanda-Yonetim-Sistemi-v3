const Task = require('../models/Task');
const Category = require('../models/Category');
const ActivityLog = require('../models/ActivityLog');
const Event = require('../models/Event');

// GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const { category_id, status, priority, search } = req.query;
    const { Op } = require('sequelize');

    const whereClause = { workspace_id: req.workspace_id };
    if (category_id) whereClause.category_id = category_id;
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

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
      user_id: req.user.id,
      workspace_id: req.workspace_id
    });
    
    await ActivityLog.create({ 
      workspace_id: req.workspace_id, 
      user_id: req.user.id, 
      action: 'CREATE', 
      entity_type: 'Task', 
      entity_id: task.id, 
      details: { title: task.title } 
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
    const task = await Task.findOne({ where: { id: req.params.id, workspace_id: req.workspace_id } });
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

    await ActivityLog.create({ 
      workspace_id: req.workspace_id, 
      user_id: req.user.id, 
      action: 'UPDATE', 
      entity_type: 'Task', 
      entity_id: task.id, 
      details: { title: task.title, status: task.status } 
    });

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
        { where: { id: item.id, workspace_id: req.workspace_id } }
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
    const task = await Task.findOne({ where: { id: req.params.id, workspace_id: req.workspace_id } });
    if (!task) return res.status(404).json({ success: false, message: 'Görev bulunamadı' });
    
    const title = task.title;
    await task.destroy();

    await ActivityLog.create({ 
      workspace_id: req.workspace_id, 
      user_id: req.user.id, 
      action: 'DELETE', 
      entity_type: 'Task', 
      entity_id: req.params.id, 
      details: { title } 
    });

    res.json({ success: true, message: 'Görev silindi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Görev silinemedi', error: error.message });
  }
};

// POST /api/tasks/bulk-delete — Toplu silme
exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, message: 'Geçersiz id listesi' });
    await Task.destroy({ where: { id: ids, workspace_id: req.workspace_id } });
    res.json({ success: true, message: `${ids.length} görev silindi` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Toplu silme başarısız', error: error.message });
  }
};

// POST /api/tasks/bulk-update — Toplu güncelleme (status veya priority)
exports.bulkUpdate = async (req, res) => {
  try {
    const { ids, status, priority } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, message: 'Geçersiz id listesi' });
    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    await Task.update(updateData, { where: { id: ids, workspace_id: req.workspace_id } });
    res.json({ success: true, message: `${ids.length} görev güncellendi` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Toplu güncelleme başarısız', error: error.message });
  }
};

// POST /api/tasks/:id/timer
exports.toggleTimer = async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, workspace_id: req.workspace_id } });
    if (!task) return res.status(404).json({ success: false, message: 'Görev bulunamadı' });

    const now = new Date();

    if (task.is_timer_running) {
      // Durdur
      if (task.timer_started_at) {
        const diffInSeconds = Math.floor((now.getTime() - new Date(task.timer_started_at).getTime()) / 1000);
        task.time_spent = (task.time_spent || 0) + diffInSeconds;
        
        // Otomatik Takvim Logu (Time Log)
        if (diffInSeconds > 60) { // Sadece 1 dakikadan uzun süren çalışmaları kaydet
          await Event.create({
            title: `Çalışma: ${task.title}`,
            description: `Pomodoro/Zamanlayıcı ile otomatik kaydedildi.\nSüre: ${Math.floor(diffInSeconds/60)} dakika.`,
            start_datetime: task.timer_started_at,
            end_datetime: now,
            all_day: false,
            user_id: req.user.id,
            workspace_id: req.workspace_id,
            category_id: task.category_id
          });
        }
      }
      task.is_timer_running = false;
      task.timer_started_at = null;
    } else {
      // Başlat
      task.is_timer_running = true;
      task.timer_started_at = now;
    }

    await task.save();
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Zamanlayıcı güncellenemedi', error: error.message });
  }
};
