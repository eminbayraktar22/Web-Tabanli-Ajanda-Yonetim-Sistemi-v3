const nodemailer = require('nodemailer');
require('dotenv').config();

const sendResetEmail = async (to, token, origin) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: process.env.MAIL_PORT || 2525,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const resetLink = `${origin}/reset-password?token=${token}`;

  const mailOptions = {
    from: '"Ajanda Sistemi" <no-reply@ajandasistemi.com>',
    to: to,
    subject: 'Şifre Sıfırlama Talebi',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">Şifre Sıfırlama İsteği</h2>
        <p>Merhaba,</p>
        <p>Hesabınızın şifresini sıfırlama talebiniz alınmıştır. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Şifremi Sıfırla</a>
        </p>
        <p style="color: #666; font-size: 14px;"><strong>Not:</strong> Bu linkin kullanım süresi güvenlik nedeniyle 1 saat ile sınırlandırılmıştır.</p>
        <p style="color: #999; font-size: 12px; margin-top: 40px;">Eğer bu isteği siz göndermediyseniz, lütfen bu mesajı dikkate almayın.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendResetEmail;
