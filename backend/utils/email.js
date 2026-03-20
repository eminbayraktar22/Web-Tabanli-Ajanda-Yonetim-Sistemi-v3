const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Transporter oluştur (SMTP ayarları / Mailtrap vs.)
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
    port: process.env.MAIL_PORT || 2525,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS, // Eğer boşsa mail atmaya çalışıp hata fırlatabilir, testte ele alacağız.
    },
    // Geliştirme ortamında self-signed sertifikalara izin vermek gerekebilir:
    // tls: { rejectUnauthorized: false }
  });

  // 2. Email seçeneklerini tanımla
  const mailOptions = {
    from: 'Ajanda Sistemi Bildirimi <noreply@ajandasistemi.local>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Eğer html gönderilecekse
  };

  // 3. Email'i gönder
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
