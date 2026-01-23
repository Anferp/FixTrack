/**
 * Rutas de Reportes para el Sistema FixTrack
 * Maneja todas las rutas relacionadas con funcionalidad de reportes y dashboard
 */
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, isAdmin, hasRole } = require('../middleware/auth');
const config = require('../config/config');

// Aplicar middleware de autenticación a todas las rutas de reportes
router.use(authenticate);

// GET /api/reports/status-distribution
// Obtiene distribución de órdenes por estado
// Accesible por admin y secretaria
router.get(
  '/status-distribution', 
  hasRole([config.roles.ADMIN, config.roles.SECRETARY]), 
  reportController.getStatusDistribution
);

// GET /api/reports/technician-performance
// Obtiene métricas de rendimiento para técnicos
// Accesible solo por admin
router.get(
  '/technician-performance', 
  isAdmin, 
  reportController.getTechnicianPerformance
);

// GET /api/reports/common-problems
// Obtiene análisis de problemas más comunes reportados
// Accesible solo por admin
router.get(
  '/common-problems', 
  isAdmin, 
  reportController.getCommonProblems
);

// GET /api/reports/export-orders
// Exporta órdenes como Excel o PDF
// Accesible por admin y secretaria
router.get(
  '/export-orders', 
  hasRole([config.roles.ADMIN, config.roles.SECRETARY]), 
  reportController.exportOrders
);

module.exports = router;
