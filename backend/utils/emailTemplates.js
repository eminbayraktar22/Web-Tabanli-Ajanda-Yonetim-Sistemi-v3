exports.getReminderTemplate = (userName, eventTitle, eventDate, eventDescription) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <h2 style="color: #4f46e5; margin-top: 0;">Yaklaşan Etkinlik Hatırlatması</h2>
      <p style="font-size: 16px; color: #334155;">Merhaba <b>${userName}</b>,</p>
      <p style="font-size: 15px; color: #475569;"><strong>"${eventTitle}"</strong> adlı planlı etkinliğinizin başlamasına 30 dakikadan az bir zaman kaldı!</p>
      
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 10px 0;"><strong>Başlangıç Zamanı:</strong> <br> ${eventDate}</p>
        <p style="margin: 0;"><strong>Açıklama/Notlar:</strong> <br> ${eventDescription || 'Belirtilmemiş'}</p>
      </div>
      
      <p style="font-size: 15px; color: #475569;">Lütfen hazırlıklarınızı tamamlayın. AjandaSys'yi kullandığınız için teşekkürler.</p>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0 15px 0;">
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Bu otomatik bir hatırlatmadır. Lütfen yanıtlamayınız.</p>
    </div>
  `;
};
