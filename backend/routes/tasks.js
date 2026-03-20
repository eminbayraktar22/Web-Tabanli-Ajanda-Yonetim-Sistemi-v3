const express = require('express');
const router = express.router = express.Router();
const authMiddleware = require('../middleware/auth');
const taskController = require('../controllers/taskController');
const upload = require('../middleware/upload');

// @route   POST /api/tasks/upload
// @desc    Göreve dosya yükler ve URL döner
router.post('/upload', authMiddleware, upload.single('file'), taskController.uploadAttachment);

// Tüm rotalar korumalı
router.use(authMiddleware);

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.post('/reorder', taskController.reorderTasks);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
