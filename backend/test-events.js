const http = require('http');

async function runTests() {
  console.log('🔄 Events API Testleri Başlıyor...\n');
  const baseUrl = 'http://localhost:3001/api';
  let jwtToken = '';
  let eventId = '';

  try {
    // 1. Önce giriş yap ve Token al
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test1234' }) 
      // seed.js deki test kullanıcısı
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

    // 2. Etkinlik Oluştur
    console.log('Test: Etkinlik oluşturma (POST /events)');
    const eventBody = {
        title: 'Birim Testi Etkinliği',
        description: 'Bu otomatik bir testtir.',
        start_datetime: new Date().toISOString(),
        end_datetime: new Date(Date.now() + 3600000).toISOString(), // 1 saat sonra
        all_day: false
    };
    
    let res = await fetch(`${baseUrl}/events`, { method: 'POST', headers, body: JSON.stringify(eventBody) });
    let data = await res.json();
    console.log('Sonuç:', res.status, data.success ? '✅ BAŞARILI' : '❌ BAŞARISIZ', '\n');
    eventId = data.data.id;

    // 3. Etkinlikleri Listele
    console.log('Test: Etkinlikleri listele (GET /events)');
    res = await fetch(`${baseUrl}/events`, { headers });
    data = await res.json();
    console.log('Sonuç:', res.status, data.success && data.data.length > 0 ? '✅ BAŞARILI' : '❌ BAŞARISIZ', '\n');

    // 4. Tekili Getir
    console.log(`Test: Tekili getir (GET /events/${eventId})`);
    res = await fetch(`${baseUrl}/events/${eventId}`, { headers });
    data = await res.json();
    console.log('Sonuç:', res.status, data.success ? '✅ BAŞARILI' : '❌ BAŞARISIZ', '\n');

    // 5. Güncelle
    console.log(`Test: Etkinlik güncelle (PUT /events/${eventId})`);
    res = await fetch(`${baseUrl}/events/${eventId}`, { 
        method: 'PUT',
        headers,
        body: JSON.stringify({ title: 'Birim Testi (GÜNCELLENDİ)' })
    });
    data = await res.json();
    console.log('Sonuç:', res.status, data.data.title.includes('GÜNCELLENDİ') ? '✅ BAŞARILI' : '❌ BAŞARISIZ', '\n');

    // 6. Sil
    console.log(`Test: Etkinlik sil (DELETE /events/${eventId})`);
    res = await fetch(`${baseUrl}/events/${eventId}`, { method: 'DELETE', headers });
    console.log('Sonuç:', res.status, res.status === 204 ? '✅ BAŞARILI' : '❌ BAŞARISIZ', '\n');


    console.log('🎉 Tüm Events API testleri tamamlandı!');
    process.exit(0);
  } catch(err) {
    console.error('❌ Test Hatası:', err);
    process.exit(1);
  }
}

// Sunucuya bağlanmak için kısa süre bekle
setTimeout(runTests, 2000);
