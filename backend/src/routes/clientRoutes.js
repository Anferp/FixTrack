/**
 * Client Routes for FixTrack
 * Handles routing for client management operations
 */
const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticate, hasRole, requirePasswordChange } = require('../middleware/auth');
const config = require('../config/config');

// Apply authentication to all client routes
router.use(authenticate);
router.use(requirePasswordChange);

// Routes accessible to secretaries and admins
router.get('/', 
  hasRole([config.roles.SECRETARY, config.roles.ADMIN]),
  clientController.getClients
);

// Verificar si un teléfono o correo ya existe
router.get('/check-duplicate', 
  hasRole([config.roles.SECRETARY, config.roles.ADMIN]),
  clientController.checkDuplicate
);

router.post('/',
  hasRole([config.roles.SECRETARY, config.roles.ADMIN]),
  clientController.createClient
);

router.get('/:id',
  hasRole([config.roles.SECRETARY, config.roles.ADMIN]),
  clientController.getClientById
);

router.put('/:id',
  hasRole([config.roles.SECRETARY, config.roles.ADMIN]),
  clientController.updateClient
);

module.exports = router;
