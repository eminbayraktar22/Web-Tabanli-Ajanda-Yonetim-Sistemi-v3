const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const path = require('path');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const rateLimit = require('express-rate-limit');

// Brute Force & Credential Stuffing Koruması
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 30, // Max 30 hatalı/doğru deneme
  message: { success: false, message: 'Çok fazla giriş denemesi! Güvenlik nedeniyle hesabınız geçici olarak kilitlendi. Lütfen 15 dakika sonra tekrar deneyin.' }
});


// @route   POST /api/auth/register
// @desc    Yeni kullanıcı kaydı oluşturur
// @access  Public
router.post(
  '/register',
  authLimiter,
  [
    check('name', 'Ad Soyad zorunludur').not().isEmpty(),
    check('email', 'Geçerli bir e-posta adresi giriniz').isEmail(),
    check('password', 'Şifre en az 6 karakter olmalıdır').isLength({ min: 6 }),
  ],
  authController.register
);

// @route   POST /api/auth/login
// @desc    Kullanıcı girişi yapar ve JWT döner
// @access  Public
router.post(
  '/login',
  authLimiter,
  [
    check('email', 'Geçerli bir e-posta adresi giriniz').isEmail(),
    check('password', 'Şifre zorunludur').exists(),
  ],
  authController.login
);

// @route   GET /api/auth/me
// @desc    Giriş yapan kullanıcının bilgilerini getirir
// @access  Private
router.get('/me', authMiddleware, authController.getMe);

// @route   PUT /api/auth/profile
// @desc    Kullanıcının ismini, e-postasını veya şifresini günceller
router.put('/profile', authMiddleware, authController.updateProfile);

// @route   POST /api/auth/profile/avatar
// @desc    Kullanıcının profil fotoğrafını yükler
router.post('/profile/avatar', authMiddleware, upload.single('avatar'), authController.uploadAvatar);

module.exports = router;
