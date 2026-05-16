const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Multer (Dosya Yükleme) Konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    cb(null, `attachment-${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(auth);

router.get('/tasks/:taskId/comments', commentController.getComments);
router.post('/tasks/:taskId/comments', commentController.addComment);
router.delete('/comments/:commentId', commentController.deleteComment);

// Yorumlara dosya eklemek için yardımcı endpoint
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Dosya seçilmedi' });
  res.json({ success: true, url: `/uploads/${req.file.filename}`, name: req.file.originalname });
});

module.exports = router;
