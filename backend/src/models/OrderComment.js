/**
 * OrderComment model for FixTrack system
 * Represents comments and notes added to service orders
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Order = require('./Order');
const User = require('./User');

const OrderComment = sequelize.define('OrderComment', {
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
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  comment_type: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      isIn: [['client', 'technical', 'status_update']]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  }
}, {
  tableName: 'order_comments',
  timestamps: true,
  updatedAt: false,
  createdAt: 'created_at'
});

// Define associations
OrderComment.belongsTo(Order, { foreignKey: 'order_id' });
OrderComment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// Add reverse associations to related models
Order.hasMany(OrderComment, { foreignKey: 'order_id', as: 'comments' });

// Class methods
OrderComment.findByOrderId = async function(orderId, options = {}) {
  const defaultOptions = {
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'role']
      }
    ],
    order: [['created_at', 'DESC']]
  };
  
  return await OrderComment.findAll({
    where: { order_id: orderId },
    ...defaultOptions,
    ...options
  });
};

OrderComment.findClientCommentsByOrderId = async function(orderId) {
  return await OrderComment.findAll({
    where: { 
      order_id: orderId,
      comment_type: 'client'
    },
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'role']
      }
    ],
    order: [['created_at', 'DESC']]
  });
};

OrderComment.findTechnicalCommentsByOrderId = async function(orderId) {
  return await OrderComment.findAll({
    where: { 
      order_id: orderId,
      comment_type: 'technical'
    },
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'role']
      }
    ],
    order: [['created_at', 'DESC']]
  });
};

module.exports = OrderComment;
