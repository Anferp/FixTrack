/**
 * User model for FixTrack system
 * Manages authentication and permissions data
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 255]
    }
  },
  password_hash: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['secretary', 'technician', 'admin']]
    }
  },
  temp_password_flag: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Instance methods
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password_hash;
  return values;
};

// Class methods
User.findByUsername = async function(username) {
  return await User.findOne({ where: { username } });
};

User.findActiveByUsername = async function(username) {
  return await User.findOne({ 
    where: { 
      username,
      is_active: true 
    } 
  });
};

module.exports = User;
