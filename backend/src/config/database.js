/**
 * Database configuration for FixTrack system
 * Sets up Sequelize connection to SQLite database
 */
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const config = require('./config');

// Ensure the database directory exists
const dbDir = path.dirname(config.database.path);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: config.database.path,
  logging: config.database.logging ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: false,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

// Run the test connection when this module is imported
testConnection();

module.exports = sequelize;
