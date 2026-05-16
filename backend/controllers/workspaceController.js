const { Workspace, WorkspaceMember, User } = require('../models');

// 1. Kullanıcının Çalışma Alanlarını Getir
exports.getWorkspaces = async (req, res) => {
  try {
    const memberships = await WorkspaceMember.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Workspace, as: 'workspace' }
      ]
    });

    const workspaces = memberships.map(m => ({
      id: m.workspace.id,
      name: m.workspace.name,
      role: m.role
    }));

    res.json({ success: true, data: workspaces });
  } catch (error) {
    console.error('Get Workspaces Error:', error);
    res.status(500).json({ success: false, message: 'Çalışma alanları getirilemedi' });
  }
};

// 2. Yeni Çalışma Alanı Oluştur
exports.createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Çalışma alanı adı gereklidir' });

    const newWorkspace = await Workspace.create({ name });
    await WorkspaceMember.create({
      workspace_id: newWorkspace.id,
      user_id: req.user.id,
      role: 'admin'
    });

    res.status(201).json({ success: true, data: { id: newWorkspace.id, name: newWorkspace.name, role: 'admin' } });
  } catch (error) {
    console.error('Create Workspace Error:', error);
    res.status(500).json({ success: false, message: 'Çalışma alanı oluşturulamadı' });
  }
};

// 3. Çalışma Alanına Üye Ekle
exports.inviteMember = async (req, res) => {
  try {
    const { email } = req.body;
    const workspaceId = req.params.id;

    // Sadece admin yetkisi olanlar davet edebilir
    const inviterMembership = await WorkspaceMember.findOne({
      where: { workspace_id: workspaceId, user_id: req.user.id, role: 'admin' }
    });

    if (!inviterMembership) {
      return res.status(403).json({ success: false, message: 'Üye davet etmek için Admin yetkiniz olmalıdır' });
    }

    const invitedUser = await User.findOne({ where: { email } });
    if (!invitedUser) {
      return res.status(404).json({ success: false, message: 'Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı' });
    }

    const existingMembership = await WorkspaceMember.findOne({
      where: { workspace_id: workspaceId, user_id: invitedUser.id }
    });

    if (existingMembership) {
      return res.status(400).json({ success: false, message: 'Bu kullanıcı zaten bu çalışma alanının üyesi' });
    }

    await WorkspaceMember.create({
      workspace_id: workspaceId,
      user_id: invitedUser.id,
      role: 'member'
    });

    res.json({ success: true, message: 'Kullanıcı çalışma alanına başarıyla davet edildi' });
  } catch (error) {
    console.error('Invite Member Error:', error);
    res.status(500).json({ success: false, message: 'Üye davet edilemedi' });
  }
};
