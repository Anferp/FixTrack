/**
 * Rutas de Autenticación para FixTrack
 * Maneja endpoints relacionados con autenticación
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, requirePasswordChange } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar un usuario y obtener token
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambiar contraseña de usuario
 * @access  Private
 */
router.put('/change-password', authenticate, authController.changePassword);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil de usuario actual
 * @access  Private
 */
router.get('/profile', authenticate, requirePasswordChange, authController.getProfile);

module.exports = router;
