const http = require('http');

async function runTests() {
  console.log('🔄 Auth API Testleri Başlıyor...\n');
  const baseUrl = 'http://localhost:3001/api/auth';
  let jwtToken = '';

  try {
    // 1. Kayıt Testi (Eksik / Hatalı Veri)
    console.log('Test 1: Eksik veri ile kayıt denemesi (Beklenen: 400 Bad Request)');
    let res = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'invalid-email', password: '123' })
    });
    let data = await res.json();
    console.log('Sonuç:', res.status, data.success === false ? '✅ BAŞARILI' : '❌ BAŞARISIZ', '\n');

    // 2. Kayıt Testi (Başarılı)
    console.log('Test 2: Doğru veri ile kayıt denemesi (Beklenen: 201 Created)');
    const testEmail = `testuser_${Date.now()}@example.com`;
    res = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Kullanıcısı', email: testEmail, password: 'password123' })
    });
    data = await res.json();
    console.log('Sonuç:', res.status, data.success === true ? '✅ BAŞARILI' : '❌ BAŞARISIZ', '\n');

    // 3. Giriş Testi (Yanlış Şifre)
    console.log('Test 3: Yanlış şifre ile giriş denemesi (Beklenen: 401 Unauthorized)');
    res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'wrongpassword' })
    });
    data = await res.json();
    console.log('Sonuç:', res.status, data.success === false ? '✅ BAŞARILI' : '❌ BAŞARISIZ', '\n');

    // 4. Giriş Testi (Başarılı)
    console.log('Test 4: Doğru şifre ile giriş denemesi (Beklenen: 200 OK)');
    res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'password123' })
    });
    data = await res.json();
    if(data.success && data.token) {
       jwtToken = data.token;
       console.log('Sonuç: 200 ✅ BAŞARILI (Token alındı)\n');
    } else {
       console.log('Sonuç:', res.status, '❌ BAŞARISIZ\n');
    }

    // 5. Profil (Me) Testi - Tokensız
    console.log('Test 5: Token olmadan /me erişimi (Beklenen: 401 Unauthorized)');
    res = await fetch(`${baseUrl}/me`);
    data = await res.json();
    console.log('Sonuç:', res.status, data.success === false ? '✅ BAŞARILI' : '❌ BAŞARISIZ', '\n');

    // 6. Profil (Me) Testi - Geçerli Token ile
    console.log('Test 6: Geçerli token ile /me erişimi (Beklenen: 200 OK)');
    res = await fetch(`${baseUrl}/me`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    data = await res.json();
    console.log('Sonuç:', res.status, data.success === true ? '✅ BAŞARILI' : '❌ BAŞARISIZ', '\n');

    console.log('🎉 Tüm testler tamamlandı!');
    process.exit(0);
  } catch(err) {
    console.error('❌ Test Hatası:', err);
    process.exit(1);
  }
}

// 2 saniye bekleyip testleri başlat (Sunucunun tam olarak kalktığından emin olmak için)
setTimeout(runTests, 2000);
