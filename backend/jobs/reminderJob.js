const cron = require('node-cron');
const { Op } = require('sequelize');
const Event = require('../models/Event');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { getReminderTemplate } = require('../utils/emailTemplates');

const startCronJobs = () => {
  // Her dakikada bir çalışacak Cron döngüsü
  // Gerçek hayatta her dakika çalışarak veritabanını tarar
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      // Şu andan itibaren önümüzdeki 30 dakikalık bant
      const in30Mins = new Date(now.getTime() + 30 * 60000);

      // Başlangıcı önümüzdeki 30 dakika içinde olan VE henüz mail atılmamış etkinlikler
      const upcomingEvents = await Event.findAll({
        where: {
          start_datetime: {
            [Op.between]: [now, in30Mins]
          },
          is_notified: false
        },
        include: [{ model: User }]
      });

      for (const event of upcomingEvents) {
        if (event.User && event.User.email) {
          
          // Şık bir HTML Şablonu (Refactored)
          const mailHtml = getReminderTemplate(
             event.User.name,
             event.title,
             new Date(event.start_datetime).toLocaleString('tr-TR'),
             event.description
          );

          // 1. Asıl Sahibine (Owner) E-posta Gönder
          await sendEmail({
             email: event.User.email,
             subject: `🕒 Hatırlatma: ${event.title} birazdan başlıyor!`,
             html: mailHtml
          });

          // 2. Eğer paylaşılan konuklar (Davetliler) varsa Onlara da E-posta Gönder
          if (event.shared_emails) {
             const guests = event.shared_emails.split(',').map(e => e.trim()).filter(e => e);
             for (const guestEmail of guests) {
                await sendEmail({
                   email: guestEmail,
                   subject: `🕒 Ortak Etkinlik: ${event.title} birazdan başlıyor!`,
                   html: mailHtml
                });
             }
          }

          // 3. Bildirildi (is_notified) bayrağını true yap ki bir sonraki dakikada tekrar atmasın
          event.is_notified = true;
          await event.save();
          console.log(`[CRON] ${event.title} için hatırlatma mailleri gönderildi.`);
        }
      }
    } catch (error) {
       console.error('[CRON Error] Hatırlatma mailleri gönderilirken hata oluştu:', error);
    }
  });
};

module.exports = startCronJobs;
