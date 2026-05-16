const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const reminderController = require('../controllers/reminderController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Validasyon kuralları
const reminderValidationRules = [
  check('event_id', 'Etkinlik kimliği (event_id) zorunludur').not().isEmpty(),
  check('remind_at', 'Geçerli bir hatırlatma tarihi/saati (ISO 8601) zorunludur').isISO8601().toDate(),
];

// @route   GET /api/reminders
// @desc    Geçerli/bekleyen hatırlatıcıları listele
router.get('/', reminderController.getReminders);

// @route   POST /api/reminders
// @desc    Gelecekteki bir tarih için etkinliğe hatırlatıcı ekle
router.post('/', reminderValidationRules, reminderController.createReminder);

// @route   DELETE /api/reminders/:id
// @desc    Bekleyen bir hatırlatıcıyı iptal et / sil
router.delete('/:id', reminderController.deleteReminder);

module.exports = router;
