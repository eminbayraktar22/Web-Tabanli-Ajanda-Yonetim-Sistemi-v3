const sequelize = require('../config/database');

// Import models
const User = require('./User');
const Category = require('./Category');
const Event = require('./Event');
const Tag = require('./Tag');
const Reminder = require('./Reminder');
const EventTags = require('./EventTags');
const Task = require('./Task');
const Note = require('./Note');
const Workspace = require('./Workspace');
const WorkspaceMember = require('./WorkspaceMember');
const TaskComment = require('./TaskComment');
const ActivityLog = require('./ActivityLog');

// ---------- Define Associations ---------- //

// User - Category (1:N)
User.hasMany(Category, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Category.belongsTo(User, { foreignKey: 'user_id' });

// User - Tag (1:N)
User.hasMany(Tag, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Tag.belongsTo(User, { foreignKey: 'user_id' });

// User - Event (1:N)
User.hasMany(Event, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Event.belongsTo(User, { foreignKey: 'user_id' });

// Category - Event (1:N)
Category.hasMany(Event, { foreignKey: 'category_id', onDelete: 'SET NULL' });
Event.belongsTo(Category, { foreignKey: 'category_id' });

// Event - Tag (M:N) through EventTags
Event.belongsToMany(Tag, { 
    through: EventTags, 
    foreignKey: 'event_id', 
    otherKey: 'tag_id',
    onDelete: 'CASCADE'
});
Tag.belongsToMany(Event, { 
    through: EventTags, 
    foreignKey: 'tag_id', 
    otherKey: 'event_id',
    onDelete: 'CASCADE'
});

// Event - Reminder (1:N)
Event.hasMany(Reminder, { foreignKey: 'event_id', onDelete: 'CASCADE' });
Reminder.belongsTo(Event, { foreignKey: 'event_id' });

// User - Reminder (1:N - For easier querying without joining events)
User.hasMany(Reminder, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Reminder.belongsTo(User, { foreignKey: 'user_id' });

// ---------- Sync Export ---------- //
// Workspace Associations
User.hasMany(WorkspaceMember, { foreignKey: 'user_id', as: 'workspace_memberships' });
WorkspaceMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Workspace.hasMany(WorkspaceMember, { foreignKey: 'workspace_id', as: 'members' });
WorkspaceMember.belongsTo(Workspace, { foreignKey: 'workspace_id', as: 'workspace' });

// Add workspace_id to models (we will also add it via addColumnSafely in server.js to avoid dropping tables)
Workspace.hasMany(Task, { foreignKey: 'workspace_id', as: 'tasks' });
Task.belongsTo(Workspace, { foreignKey: 'workspace_id', as: 'workspace' });

Workspace.hasMany(Event, { foreignKey: 'workspace_id', as: 'events' });
Event.belongsTo(Workspace, { foreignKey: 'workspace_id', as: 'workspace' });

Workspace.hasMany(Category, { foreignKey: 'workspace_id', as: 'categories' });
Category.belongsTo(Workspace, { foreignKey: 'workspace_id', as: 'workspace' });

Workspace.hasMany(Note, { foreignKey: 'workspace_id', as: 'notes' });
Note.belongsTo(Workspace, { foreignKey: 'workspace_id', as: 'workspace' });

// Task - TaskComment (1:N)
Task.hasMany(TaskComment, { foreignKey: 'task_id', as: 'comments', onDelete: 'CASCADE' });
TaskComment.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });

// User - TaskComment (1:N)
User.hasMany(TaskComment, { foreignKey: 'user_id', as: 'comments', onDelete: 'CASCADE' });
TaskComment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Workspace - ActivityLog (1:N)
Workspace.hasMany(ActivityLog, { foreignKey: 'workspace_id', as: 'activities', onDelete: 'CASCADE' });
ActivityLog.belongsTo(Workspace, { foreignKey: 'workspace_id' });

// User - ActivityLog (1:N)
User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activities', onDelete: 'CASCADE' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Category,
  Event,
  Tag,
  Reminder,
  EventTags,
  Task,
  Note,
  Workspace,
  WorkspaceMember,
  TaskComment,
  ActivityLog,
};
