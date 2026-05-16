const { Sequelize } = require('sequelize');
require('dotenv').config();

// Production'da MySQL, diğer ortamlarda SQLite
const isProduction = process.env.NODE_ENV === 'production';

const sequelize = isProduction
  ? new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 3306,
        dialect: 'mysql',
        logging: false,
        dialectOptions: { connectTimeout: 10000 },
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
        define: { timestamps: true, underscored: true }
      }
    )
  : new Sequelize({
      dialect: 'sqlite',
      storage: './test.sqlite',
      logging: false,
      define: { timestamps: true, underscored: true }
    });

module.exports = sequelize;
