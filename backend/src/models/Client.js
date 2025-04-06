/**
 * Client model for FixTrack system
 * Represents clients who request service orders
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  contact: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'clients',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Class methods
Client.findBySearchTerm = async function(searchTerm, options = {}) {
  const Op = sequelize.Sequelize.Op;
  const whereClause = {};
  
  if (searchTerm) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${searchTerm}%` } },
      { contact: { [Op.like]: `%${searchTerm}%` } }
    ];
  }
  
  return await Client.findAll({
    where: whereClause,
    ...options,
    order: [['name', 'ASC']]
  });
};

module.exports = Client;
