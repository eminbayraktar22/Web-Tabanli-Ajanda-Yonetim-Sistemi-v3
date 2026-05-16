const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.use(authMiddleware);

router.get('/', notificationController.getNotifications);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
