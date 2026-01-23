/**
 * Rutas de Administración para el Sistema FixTrack
 * Maneja todas las rutas relacionadas con la administración de usuarios
 */
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin, hasRole } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas de admin
router.use(authenticate);

// Obtener todos los usuarios con filtrado opcional - accesible para admin y secretaria
router.get('/users', hasRole(['admin', 'secretary']), adminController.getUsers);

// Aplicar middleware solo para admin al resto de las rutas
// Crear un nuevo usuario
router.post('/users', isAdmin, adminController.createUser);

// Obtener un usuario específico por ID
router.get('/users/:id', isAdmin, adminController.getUserById);

// Actualizar la información de un usuario
router.put('/users/:id', isAdmin, adminController.updateUser);

// Activar o desactivar un usuario
router.put('/users/:id/activate', isAdmin, adminController.toggleUserActivation);

// Restablecer la contraseña de un usuario
router.post('/users/:id/reset-password', isAdmin, adminController.resetUserPassword);

module.exports = router;
