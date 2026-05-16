const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventTags = sequelize.define('EventTags', {
  // Junction tablosu olduğu için id tanımlamıyoruz, Sequelize otomatik olarak ilişkiden composite PK oluşturacak
  // Ancak model tanımı gerektiği durumlarda kullanabilmek için boş veya sadece timestamp izinli bir gövde geçiyoruz.
}, {
  timestamps: false,
});

module.exports = EventTags;
