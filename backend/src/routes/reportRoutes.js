/**
 * Report Routes for FixTrack System
 * Handles all routes related to reporting and dashboard functionality
 */
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, isAdmin, hasRole } = require('../middleware/auth');
const config = require('../config/config');

// Apply authentication middleware to all report routes
router.use(authenticate);

// GET /api/reports/status-distribution
// Obtains distribution of orders by status
// Accessible by admin and secretary
router.get(
  '/status-distribution', 
  hasRole([config.roles.ADMIN, config.roles.SECRETARY]), 
  reportController.getStatusDistribution
);

// GET /api/reports/technician-performance
// Obtains performance metrics for technicians
// Accessible only by admin
router.get(
  '/technician-performance', 
  isAdmin, 
  reportController.getTechnicianPerformance
);

// GET /api/reports/common-problems
// Obtains analysis of most common problems reported
// Accessible only by admin
router.get(
  '/common-problems', 
  isAdmin, 
  reportController.getCommonProblems
);

// GET /api/reports/export-orders
// Exports orders as Excel or PDF
// Accessible by admin and secretary
router.get(
  '/export-orders', 
  hasRole([config.roles.ADMIN, config.roles.SECRETARY]), 
  reportController.exportOrders
);

module.exports = router;
