const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const auth = require('../middleware/auth');

// Tüm rotalar auth gerektirir
router.use(auth);

router.get('/', workspaceController.getWorkspaces);
router.post('/', workspaceController.createWorkspace);
router.post('/:id/invite', workspaceController.inviteMember);

module.exports = router;
