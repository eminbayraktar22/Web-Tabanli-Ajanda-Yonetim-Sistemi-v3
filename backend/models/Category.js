const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  color_hex: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#3b82f6', // Bootstrap/Tailwind blue as fallback
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Folder',
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
});

module.exports = Category;
