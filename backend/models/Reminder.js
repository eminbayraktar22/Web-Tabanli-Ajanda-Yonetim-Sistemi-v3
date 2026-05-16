const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reminder = sequelize.define('Reminder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  remind_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  is_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  event_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
});

module.exports = Reminder;
