/**
 * Rutas de Órdenes
 * Define todas las rutas para la gestión de órdenes por secretarias
 */
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, hasRole, requirePasswordChange } = require('../middleware/auth');
const config = require('../config/config');

// Aplicar autenticación a todas las rutas de órdenes
router.use(authenticate);
router.use(requirePasswordChange);

// Crear una nueva orden - solo las secretarias pueden crear órdenes
router.post('/', 
  hasRole([config.roles.SECRETARY, config.roles.ADMIN]),
  orderController.createOrder
);

// Obtener todas las órdenes con filtrado opcional - secretarias y admins
router.get('/', 
  hasRole([config.roles.SECRETARY, config.roles.ADMIN]), 
  orderController.getOrders
);

// Obtener detalles de orden por ID - secretarias, admins y técnicos asignados
// (El controlador verificará si el técnico está asignado a esta orden)
router.get('/:id', 
  hasRole([config.roles.SECRETARY, config.roles.ADMIN, config.roles.TECHNICIAN]), 
  orderController.getOrderById
);

// Asignar un técnico a una orden - solo secretarias y admins
router.put('/:id/assign', 
  hasRole([config.roles.SECRETARY, config.roles.ADMIN]), 
  orderController.assignTechnician
);

// Cerrar una orden - solo secretarias y admins
router.put('/:id/close', 
  hasRole([config.roles.SECRETARY, config.roles.ADMIN]), 
  orderController.closeOrder
);

// Agregar un comentario a una orden - todos los usuarios autenticados
// (El controlador limitará qué tipos de comentarios puede agregar cada rol)
router.post('/:id/comments', 
  hasRole([config.roles.SECRETARY, config.roles.ADMIN, config.roles.TECHNICIAN]), 
  orderController.addComment
);

// Actualizar una orden
router.put(
  '/:id',
  hasRole([config.roles.ADMIN, config.roles.SECRETARY]),
  orderController.updateOrder
);

module.exports = router;
