const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const statsController = require('../controllers/statsController');

router.use(authMiddleware);

router.get('/summary', statsController.getSummary);
router.get('/upcoming', statsController.getUpcoming);
router.get('/tasks-by-status', statsController.getTasksByStatus);

module.exports = router;
