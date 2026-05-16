const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  workspace_id: {
    type: DataTypes.CHAR(36),
    allowNull: false
  },
  user_id: {
    type: DataTypes.CHAR(36),
    allowNull: false
  },
  action: {
    type: DataTypes.STRING, // e.g. CREATE, UPDATE, DELETE
    allowNull: false
  },
  entity_type: {
    type: DataTypes.STRING, // e.g. Task, Event, Note
    allowNull: false
  },
  entity_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.JSON, // { title: "Görev adı", previous_status: "todo", new_status: "done" }
    allowNull: true
  }
}, {
  tableName: 'ActivityLogs',
  timestamps: true,
  updatedAt: false // Sadece created_at yeterli loglar için
});

module.exports = ActivityLog;
