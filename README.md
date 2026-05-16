# Web Tabanlı Ajanda & İş Yönetim Sistemi (SaaS v3)

Modern, çok amaçlı ve profesyonel bir **Kişisel ve Kurumsal Organizasyon Yönetimi Platformu**.
Gelişmiş Takvim (FullCalendar), Dinamik Kanban Panosu (Görevler), Notlar, Çalışma Alanları (Workspaces) ve Yapay Zeka (AI) özellikleri birbirine tamamen entegre çalışır.

##  Yeni Öne Çıkan Özellikler (v3.0)

*   **Çalışma Alanları (Workspaces) & Ekip Takvimi:** Birden fazla çalışma alanı oluşturun. Ekip üyelerini davet ederek ortak takvim üzerinden herkesin meşguliyetini şeffaf bir şekilde görüntüleyin.
*   **Yapay Zeka Destekli Yönetim:** "Toplantıyı yarına ertele" gibi düz metin komutlarıyla veya sesli notlarla (Sys Pilot) otomatik görev oluşturun. AI ile görevleri alt görevlere (checklist) otomatik bölebilme desteği.
*   **Time Blocking (Zaman Bloklama):** Kanban panosundaki planlanmamış görevlerinizi, doğrudan takvim üzerine sürükleyerek (Drag & Drop) saniyeler içinde programlayın.
*   **Pomodoro ve Otomatik Zaman Kaydı (Time Logging):** Görevler üzerindeki zamanlayıcıyı (timer) başlattığınızda sistem süreyi tutar. Çalışmayı durdurduğunuzda, harcanan süre otomatik olarak geçmişe dönük bir "Takvim Etkinliği (Çalışma Günlüğü)" olarak kaydedilir.
*   **Zengin Metin (Rich Text) Desteği:** Notlarınız ve görev açıklamalarınız için `react-quill` tabanlı, formatlanabilir, şık zengin metin editörü.
*   **Komut Paleti (Cmd+K):** Sistem genelinde arama yapmak, hızlıca not veya görev eklemek ve temayı (Gece/Gündüz) değiştirmek için evrensel komut satırı.
*   **Tam Mobil Uyumluluk (Mobile First):** Kanban panoları mobil cihazlarda dikey akış (vertical stack) düzenine geçer. Takvim dar ekranda "Günlük" görünüme geçer. Her detay telefonda kusursuz çalışacak şekilde (Responsive) optimize edilmiştir.
*   **Modern Tarih Seçici:** Yerleşik çirkin tarayıcı popupları yerine `Flatpickr` kullanılarak tasarlanmış, sisteme ve renklere tamamen entegre çapraz platform tarih seçici.

##  Temel Özellikler (Features)

*   **Çift Modüllü Senkronizasyon:** Etkinlikler (Takvim) ve Görevler (Kanban) aynı veritabanında entegre çalışır.
*   **Modern UI/UX:** React ve TailwindCSS kullanılarak hazırlanan büyüleyici (Glassmorphism, animasyonlu), hızlı ve karanlık mod (Dark Mode) destekli arayüz.
*   **Gelişmiş Takvim (Calendar):** Sürükle-bırak desteği, tekrar eden etkinlikler (RRule), dışa aktarma (.ICS), farklı görünümler (Aylık/Haftalık/Günlük).
*   **Kanban Pano Görev Yöneticisi:** Bekleyen, Yapılıyor, Biten kolonları arasında pürüzsüz taşıma. Öncelik etiketleri (Kritik, Yüksek), ilerleme çubuğu (Progress bar) ve son teslim tarihi (Due date) takibi.
*   **Evrensel Kategoriler (Universal Tagging):** İkon destekli renkli istatistik kartları. Takvim, görevler ve notları tek merkezden filtreleyebilme esnekliği.
*   **Ek Dosya Desteği (Attachments):** Etkinliklere ve Görevlere yerel belge, resim veya dosya yükleyebilme.
*   **Saha Testinden Geçmiş Güvenlik:** Helmet, Rate Limit, CORS ve Input Validasyonları ile endüstri standardında kurumsal güvenlik.

##  Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | React.js (Vite), TailwindCSS, FullCalendar, Flatpickr, Hello Pangea DnD, Lucide Icons |
| **Backend** | Node.js, Express.js, Multer (Dosya), Node-Cron, Socket.io (Canlı Bildirimler) |
| **Yapay Zeka**| Google Gemini / OpenAI / Anthropic Entegrasyonu |
| **Veritabanı** | MySQL 8, Sequelize ORM |
| **Şifreleme & Auth**| JWT (JSON Web Token), Bcryptjs |
| **Deployment** | Docker, Nginx (Alpine), Docker Compose |

##  Kurulum ve Çalıştırma (Hızlı Başlangıç)

Proje tamamen sanallaştırılmış (containerized) yapıya sahiptir. Bağımlılık kurmadan çalıştırmak isterseniz önerilen yol Docker Compose'dir.

### Yöntem 1: Docker (Önerilen)

1. Projeyi bilgisayarınıza klonlayın.
2. Ortam dosyalarını kendinize göre oluşturun:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
*(Yapay Zeka özelliklerini kullanabilmek için backend klasöründeki `.env` dosyasında `GEMINI_API_KEY` veya ilgili anahtarları belirtmelisiniz).*

3. Docker-Compose ile konteynerları ayağa kaldırın:
```bash
docker-compose up -d --build
```

- **Frontend SPA:** `http://localhost` (Port 80)
- **Backend API:** `http://localhost:3001`
- **Veritabanı:** MySQL 3306

### Yöntem 2: Manuel Geliştirme Ortamı

**Backend İçin:**
```bash
cd backend
npm install
npm run start
```
**Frontend İçin:**
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

## 🔒 Güvenlik Notları

Sistem `xss-clean`, `helmet`, `cors` ve `express-rate-limit` ile korunmaktadır. API rotalarına izinsiz erişim JWT filtre katmanıyla engellenir. Kullanıcı şifreleri Bcrypt ile hash'lenir. Çalışma alanı (Workspace) izinleri ve IDOR açıklarına karşı sıkı aidiyet kontrolleri uygulanır.
