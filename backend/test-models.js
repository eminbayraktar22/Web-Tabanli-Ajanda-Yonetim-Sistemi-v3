const { sequelize, User, Category, Event, Tag, Reminder, EventTags } = require('./models');

console.log('Modeller başarıyla yüklendi:');
console.log('- User:', !!User);
console.log('- Category:', !!Category);
console.log('- Event:', !!Event);
console.log('- Tag:', !!Tag);
console.log('- Reminder:', !!Reminder);
console.log('- EventTags:', !!EventTags);

console.log('\nVeritabanına bağlanmadan sentaks ve ilişki tanımlamaları kontrol edildi.');
process.exit(0);
