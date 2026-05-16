const { Op, fn, col, literal } = require('sequelize');
const { Event, Task, Category } = require('../models');

// GET /api/stats/summary
exports.getSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
    const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const workspaceId = req.workspace_id;

    const todayEvents = await Event.count({
      where: { workspace_id: workspaceId, start_datetime: { [Op.between]: [startOfToday, endOfToday] } }
    });

    const weekEvents = await Event.count({
      where: { workspace_id: workspaceId, start_datetime: { [Op.between]: [now, endOfWeek] } }
    });

    const totalEvents = await Event.count({ where: { workspace_id: workspaceId } });

    const totalTasks = await Task.count({ where: { workspace_id: workspaceId } });
    const doneTasks = await Task.count({ where: { workspace_id: workspaceId, status: 'done' } });
    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const timeSpentSum = await Task.sum('time_spent', { where: { workspace_id: workspaceId } });
    const totalTimeSpent = timeSpentSum || 0;

    res.json({
      success: true,
      data: { todayEvents, weekEvents, totalEvents, totalTasks, doneTasks, completionRate, totalTimeSpent }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'İstatistikler getirilemedi' });
  }
};

// GET /api/stats/upcoming
exports.getUpcoming = async (req, res) => {
  try {
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const workspaceId = req.workspace_id;

    const events = await Event.findAll({
      where: { workspace_id: workspaceId, start_datetime: { [Op.between]: [now, next7Days] } },
      include: [{ model: Category, attributes: ['id', 'name', 'color_hex'] }],
      order: [['start_datetime', 'ASC']],
      limit: 5
    });

    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Yaklaşan etkinlikler getirilemedi' });
  }
};

// GET /api/stats/tasks-by-status
exports.getTasksByStatus = async (req, res) => {
  try {
    const workspaceId = req.workspace_id;

    const [todo, inProgress, done] = await Promise.all([
      Task.count({ where: { workspace_id: workspaceId, status: 'todo' } }),
      Task.count({ where: { workspace_id: workspaceId, status: 'in-progress' } }),
      Task.count({ where: { workspace_id: workspaceId, status: 'done' } })
    ]);

    res.json({
      success: true,
      data: { todo, inProgress, done, total: todo + inProgress + done }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Görev durumları getirilemedi' });
  }
};
