/**
 * Archivo central de índice para exportar modelos y configurar asociaciones
 * Actúa como punto único de importación para todos los modelos
 */
const sequelize = require('../config/database');
const User = require('./User');
const Client = require('./Client');
const Order = require('./Order');
const OrderAttachment = require('./OrderAttachment');
const OrderComment = require('./OrderComment');
const OrderUpdate = require('./OrderUpdate');

// NOTAS: Las asociaciones principales ya están configuradas en los archivos de modelo individuales
// Este archivo sirve principalmente como punto de exportación centralizado y asegura
// que todos los archivos de modelo se carguen correctamente

// Asegurar que todos los modelos estén sincronizados con la estructura de la base de datos
// En un entorno de producción, se usarían migraciones en su lugar
const syncModels = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('Database models synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing models:', error);
    throw error;
  }
};

// Se pueden agregar asociaciones adicionales aquí si es necesario
// (La mayoría ya están definidas en sus respectivos archivos de modelo)

// Exportar todos los modelos y funciones de utilidad
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
