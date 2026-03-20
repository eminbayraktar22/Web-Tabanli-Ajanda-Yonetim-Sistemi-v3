const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   POST /api/events/upload
// @desc    Etkinliğe dosya/ek yükler ve URL döner
router.post('/upload', authMiddleware, upload.single('file'), eventController.uploadAttachment);

// Tüm Event rotaları oturum (auth) gerektirir
router.use(authMiddleware);

// Validasyon kural setleri
const eventValidationRules = [
  check('title', 'Etkinlik başlığı zorunludur').not().isEmpty(),
  check('start_datetime', 'Geçerli bir başlangıç tarihi/saati zorunludur').isISO8601().toDate(),
  check('end_datetime', 'Geçerli bir bitiş tarihi/saati zorunludur').isISO8601().toDate(),
  // Özel doğrulayıcı: start_datetime < end_datetime
  check('end_datetime').custom((value, { req }) => {
    if (new Date(value) <= new Date(req.body.start_datetime)) {
      throw new Error('Bitiş tarihi, başlangıç tarihinden sonra olmalıdır');
    }
    return true;
  }),
];

// @route   POST /api/events
// @desc    Yeni bir etkinlik oluştur
router.post('/', eventValidationRules, eventController.createEvent);

// @route   GET /api/events
// @desc    Tüm etkinlikleri listele (start, end, category_id query parametreleri ile filtre edilebilir)
router.get('/', eventController.getEvents);

// @route   GET /api/events/export
// @desc    Tüm etkinlikleri .ics formatında döndürür
router.get('/export', eventController.exportEvents);

// @route   GET /api/events/:id
// @desc    Belirli bir etkinliğin detaylarını getir
router.get('/:id', eventController.getEventById);

// @route   PUT /api/events/:id
// @desc    Bir etkinliği güncelle (Kısmi güncelleme destekler)
// Update validasyonu create ile aynı olabilir ancak alanlar sadece gönderildiklerinde kontrol edilebilir (Opsiyonel)
// Şimdilik strict update validation kuralını gevşek bırakabiliriz ya da partial uygulayabiliriz.
// Kısmi güncelleme için custom kurallar:
router.put('/:id', [
    check('title', 'Etkinlik başlığı boş bırakılamaz').optional().not().isEmpty(),
    check('start_datetime', 'Geçerli bir başlangıç tarihi/saati olmalıdır').optional().isISO8601().toDate(),
    check('end_datetime', 'Geçerli bir bitiş tarihi/saati olmalıdır').optional().isISO8601().toDate(),
], eventController.updateEvent);

// @route   DELETE /api/events/:id
// @desc    Bir etkinliği sil
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
