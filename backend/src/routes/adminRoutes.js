/**
 * Admin Routes for FixTrack System
 * Handles all routes related to user administration
 */
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin, hasRole } = require('../middleware/auth');

// Apply authentication middleware to all admin routes
router.use(authenticate);

// Get all users with optional filtering - accessible to admin and secretary
router.get('/users', hasRole(['admin', 'secretary']), adminController.getUsers);

// Apply admin-only middleware to the rest of the routes
// Create a new user
router.post('/users', isAdmin, adminController.createUser);

// Get a specific user by ID
router.get('/users/:id', isAdmin, adminController.getUserById);

// Update a user's information
router.put('/users/:id', isAdmin, adminController.updateUser);

// Activate or deactivate a user
router.put('/users/:id/activate', isAdmin, adminController.toggleUserActivation);

// Reset a user's password
router.post('/users/:id/reset-password', isAdmin, adminController.resetUserPassword);

module.exports = router;
