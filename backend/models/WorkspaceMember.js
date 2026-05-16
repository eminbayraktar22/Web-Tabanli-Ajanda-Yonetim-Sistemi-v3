const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Workspace = require('./Workspace');

const WorkspaceMember = sequelize.define('WorkspaceMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member',
    allowNull: false,
  },
  workspace_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Workspace,
      key: 'id',
    },
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

module.exports = WorkspaceMember;
