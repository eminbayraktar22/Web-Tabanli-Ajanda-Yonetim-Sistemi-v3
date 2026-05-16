const { TaskComment, User, Task } = require('../models');

// Göreve ait yorumları getir
exports.getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Görevin bu çalışma alanında olup olmadığını kontrol et
    const task = await Task.findOne({ where: { id: taskId, workspace_id: req.workspace_id } });
    if (!task) return res.status(404).json({ success: false, message: 'Görev bulunamadı' });

    const comments = await TaskComment.findAll({
      where: { task_id: taskId },
      include: [
        { model: User, attributes: ['id', 'name', 'avatar_url'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('Get Comments Error:', error);
    res.status(500).json({ success: false, message: 'Yorumlar getirilirken hata oluştu' });
  }
};

// Yorum Ekle
exports.addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, attachment_url } = req.body;

    if (!content && !attachment_url) {
      return res.status(400).json({ success: false, message: 'Yorum içeriği veya dosya gerekli' });
    }

    const task = await Task.findOne({ where: { id: taskId, workspace_id: req.workspace_id } });
    if (!task) return res.status(404).json({ success: false, message: 'Görev bulunamadı' });

    const newComment = await TaskComment.create({
      task_id: taskId,
      user_id: req.user.id,
      content: content || '',
      attachment_url: attachment_url || null
    });

    const commentWithUser = await TaskComment.findByPk(newComment.id, {
      include: [{ model: User, attributes: ['id', 'name', 'avatar_url'] }]
    });

    res.status(201).json({ success: true, data: commentWithUser });
  } catch (error) {
    console.error('Add Comment Error:', error);
    res.status(500).json({ success: false, message: 'Yorum eklenirken hata oluştu' });
  }
};

// Yorum Sil
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await TaskComment.findOne({ where: { id: commentId, user_id: req.user.id } });
    
    if (!comment) return res.status(404).json({ success: false, message: 'Yorum bulunamadı veya yetkiniz yok' });

    await comment.destroy();
    res.json({ success: true, message: 'Yorum silindi' });
  } catch (error) {
    console.error('Delete Comment Error:', error);
    res.status(500).json({ success: false, message: 'Yorum silinirken hata oluştu' });
  }
};
