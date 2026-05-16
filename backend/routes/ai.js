const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

// Tüm AI rotaları kimlik doğrulama gerektirir
router.use(authMiddleware);

router.post('/breakdown-task', aiController.breakdownTask);
router.post('/summarize-notes', aiController.summarizeNotes);
router.post('/chat-with-copilot', aiController.chatWithCopilot);
router.post('/parse-task', aiController.parseTask);

module.exports = router;
