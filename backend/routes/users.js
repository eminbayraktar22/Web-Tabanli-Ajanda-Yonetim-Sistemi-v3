const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/userController');

router.use(authMiddleware);

router.get('/me', userController.getMe);
router.put('/me', userController.updateMe);
router.put('/change-password', userController.changePassword);

module.exports = router;
