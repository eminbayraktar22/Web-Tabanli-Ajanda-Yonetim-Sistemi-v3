const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'public/uploads/';
    // Klasör yoksa oluştur (her ihtimale karşı)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Güvenlik: Kullanıcı id'sini prefix olarak ekliyoruz
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Güvenlik Duvarı: Sadece belirli (güvenli) dosya tiplerine izin ver
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const mimetype = allowedMimeTypes.test(file.mimetype);
  const extname = allowedMimeTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true); // Güvenli
  }
  // Güvensiz dosya uzantısı (örn: .html, .exe, .sh, .php)
  cb(new Error('Sadece Güvenilir Resim (JPG, PNG, GIF) ve Belge (PDF, DOC) dosyalarına izin verilir!'), false);
};

// Maksumum 15MB limitli ortak bir yükleyici
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: fileFilter
});

module.exports = upload;
