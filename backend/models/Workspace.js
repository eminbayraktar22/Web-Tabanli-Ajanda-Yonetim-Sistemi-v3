const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Workspace = sequelize.define('Workspace', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Kişisel Çalışma Alanı',
  },
});

module.exports = Workspace;
