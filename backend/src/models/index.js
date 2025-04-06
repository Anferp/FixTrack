/**
 * Central index file for exporting models and setting up associations
 * Acts as a single point of import for all models
 */
const sequelize = require('../config/database');
const User = require('./User');
const Client = require('./Client');
const Order = require('./Order');
const OrderAttachment = require('./OrderAttachment');
const OrderComment = require('./OrderComment');
const OrderUpdate = require('./OrderUpdate');

// NOTE: Primary associations are already set up in individual model files
// This file primarily serves as a centralized export point and ensures
// all model files are loaded properly

// Make sure all models are synchronized with the database structure
// In a production environment, migrations would be used instead
const syncModels = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('Database models synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing models:', error);
    throw error;
  }
};

// Additional associations can be added here if needed
// (Most are already defined in their respective model files)

// Export all models and utility functions
module.exports = {
  sequelize,
  User,
  Client,
  Order,
  OrderAttachment,
  OrderComment,
  OrderUpdate,
  syncModels
};
