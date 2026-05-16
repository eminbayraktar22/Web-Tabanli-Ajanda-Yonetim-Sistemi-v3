const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const sequelize = require('./config/database');

const app = express();
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Soket bağlantıları ve oda yönetimi
io.on('connection', (socket) => {
  // Kullanıcı giriş yaptığında kendi ID'siyle odaya girer
  socket.on('join', (userId) => {
    socket.join(userId);
  });
});

// io objesini diğer dosyalardan (controller) erişilebilir yapıyoruz
app.set('io', io);

const PORT = process.env.PORT || 3001;

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads klasörünü dışarı statik aç
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ---------- Routes ----------
// Auth routes
app.use('/api/auth', require('./routes/auth'));

// Event routes
app.use('/api/events', require('./routes/events'));

// Category routes
app.use('/api/categories', require('./routes/categories'));

// Tag routes
app.use('/api/tags', require('./routes/tags'));

// Task routes
app.use('/api/tasks', require('./routes/tasks'));

// Reminder routes
app.use('/api/reminders', require('./routes/reminders'));

// Stats routes
app.use('/api/stats', require('./routes/stats'));

// User profile routes
app.use('/api/users', require('./routes/users'));

// Search routes
app.use('/api/search', require('./routes/search'));

// Notification routes
app.use('/api/notifications', require('./routes/notifications'));

// AI routes
app.use('/api/ai', require('./routes/ai'));

// Note routes
app.use('/api/notes', require('./routes/notes'));

// Workspace routes
app.use('/api/workspaces', require('./routes/workspaces'));

// Comments routes
app.use('/api', require('./routes/comments'));

// Activities routes
app.use('/api/activities', require('./routes/activities'));

// Model imports (for sequelize sync and associations)
const User = require('./models/User');
const Event = require('./models/Event');
const Category = require('./models/Category');
const Task = require('./models/Task');
const Notification = require('./models/Notification');
const Note = require('./models/Note');
const Workspace = require('./models/Workspace');
const WorkspaceMember = require('./models/WorkspaceMember');
const Tag = require('./models/Tag');

// Arka plan işlerini başlat (Cron Jobs)
const startCronJobs = require('./jobs/reminderJob');
startCronJobs();

// ---------- Health Check ----------
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ---------- Error Handler ----------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Sunucu hatası oluştu',
  });
});

// ---------- Start Server ----------
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı.');

    // SQLite Tablo Kolon Denetimi - Optimize (Refactored) Şekli
    const addColumnSafely = async (tableName, columnName, dataType) => {
      try {
        const tableInfo = await sequelize.getQueryInterface().describeTable(tableName);
        if (!tableInfo[columnName]) {
           await sequelize.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${dataType};`);
           console.log(`[DB] ${tableName} tablosuna ${columnName} başarıyla eklendi.`);
        }
      } catch (e) {
        // Tablo henüz senkronize edilmediyse oluşan hataları tamamen gizle
      }
    };

    await addColumnSafely('Events', 'shared_emails', 'VARCHAR(255)');
    await addColumnSafely('Events', 'is_notified', 'TINYINT(1) DEFAULT 0');
    await addColumnSafely('Events', 'rrule', 'VARCHAR(255)');
    await addColumnSafely('Events', 'attachment_url', 'VARCHAR(255)');
    await addColumnSafely('Categories', 'icon', 'VARCHAR(50)');
    await addColumnSafely('Tasks', 'category_id', 'CHAR(36)'); // UUID
    await addColumnSafely('Tasks', 'due_date', 'DATETIME');
    await addColumnSafely('Tasks', 'tags_json', 'TEXT');
    await addColumnSafely('Tasks', 'subtasks_json', 'TEXT');
    await addColumnSafely('Tasks', 'priority', 'VARCHAR(50)');
    await addColumnSafely('Tasks', 'attachment_url', 'VARCHAR(255)');
    await addColumnSafely('Tasks', 'time_spent', 'INT DEFAULT 0');
    await addColumnSafely('Tasks', 'is_timer_running', 'TINYINT(1) DEFAULT 0');
    await addColumnSafely('Tasks', 'timer_started_at', 'DATETIME');
    await addColumnSafely('Tasks', 'workspace_id', 'CHAR(36)');
    await addColumnSafely('Events', 'workspace_id', 'CHAR(36)');
    await addColumnSafely('Categories', 'workspace_id', 'CHAR(36)');
    await addColumnSafely('Notes', 'workspace_id', 'CHAR(36)');
    await addColumnSafely('Tags', 'workspace_id', 'CHAR(36)');
    await addColumnSafely('Users', 'avatar_url', 'VARCHAR(255)');
    await addColumnSafely('Users', 'reset_token', 'VARCHAR(320)');
    await addColumnSafely('Users', 'reset_token_expires', 'DATETIME');
    await addColumnSafely('users', 'avatar_url', 'VARCHAR(255)');
    await addColumnSafely('users', 'reset_token', 'VARCHAR(320)');
    await addColumnSafely('users', 'reset_token_expires', 'DATETIME');
    await addColumnSafely('Users', 'ai_provider', 'VARCHAR(255)');
    await addColumnSafely('Users', 'ai_model', 'VARCHAR(255)');
    await addColumnSafely('Users', 'ai_api_key', 'VARCHAR(512)');
    await addColumnSafely('users', 'ai_provider', 'VARCHAR(255)');
    await addColumnSafely('users', 'ai_model', 'VARCHAR(255)');
    await addColumnSafely('users', 'ai_api_key', 'VARCHAR(512)');

    // Sadece eksik tabloları oluştur, var olanları güncelle (alter: true)
    // Veritabanı türüne göre FK kısıtlamalarını kapat
    if (sequelize.getDialect() === 'sqlite') {
      await sequelize.query('PRAGMA foreign_keys = OFF');
    } else {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    }
    
    await sequelize.sync();
    
    // Veritabanı türüne göre FK kısıtlamalarını aç
    if (sequelize.getDialect() === 'sqlite') {
      await sequelize.query('PRAGMA foreign_keys = ON');
    } else {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    }
    
    console.log('✅ Modeller senkronize edildi.');

    // Workspace Data Migration
    try {
      const { Workspace, WorkspaceMember, User, Task, Event, Category, Note } = require('./models');
      const users = await User.findAll();
      for (const user of users) {
        const member = await WorkspaceMember.findOne({ where: { user_id: user.id } });
        if (!member) {
          const ws = await Workspace.create({ name: 'Kişisel Çalışma Alanı' });
          await WorkspaceMember.create({ workspace_id: ws.id, user_id: user.id, role: 'admin' });
          
          await Task.update({ workspace_id: ws.id }, { where: { user_id: user.id, workspace_id: null } });
          await Event.update({ workspace_id: ws.id }, { where: { user_id: user.id, workspace_id: null } });
          await Category.update({ workspace_id: ws.id }, { where: { user_id: user.id, workspace_id: null } });
          await Note.update({ workspace_id: ws.id }, { where: { user_id: user.id, workspace_id: null } });
          await Tag.update({ workspace_id: ws.id }, { where: { user_id: user.id, workspace_id: null } });
        }
      }
      console.log('✅ Çalışma alanları migrasyonu tamamlandı.');
    } catch (migErr) {
      console.error('Workspace migrasyon hatası:', migErr);
    }

    server.listen(PORT, () => {
      console.log(`🚀 Sunucu ve WebSocket http://localhost:${PORT} adresinde çalışıyor`);
    });
  } catch (error) {
    console.error('❌ Sunucu başlatılamadı:', error);
    process.exit(1);
  }
}

startServer();
