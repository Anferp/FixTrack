/**
 * Order Routes
 * Defines all routes for order management by secretaries
 */
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, hasRole, requirePasswordChange } = require('../middleware/auth');
const config = require('../config/config');

// Apply authentication to all order routes
router.use(authenticate);
router.use(requirePasswordChange);

// Create a new order - only secretaries can create orders
router.post('/', 
  hasRole([config.roles.SECRETARY, config.roles.ADMIN]),
  orderController.createOrder
);

// Get all orders with optional filtering - secretaries and admins
router.get('/', 
  hasRole([config.roles.SECRETARY, config.roles.ADMIN]), 
  orderController.getOrders
);

// Get order details by ID - secretaries, admins, and assigned technicians
// (The controller will verify if technician is assigned to this order)
router.get('/:id', 
  hasRole([config.roles.SECRETARY, config.roles.ADMIN, config.roles.TECHNICIAN]), 
  orderController.getOrderById
);

// Assign a technician to an order - only secretaries and admins
router.put('/:id/assign', 
  hasRole([config.roles.SECRETARY, config.roles.ADMIN]), 
  orderController.assignTechnician
);

// Close an order - only secretaries and admins
router.put('/:id/close', 
  hasRole([config.roles.SECRETARY, config.roles.ADMIN]), 
  orderController.closeOrder
);

// Add a comment to an order - all authenticated users
// (The controller will limit what types of comments each role can add)
router.post('/:id/comments', 
  hasRole([config.roles.SECRETARY, config.roles.ADMIN, config.roles.TECHNICIAN]), 
  orderController.addComment
);

module.exports = router;
