const bcrypt = require('bcryptjs');
const { sequelize, User, Category, Event, Tag } = require('../models');

async function seedDatabase() {
  try {
    // 1. Veritabanını tamamen senkronize et (Mevcut tabloları silip yeniden oluşturur)
    await sequelize.sync({ force: true });
    console.log('✅ Modeller veritabanına uyarlandı (Tablolar sıfırlandı).');

    // 2. Test Kullanıcısı Oluştur
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('test1234', salt);

    const testUser = await User.create({
      name: 'Test Kullanıcısı',
      email: 'test@test.com',
      password_hash: password_hash,
    });
    console.log('✅ Test kullanıcısı oluşturuldu (test@test.com / test1234).');

    // 3. Kategoriler Oluştur
    const workCategory = await Category.create({
      name: 'İş',
      color_hex: '#ef4444', // Red
      user_id: testUser.id,
    });
    const personalCategory = await Category.create({
      name: 'Kişisel',
      color_hex: '#3b82f6', // Blue
      user_id: testUser.id,
    });
    const healthCategory = await Category.create({
      name: 'Sağlık',
      color_hex: '#10b981', // Green
      user_id: testUser.id,
    });
    console.log('✅ Kategoriler oluşturuldu (İş, Kişisel, Sağlık).');

    // 4. Etiketler Oluştur
    const tagImportant = await Tag.create({ name: 'Önemli', user_id: testUser.id });
    const tagMeeting = await Tag.create({ name: 'Toplantı', user_id: testUser.id });
    const tagDoctor = await Tag.create({ name: 'Doktor', user_id: testUser.id });
    console.log('✅ Etiketler oluşturuldu.');

    // 5. Örnek Etkinlikler Oluştur
    const today = new Date();
    
    // Etkinlik 1: Takım Toplantısı (Bugün, 14:00 - 15:30)
    const event1Start = new Date(today);
    event1Start.setHours(14, 0, 0, 0);
    const event1End = new Date(today);
    event1End.setHours(15, 30, 0, 0);
    
    const event1 = await Event.create({
      title: 'Haftalık Takım Toplantısı',
      description: 'Proje ilerleme durumu değerlendirilecek.',
      start_datetime: event1Start,
      end_datetime: event1End,
      all_day: false,
      user_id: testUser.id,
      category_id: workCategory.id,
    });
    await event1.addTags([tagImportant, tagMeeting]);

    // Etkinlik 2: Diş Hekimi Randevusu (Yarın, 10:00 - 11:00)
    const event2Start = new Date(today);
    event2Start.setDate(today.getDate() + 1);
    event2Start.setHours(10, 0, 0, 0);
    const event2End = new Date(today);
    event2End.setDate(today.getDate() + 1);
    event2End.setHours(11, 0, 0, 0);

    const event2 = await Event.create({
      title: 'Diş Hekimi Randevusu',
      description: 'Rutin kontrol.',
      start_datetime: event2Start,
      end_datetime: event2End,
      all_day: false,
      user_id: testUser.id,
      category_id: healthCategory.id,
    });
    await event2.addTags([tagDoctor]);

    // Etkinlik 3: Yıllık İzin (Haftaya, Tüm gün)
    const event3Start = new Date(today);
    event3Start.setDate(today.getDate() + 7);
    event3Start.setHours(0, 0, 0, 0);
    const event3End = new Date(today);
    event3End.setDate(today.getDate() + 12); // 5 gün
    event3End.setHours(23, 59, 59, 999);

    const event3 = await Event.create({
      title: 'Tatil (Yıllık İzin)',
      description: 'Kafa dinleme zamanı.',
      start_datetime: event3Start,
      end_datetime: event3End,
      all_day: true,
      user_id: testUser.id,
      category_id: personalCategory.id,
    });

    console.log('✅ Örnek etkinlikler oluşturuldu ve etiketlerle ilişkilendirildi.');
    console.log('🎉 Seeding tamamlandı!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding sırasında hata oluştu:', error);
    process.exit(1);
  }
}

seedDatabase();
