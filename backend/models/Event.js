const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  start_datetime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  end_datetime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  all_day: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  shared_emails: {
    type: DataTypes.STRING,
    allowNull: true, // Virgül ile ayrılmış e-posta adresleri tutulacak (örn: "a@b.com,c@d.com")
  },
  is_notified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Cron job mail atınca true yapılacak
  },
  rrule: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  attachment_url: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

module.exports = Event;
