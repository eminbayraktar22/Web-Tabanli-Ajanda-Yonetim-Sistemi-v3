const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const sendResetEmail = require('../utils/sendResetEmail');

// Kayıt Ol (Register)
exports.register = async (req, res) => {
  // 1. Validasyon Kontrolü
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // 2. Kullanıcı mevcut mu?
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(409).json({ success: false, message: 'Bu e-posta adresi zaten kullanımda' });
    }

    // 3. Şifreyi Hashle
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 4. Kullanıcıyı Kaydet
    user = await User.create({
      name,
      email,
      password_hash
    });

    // 5. JWT Oluştur
    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Kayıt Hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası oluştu' });
  }
};

// Giriş Yap (Login)
exports.login = async (req, res) => {
   // 1. Validasyon Kontrolü
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
     return res.status(400).json({ success: false, errors: errors.array() });
   }
 
   const { email, password } = req.body;

   try {
     // 2. Kullanıcı kontrolü
     const user = await User.findOne({ where: { email } });
     if (!user) {
        // Güvenlik: Kullanıcı bulunamadı veya şifre yanlış (aynı mesaj)
       return res.status(401).json({ success: false, message: 'Geçersiz kimlik bilgileri' });
     }

     // 3. Şifre eşleşme kontrolü
     const isMatch = await bcrypt.compare(password, user.password_hash);
     if (!isMatch) {
       return res.status(401).json({ success: false, message: 'Geçersiz kimlik bilgileri' });
     }

     // 4. JWT Oluştur
     const payload = { id: user.id, email: user.email };
     const token = jwt.sign(
       payload,
       process.env.JWT_SECRET,
       { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
     );

     res.json({
       success: true,
       token,
       user: {
         id: user.id,
         name: user.name,
         email: user.email,
         avatar_url: user.avatar_url,
         createdAt: user.createdAt
       }
     });

   } catch (error) {
     console.error('Giriş Hatası:', error);
     res.status(500).json({ success: false, message: 'Sunucu hatası oluştu' });
   }
};

// Kullanıcı Bilgilerini Getir (Get Me)
exports.getMe = async (req, res) => {
  try {
    // req.user, auth middleware'den geliyor
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] } // Şifre dışındaki bilgileri getir
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Kullanıcı Bilgisi Getirme Hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası oluştu' });
  }
};

// Profil Güncelle (İsim, E-Posta, Şifre)
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password_hash = await bcrypt.hash(password, salt);
    }
    
    await user.save();
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url } });
  } catch (error) {
    console.error('Profil Güncelleme Hatası:', error);
    res.status(500).json({ success: false, message: 'Profil güncellenemedi' });
  }
};

// Avatar Yükle
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Lütfen bir resim dosyası seçin' });
    }
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });

    // Multer dosyayı public/uploads klasörüne attı, biz sadece relative linki kaydediyoruz
    user.avatar_url = '/uploads/' + req.file.filename;
    await user.save();

    res.json({ success: true, avatar_url: user.avatar_url });
  } catch (error) {
    console.error('Avatar Yükleme Hatası:', error);
    res.status(500).json({ success: false, message: 'Fotoğraf yüklenemedi' });
  }
};

// Şifremi Unuttum (Forgot Password)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Bu e-posta adresine ait kullanıcı bulunamadı' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.reset_token = resetTokenHash;
    user.reset_token_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 saat geçerli
    await user.save();

    const frontendUrl = req.headers.origin || 'http://localhost:5173';
    await sendResetEmail(user.email, resetToken, frontendUrl);

    res.json({ success: true, message: 'Şifre sıfırlama talimatları e-posta adresinize gönderildi.' });
  } catch (error) {
    console.error('Şifremi Unuttum Hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası oluştu' });
  }
};

// Şifre Sıfırlama (Reset Password)
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        reset_token: resetTokenHash,
        reset_token_expires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Geçersiz veya sürmesi dolmuş sıfırlama jetonu.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(password, salt);
    
    user.reset_token = null;
    user.reset_token_expires = null;
    await user.save();

    res.json({ success: true, message: 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.' });
  } catch (error) {
    console.error('Şifre Sıfırlama Hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası oluştu' });
  }
};
