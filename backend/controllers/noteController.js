const Note = require('../models/Note');

exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.findAll({
      where: { workspace_id: req.workspace_id },
      order: [['updatedAt', 'DESC']],
    });
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Notlar getirilemedi', error: error.message });
  }
};

exports.createNote = async (req, res) => {
  try {
    const { title, content, color } = req.body;
    const note = await Note.create({
      title: title || 'İsimsiz Not',
      content: content || '',
      color: color || '#ffffff',
      user_id: req.user.id,
      workspace_id: req.workspace_id
    });
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not oluşturulamadı', error: error.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { title, content, color } = req.body;
    const note = await Note.findOne({ where: { id: req.params.id, workspace_id: req.workspace_id } });
    if (!note) return res.status(404).json({ success: false, message: 'Not bulunamadı' });

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (color !== undefined) note.color = color;

    await note.save();
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not güncellenemedi', error: error.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const deleted = await Note.destroy({ where: { id: req.params.id, workspace_id: req.workspace_id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Not bulunamadı' });
    res.json({ success: true, message: 'Not silindi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Not silinemedi', error: error.message });
  }
};
