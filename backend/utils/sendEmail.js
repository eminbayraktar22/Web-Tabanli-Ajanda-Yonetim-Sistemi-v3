const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // .env üzerinden Mailtrap (SMTP) bilgilerini bağla
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: process.env.MAIL_PORT || 2525,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  const mailOptions = {
    from: '"AjandaSys Sistem" <noreply@ajandasys.local>',
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  // E-postayı gönder
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
