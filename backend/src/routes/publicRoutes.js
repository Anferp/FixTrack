/**
 * Public Routes for FixTrack
 * Handles routing for public access to order status without authentication
 */
const express = require('express');
const publicController = require('../controllers/publicController');
const router = express.Router();

// Route to get order details by ticket code and security key
router.get('/order/:ticket_code/:security_key', publicController.getOrderByTicket);

// Route to get order status updates history by ticket code and security key
router.get('/order/updates/:ticket_code/:security_key', publicController.getOrderUpdates);

// Route to get client-visible comments by ticket code and security key
router.get('/order/comments/:ticket_code/:security_key', publicController.getOrderComments);

module.exports = router;
