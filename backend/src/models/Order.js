/**
 * Order model for FixTrack system
 * Represents service orders for equipment repairs and remote assistance
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const config = require('../config/config');
const User = require('./User');
const Client = require('./Client');

// Helper function to generate random alphanumeric strings
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ticket_code: {
    type: DataTypes.STRING(12),
    allowNull: false,
    unique: true,
    defaultValue: () => `FIX${generateRandomString(8)}`
  },
  security_key: {
    type: DataTypes.STRING(8),
    allowNull: false,
    unique: true,
    defaultValue: () => generateRandomString(8)
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  client_name: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  client_contact: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  service_type: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      isIn: [['equipment_repair', 'remote_assistance']]
    }
  },
  problem_description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  status: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: config.orderStatus.PENDING,
    validate: {
      isIn: [[
        config.orderStatus.PENDING,
        config.orderStatus.IN_REVIEW,
        config.orderStatus.WAITING_PARTS,
        config.orderStatus.REPAIRED,
        config.orderStatus.COMPLETED,
        config.orderStatus.CANCELLED
      ]]
    }
  },
  assigned_technician_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  accessories: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('accessories');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      if (Array.isArray(value)) {
        this.setDataValue('accessories', JSON.stringify(value));
      } else if (typeof value === 'string') {
        this.setDataValue('accessories', JSON.stringify([value]));
      } else {
        this.setDataValue('accessories', JSON.stringify(value || []));
      }
    }
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  closed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define associations
Order.belongsTo(User, { as: 'technician', foreignKey: 'assigned_technician_id' });
Order.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
Order.belongsTo(Client, { as: 'client', foreignKey: 'client_id' });

// Instance methods
Order.prototype.toJSON = function() {
  return {
    ...this.get(),
    // Remove sensitive info when serializing
    security_key: undefined
  };
};

Order.prototype.isAssigned = function() {
  return !!this.assigned_technician_id;
};

Order.prototype.canBeClosedBy = function(userId, userRole) {
  return userRole === config.roles.ADMIN || 
         userRole === config.roles.SECRETARY || 
         (userRole === config.roles.TECHNICIAN && this.assigned_technician_id === userId);
};

// Class methods
Order.findByTicketAndKey = async function(ticketCode, securityKey) {
  return await Order.findOne({
    where: {
      ticket_code: ticketCode,
      security_key: securityKey
    }
  });
};

Order.findByStatus = async function(status, options = {}) {
  return await Order.findAll({
    where: { status },
    ...options
  });
};

Order.findByTechnician = async function(technicianId, options = {}) {
  return await Order.findAll({
    where: { assigned_technician_id: technicianId },
    ...options
  });
};

module.exports = Order;
