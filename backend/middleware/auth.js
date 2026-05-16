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
    // localStorage'dan "null" veya "undefined" stringi gelme ihtimaline karşı koruma
    let hasValidWorkspace = false;
    
    if (workspaceId && workspaceId !== 'null' && workspaceId !== 'undefined') {
      const membership = await WorkspaceMember.findOne({ where: { user_id: req.user.id, workspace_id: workspaceId } });
      if (membership) {
        req.workspace_id = workspaceId;
        hasValidWorkspace = true;
      }
    }
    
    if (!hasValidWorkspace) {
      let firstMembership = await WorkspaceMember.findOne({ where: { user_id: req.user.id } });
      
      // Eski kullanıcıların workspace'i yoksa otomatik oluştur (Geriye dönük uyumluluk)
      if (!firstMembership) {
        const { Workspace } = require('../models');
        const defaultWorkspace = await Workspace.create({ name: 'Kişisel Çalışma Alanı' });
        firstMembership = await WorkspaceMember.create({
          workspace_id: defaultWorkspace.id,
          user_id: req.user.id,
          role: 'owner'
        });
      }
      
      if (firstMembership) {
        req.workspace_id = firstMembership.workspace_id;
      }
    }

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token geçersiz veya süresi dolmuş' });
  }
};
