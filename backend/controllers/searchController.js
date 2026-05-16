const { Op } = require('sequelize');
const { Event, Task, Category } = require('../models');

// GET /api/search?q=...
exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: { events: [], tasks: [] } });
    }

    const searchTerm = `%${q.trim()}%`;
    const workspaceId = req.workspace_id;

    const [events, tasks] = await Promise.all([
      Event.findAll({
        where: {
          workspace_id: workspaceId,
          [Op.or]: [
            { title: { [Op.like]: searchTerm } },
            { description: { [Op.like]: searchTerm } }
          ]
        },
        include: [{ model: Category, attributes: ['id', 'name', 'color_hex'] }],
        order: [['start_datetime', 'DESC']],
        limit: 5
      }),
      Task.findAll({
        where: {
          workspace_id: workspaceId,
          [Op.or]: [
            { title: { [Op.like]: searchTerm } },
            { description: { [Op.like]: searchTerm } }
          ]
        },
        order: [['createdAt', 'DESC']],
        limit: 5
      })
    ]);

    res.json({ success: true, data: { events, tasks } });
  } catch (error) {
    console.error('Search Error:', error);
    res.status(500).json({ success: false, message: 'Arama sırasında hata oluştu' });
  }
};
