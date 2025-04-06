/**
 * Central Router Configuration for FixTrack
 * Imports and configures all route modules with appropriate path prefixes
 */
const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const publicRoutes = require('./publicRoutes');
const orderRoutes = require('./orderRoutes');
const techRoutes = require('./techRoutes');
const adminRoutes = require('./adminRoutes');
const reportRoutes = require('./reportRoutes');
const clientRoutes = require('./clientRoutes');

// Configure routes with their respective path prefixes
// Authentication routes
router.use('/auth', authRoutes);

// Public access routes (no authentication required)
router.use('/public', publicRoutes);

// Order management routes (secretaries)
router.use('/orders', orderRoutes);

// Technical operations routes
router.use('/tech', techRoutes);

// User administration routes
router.use('/admin', adminRoutes);

// Reports and dashboard routes
router.use('/reports', reportRoutes);

// Client management routes
router.use('/clients', clientRoutes);

// Basic API status endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API FixTrack funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Catch-all for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

module.exports = router;
