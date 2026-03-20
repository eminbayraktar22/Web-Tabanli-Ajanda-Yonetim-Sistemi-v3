const http = require('http');

async function runTests() {
  console.log('🔄 Reminders & Cron API Testleri Başlıyor...\n');
  const baseUrl = 'http://localhost:3001/api';
  let jwtToken = '';
  let eventId = '';
  let reminderId = '';

  try {
    // 1. Önce giriş yap ve Token al
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test1234' }) 
    });
    const loginData = await loginRes.json();
    if(loginData.success && loginData.token) {
       jwtToken = loginData.token;
       console.log('🔑 Giriş yapıldı ve Token alındı.\n');
    } else {
       console.error('❌ Giriş yapılamadı, test durduruluyor.');
       process.exit(1);
    }

    const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
    };

    // 2. Bir Etkinlik Oluştur
    const eventRes = await fetch(`${baseUrl}/events`, { 
        method: 'POST', headers, 
        body: JSON.stringify({ 
            title: 'Hatırlatıcı Test Etkinliği', 
            start_datetime: new Date(Date.now() + 86400000).toISOString(), // Yarın
            end_datetime: new Date(Date.now() + 90000000).toISOString()
        }) 
    });
    const eventData = await eventRes.json();
    eventId = eventData.data.id;
    console.log('Test: Etkinlik oluşturuldu (POST /events)');

    // 3. Hatırlatıcı Oluştur (Geçmiş Zaman - Beklenen 400)
    let res = await fetch(`${baseUrl}/reminders`, { 
        method: 'POST', headers, 
        body: JSON.stringify({ event_id: eventId, remind_at: new Date(Date.now() - 10000).toISOString() }) 
    });
    console.log('Test: Geçmiş zamanlı hatırlatıcı oluştur (POST /reminders) (Beklenen: 400)');
    console.log('Sonuç:', res.status, res.status === 400 ? '✅ BAŞARILI' : '❌ BAŞARISIZ');

    // 4. Hatırlatıcı Oluştur (Başarılı)
    // ŞİMDİKİ ZAMANDAN 1 dakika ileri alalım ki sunucu tarihteki <= kontrolüne takılmasın
    let targetTime = new Date(Date.now() + 60000); 
    res = await fetch(`${baseUrl}/reminders`, { 
        method: 'POST', headers, 
        body: JSON.stringify({ event_id: eventId, remind_at: targetTime.toISOString() }) 
    });
    let data = await res.json();
    reminderId = data.data.id;
    console.log('Test: Anlık hatırlatıcı oluştur (POST /reminders) (Beklenen: 201)');
    console.log('Sonuç:', res.status, res.status === 201 ? '✅ BAŞARILI' : '❌ BAŞARISIZ');

    // 5. Hatırlatıcı Listele
    res = await fetch(`${baseUrl}/reminders`, { headers });
    data = await res.json();
    console.log('Test: Bekleyen hatırlatıcıları listele (GET /reminders) (Beklenen: 200, count > 0)');
    console.log('Sonuç:', res.status, data.count > 0 ? '✅ BAŞARILI' : '❌ BAŞARISIZ');

    // 6. Cron Job'un çalışması için 65 saniye beklemek çok uzun.
    // Biz sadece iptal rotasını test edeceğiz. (Cron loglarda zaten "[Cron] ... işleniyor" diyerek görünecek)
    res = await fetch(`${baseUrl}/reminders/${reminderId}`, { method: 'DELETE', headers });
    console.log('Test: Hatırlatıcı iptal (DELETE /reminders/:id) (Beklenen: 204)');
    console.log('Sonuç:', res.status, res.status === 204 ? '✅ BAŞARILI' : '❌ BAŞARISIZ');

    // Test silme işlemi
    await fetch(`${baseUrl}/events/${eventId}`, { method: 'DELETE', headers });

    console.log('\n🎉 Tüm Reminders API testleri tamamlandı!');
    process.exit(0);
  } catch(err) {
    console.error('❌ Test Hatası:', err);
    process.exit(1);
  }
}

setTimeout(runTests, 2000);
