/**
 * OrderAttachment model for FixTrack system
 * Represents file attachments uploaded for service orders
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Order = require('./Order');
const User = require('./User');

const OrderAttachment = sequelize.define('OrderAttachment', {
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
  file_path: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  uploaded_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'order_attachments',
  timestamps: true,
  updatedAt: false,
  createdAt: 'created_at'
});

// Define associations
OrderAttachment.belongsTo(Order, { foreignKey: 'order_id' });
OrderAttachment.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// Add reverse associations to the related models
Order.hasMany(OrderAttachment, { foreignKey: 'order_id', as: 'attachments' });

// Instance methods
OrderAttachment.prototype.getPublicUrl = function() {
  return `/uploads/${this.file_path.split('/').slice(-2).join('/')}`;
};

// Class methods
OrderAttachment.findByOrderId = async function(orderId) {
  return await OrderAttachment.findAll({
    where: { order_id: orderId },
    include: [
      {
        model: User,
        as: 'uploader',
        attributes: ['id', 'username', 'role']
      }
    ],
    order: [['created_at', 'DESC']]
  });
};

module.exports = OrderAttachment;
