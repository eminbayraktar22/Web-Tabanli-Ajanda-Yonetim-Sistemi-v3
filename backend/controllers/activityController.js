const { ActivityLog, User } = require('../models');

exports.getActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const activities = await ActivityLog.findAll({
      where: { workspace_id: req.workspace_id },
      include: [
        { model: User, attributes: ['id', 'name', 'avatar_url'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: limit
    });

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Get Activities Error:', error);
    res.status(500).json({ success: false, message: 'Hareket dökümü getirilemedi' });
  }
};
