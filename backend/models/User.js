const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  reset_token: {
    type: DataTypes.STRING(320),
    allowNull: true,
  },
  reset_token_expires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ai_provider: {
    type: DataTypes.STRING,
    defaultValue: 'openai',
    allowNull: true,
  },
  ai_model: {
    type: DataTypes.STRING,
    defaultValue: 'gpt-3.5-turbo',
    allowNull: true,
  },
  ai_api_key: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
});

module.exports = User;
