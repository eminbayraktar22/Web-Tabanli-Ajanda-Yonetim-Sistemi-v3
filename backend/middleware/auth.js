const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // 1. Token'ı header'dan al
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Yetkilendirme reddedildi, token bulunamadı veya geçersiz format' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Kullanıcı bilgilerini (payload) request objesine ekle
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token geçersiz veya süresi dolmuş' });
  }
};
