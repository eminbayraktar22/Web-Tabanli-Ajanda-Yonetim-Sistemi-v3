const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Note = sequelize.define('Note', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'İsimsiz Not',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#ffffff',
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
});

Note.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Note, { foreignKey: 'user_id', as: 'notes' });

module.exports = Note;
