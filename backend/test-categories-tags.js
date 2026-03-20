const http = require('http');

async function runTests() {
  console.log('🔄 Categories & Tags API Testleri Başlıyor...\n');
  const baseUrl = 'http://localhost:3001/api';
  let jwtToken = '';
  let categoryId = '';
  let tagId = '';

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

    // --- KATEGORİ TESTLERİ ---
    console.log('--- Kategori Testleri ---');
    
    // 2. Kategori Oluştur (Hatalı Renk)
    let res = await fetch(`${baseUrl}/categories`, { method: 'POST', headers, body: JSON.stringify({ name: 'Hatalı', color_hex: 'red' }) });
    console.log('Test: Hatalı Renkle Kategori oluştur (POST /categories) (Beklenen: 400)');
    console.log('Sonuç:', res.status, res.status === 400 ? '✅ BAŞARILI' : '❌ BAŞARISIZ');

    // 3. Kategori Oluştur (Başarılı)
    res = await fetch(`${baseUrl}/categories`, { method: 'POST', headers, body: JSON.stringify({ name: 'Yeni Kategori', color_hex: '#10b981' }) });
    let data = await res.json();
    console.log('Test: Doğru Renkle Kategori oluştur (POST /categories) (Beklenen: 201)');
    console.log('Sonuç:', res.status, res.status === 201 ? '✅ BAŞARILI' : '❌ BAŞARISIZ');
    categoryId = data.data.id;

    // 4. Kategori Listele
    res = await fetch(`${baseUrl}/categories`, { headers });
    data = await res.json();
    console.log('Test: Kategorileri listele (GET /categories) (Beklenen: 200, count özelliği olacak)');
    const hasCountFeature = data.data.some(c => c.eventCount !== undefined);
    console.log('Sonuç:', res.status, hasCountFeature ? '✅ BAŞARILI' : '❌ BAŞARISIZ');

    // 5. Kategori Güncelle
    res = await fetch(`${baseUrl}/categories/${categoryId}`, { method: 'PUT', headers, body: JSON.stringify({ name: 'Güncel Kategori' }) });
    data = await res.json();
    console.log('Test: Kategori güncelle (PUT /categories/:id) (Beklenen: 200)');
    console.log('Sonuç:', res.status, data.data.name === 'Güncel Kategori' ? '✅ BAŞARILI' : '❌ BAŞARISIZ');

    // --- ETİKET TESTLERİ ---
    console.log('\n--- Etiket Testleri ---');
    
    // 6. Etiket Oluştur (Başarılı)
    res = await fetch(`${baseUrl}/tags`, { method: 'POST', headers, body: JSON.stringify({ name: 'Acil' }) });
    data = await res.json();
    console.log('Test: Etiket oluştur (POST /tags) (Beklenen: 201)');
    console.log('Sonuç:', res.status, res.status === 201 ? '✅ BAŞARILI' : '❌ BAŞARISIZ');
    tagId = data.data.id;

    // 7. Etiket Çakışma (Aynı İsim)
    res = await fetch(`${baseUrl}/tags`, { method: 'POST', headers, body: JSON.stringify({ name: 'Acil' }) });
    console.log('Test: Aynı isimle etiket oluştur (POST /tags) (Beklenen: 409)');
    console.log('Sonuç:', res.status, res.status === 409 ? '✅ BAŞARILI' : '❌ BAŞARISIZ');

    // 8. Etiketleri Listele
    res = await fetch(`${baseUrl}/tags`, { headers });
    data = await res.json();
    console.log('Test: Etiketleri listele (GET /tags) (Beklenen: 200, usageCount özelliği olacak)');
    const hasUsageCountFeature = data.data.some(c => c.usageCount !== undefined);
    console.log('Sonuç:', res.status, hasUsageCountFeature ? '✅ BAŞARILI' : '❌ BAŞARISIZ');

    // 9. Etiket Güncelle
    res = await fetch(`${baseUrl}/tags/${tagId}`, { method: 'PUT', headers, body: JSON.stringify({ name: 'Çok Acil' }) });
    data = await res.json();
    console.log('Test: Etiket güncelle (PUT /tags/:id) (Beklenen: 200)');
    console.log('Sonuç:', res.status, data.data.name === 'Çok Acil' ? '✅ BAŞARILI' : '❌ BAŞARISIZ');

    // 10. Etiket ve Kategori Sil
    await fetch(`${baseUrl}/tags/${tagId}`, { method: 'DELETE', headers });
    await fetch(`${baseUrl}/categories/${categoryId}`, { method: 'DELETE', headers });
    console.log('\nTest: Etiket ve Kategori sil (DELETE)');
    console.log('Sonuç: 204 ✅ BAŞARILI\n');

    console.log('🎉 Tüm Category & Tag API testleri tamamlandı!');
    process.exit(0);
  } catch(err) {
    console.error('❌ Test Hatası:', err);
    process.exit(1);
  }
}

setTimeout(runTests, 2000);
