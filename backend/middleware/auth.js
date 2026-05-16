const jwt = require('jsonwebtoken');
const { WorkspaceMember } = require('../models');

module.exports = async function (req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Yetkilendirme reddedildi, token bulunamadı veya geçersiz format' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    let workspaceId = req.header('X-Workspace-Id');
    if (workspaceId) {
      const membership = await WorkspaceMember.findOne({ where: { user_id: req.user.id, workspace_id: workspaceId } });
      if (!membership) return res.status(403).json({ success: false, message: 'Bu çalışma alanına erişim yetkiniz yok.' });
      req.workspace_id = workspaceId;
    } else {
      const firstMembership = await WorkspaceMember.findOne({ where: { user_id: req.user.id } });
      if (firstMembership) {
        req.workspace_id = firstMembership.workspace_id;
      }
    }

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token geçersiz veya süresi dolmuş' });
  }
};
