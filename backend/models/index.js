const sequelize = require('../config/database');

// Import models
const User = require('./User');
const Category = require('./Category');
const Event = require('./Event');
const Tag = require('./Tag');
const Reminder = require('./Reminder');
const EventTags = require('./EventTags');
const Task = require('./Task');

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
module.exports = {
  sequelize,
  User,
  Category,
  Event,
  Tag,
  Reminder,
  EventTags,
  Task,
};
