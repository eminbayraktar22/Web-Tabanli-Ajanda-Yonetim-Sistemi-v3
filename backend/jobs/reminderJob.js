const cron = require('node-cron');
const { Op } = require('sequelize');
const Event = require('../models/Event');
const User = require('../models/User');
const Task = require('../models/Task');
const sendEmail = require('../utils/sendEmail');
const { getReminderTemplate } = require('../utils/emailTemplates');

const startCronJobs = () => {

  // ─── Her dakikada bir: Yaklaşan etkinlik hatırlatması ─────────────────
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const in30Mins = new Date(now.getTime() + 30 * 60000);

      const upcomingEvents = await Event.findAll({
        where: {
          start_datetime: { [Op.between]: [now, in30Mins] },
          is_notified: false
        },
        include: [{ model: User }]
      });

      for (const event of upcomingEvents) {
        if (event.User && event.User.email) {
          const mailHtml = getReminderTemplate(
            event.User.name,
            event.title,
            new Date(event.start_datetime).toLocaleString('tr-TR'),
            event.description
          );

          await sendEmail({
            email: event.User.email,
            subject: `🕒 Hatırlatma: ${event.title} birazdan başlıyor!`,
            html: mailHtml
          });

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

          event.is_notified = true;
          await event.save();
          console.log(`[CRON] ${event.title} için hatırlatma mailleri gönderildi.`);
        }
      }
    } catch (error) {
      console.error('[CRON Error] Hatırlatma mailleri gönderilirken hata oluştu:', error);
    }
  });

  // ─── Her Pazartesi 08:00 — Haftalık özet e-postası ────────────────────
  cron.schedule('0 8 * * 1', async () => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const users = await User.findAll();
      console.log(`[CRON] Haftalık özet gönderiliyor — ${users.length} kullanıcı`);

      for (const user of users) {
        try {
          const [weekEvents, pendingTasks, doneTasks] = await Promise.all([
            Event.count({
              where: {
                user_id: user.id,
                start_datetime: { [Op.between]: [startOfWeek, endOfWeek] }
              }
            }),
            Task.count({ where: { user_id: user.id, status: 'todo' } }),
            Task.count({ where: { user_id: user.id, status: 'done' } })
          ]);

          const weekLabel = `${startOfWeek.toLocaleDateString('tr-TR')} – ${endOfWeek.toLocaleDateString('tr-TR')}`;
          const total = pendingTasks + doneTasks;
          const completionRate = total > 0 ? Math.round((doneTasks / total) * 100) : 0;
          const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

          const html = `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;background:#f8fafc">
  <div style="max-width:580px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:40px 32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700">📋 Haftalık Ajanda Özeti</h1>
      <p style="color:#c7d2fe;margin:8px 0 0;font-size:14px">${weekLabel}</p>
    </div>
    <div style="padding:32px">
      <p style="color:#475569;font-size:15px;margin:0 0 24px">Merhaba <strong style="color:#1e293b">${user.name}</strong>,<br>Bu haftaki ajanda özetiniz aşağıda.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr>
          <td style="padding:8px">
            <div style="background:#f1f5f9;border-radius:12px;padding:20px;text-align:center">
              <div style="font-size:28px">📅</div>
              <p style="margin:8px 0 0;font-size:13px;color:#64748b">Bu Hafta Etkinlik</p>
              <p style="margin:4px 0 0;font-size:32px;font-weight:700;color:#4f46e5">${weekEvents}</p>
            </div>
          </td>
          <td style="padding:8px">
            <div style="background:#f1f5f9;border-radius:12px;padding:20px;text-align:center">
              <div style="font-size:28px">⏳</div>
              <p style="margin:8px 0 0;font-size:13px;color:#64748b">Bekleyen Görev</p>
              <p style="margin:4px 0 0;font-size:32px;font-weight:700;color:#f59e0b">${pendingTasks}</p>
            </div>
          </td>
          <td style="padding:8px">
            <div style="background:#f1f5f9;border-radius:12px;padding:20px;text-align:center">
              <div style="font-size:28px">✅</div>
              <p style="margin:8px 0 0;font-size:13px;color:#64748b">Tamamlama Oranı</p>
              <p style="margin:4px 0 0;font-size:32px;font-weight:700;color:#10b981">${completionRate}%</p>
            </div>
          </td>
        </tr>
      </table>
      <div style="margin-top:32px;text-align:center">
        <a href="${appUrl}" style="display:inline-block;background:#4f46e5;color:#fff;font-weight:600;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none">Ajandama Git →</a>
      </div>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">AjandaSys tarafından gönderildi.</p>
    </div>
  </div>
</body>
</html>`;

          await sendEmail({
            email: user.email,
            subject: `📋 Haftalık Ajanda Özeti — ${weekLabel}`,
            html
          });
          console.log(`[CRON] Haftalık özet gönderildi: ${user.email}`);
        } catch (userErr) {
          console.error(`[CRON] ${user.email} için özet gönderilemedi:`, userErr.message);
        }
      }
    } catch (error) {
      console.error('[CRON Error] Haftalık özet:', error);
    }
  });
};

module.exports = startCronJobs;
