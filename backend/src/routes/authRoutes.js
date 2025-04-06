/**
 * Authentication Routes for FixTrack
 * Handles authentication-related endpoints
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, requirePasswordChange } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate a user and get token
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticate, authController.changePassword);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, requirePasswordChange, authController.getProfile);

module.exports = router;
