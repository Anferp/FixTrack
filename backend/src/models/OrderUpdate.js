/**
 * OrderUpdate model for FixTrack system
 * Represents status changes and updates to service orders
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Order = require('./Order');
const User = require('./User');

const OrderUpdate = sequelize.define('OrderUpdate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  old_status: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  new_status: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  changed_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  change_note: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'order_updates',
  timestamps: true,
  updatedAt: false,
  createdAt: 'created_at'
});

// Define associations
OrderUpdate.belongsTo(Order, { foreignKey: 'order_id' });
OrderUpdate.belongsTo(User, { foreignKey: 'changed_by', as: 'updater' });

// Add reverse associations to related models
Order.hasMany(OrderUpdate, { foreignKey: 'order_id', as: 'statusUpdates' });

// Class methods
OrderUpdate.findByOrderId = async function(orderId) {
  return await OrderUpdate.findAll({
    where: { order_id: orderId },
    include: [
      {
        model: User,
        as: 'updater',
        attributes: ['id', 'username', 'role']
      }
    ],
    order: [['created_at', 'DESC']]
  });
};

// Create a new status update record when order status changes
OrderUpdate.createStatusUpdate = async function(orderId, oldStatus, newStatus, userId, changeNote = null) {
  return await OrderUpdate.create({
    order_id: orderId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: userId,
    change_note: changeNote
  });
};

module.exports = OrderUpdate;
