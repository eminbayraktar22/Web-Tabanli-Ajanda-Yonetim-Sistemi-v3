#  Web Tabanlı Ajanda & İş Yönetim Sistemi (SaaS)

Modern, çok amaçlı ve profesyonel bir Kişisel/Kurumsal Organizasyon Yönetimi Platformu.
Gelişmiş Takvim (FullCalendar) ve Dinamik Kanban (Görev Panosu) modülleri birbirine entegre çalışır.

## Özellikler (Features)

 **Çift Modüllü Senkronizasyon:** Etkinlikler (Takvim) ve Görevler (Kanban) sistemi aynı veritabanında tamamen senkronize çalışır.
 **Modern UI/UX:** React ve TailwindCSS kullanılarak hazırlanan büyüleyici, hızlı ve duyarlı (Responsive) arayüz.
 **Saha Testinden Geçmiş Güvenlik:** Helmet, Rate Limit, CORS ve Input Validasyonları ile endüstri standardında kurumsallık.
 **Gelişmiş Takvim (Calendar):** Sürükle&bırak destekli, tekrar eden etkinlikler (RRule), dışa aktarma (.ICS), e-posta paylaşımı.
 **Kanban Pano Görev Yöneticisi:** Bekleyen, Yapılıyor, Biten kolonları arasında pürüzsüz Drag & Drop. Öncelik etiketleri (Kritik, Yüksek), Alt Görevler (Checklist progress bar) ve Teslim Tarihi takibi.
 **Evrensel Kategoriler (Universal Tagging):** 15+ ikon destekli renkli istatistik kartları. Hem takvimi hem de görev panosunu üstten filtreleyebilme esnekliği.
 **Ek Dosya Desteği (Attachments):** Etkinliklere ve Görevlere yerel belge, resim veya dosya yükleyebilme.

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | React.js (Vite), TailwindCSS, FullCalendar, Hello Pangea DnD, Lucide Icons |
| **Backend** | Node.js, Express.js, Multer (Yükleme), Node-Cron (Zamanlanmış Görevler) |
| **Veritabanı** | MySQL 8, Sequelize ORM |
| **Şifreleme & Auth**| JWT (JSON Web Token), Bcryptjs |
| **Deployment** | Docker, Nginx (Alpine), Docker Compose |

## Kurulum ve Çalıştırma (Hızlı Başlangıç)

Proje tamamen sanallaştırılmış (containerized) yapıya sahiptir. Bağımlılık kurmadan çalıştırmak isterseniz önerilen yol Docker Compose'dir.

### Yöntem 1: Docker (Önerilen)

1. Projeyi bilgisayarınıza klonlayın.
2. Ortam dosyalarını kendinize göre oluşturun:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Docker-Compose ile konteynerları ayağa kaldırın:
```bash
docker-compose up -d --build
```

- Frontend SPA: `http://localhost` (Port 80)
- Backend API: `http://localhost:3001`
- Veritabanı: MySQL 3306

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
npm install
npm run dev
```

## Güvenlik

Sistem xss-clean, helmet, cors ve express-rate-limit ile korunmaktadır. API rotalarına izinsiz erişim JWT filter katmanıyla engellenir. Şifreler Bcrypt ile dönüştürülür. IDOR açıklarına karşı sıkı aidiyet kontrolleri uygulanır.


