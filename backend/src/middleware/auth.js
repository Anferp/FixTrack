/**
 * Authentication middleware for FixTrack system
 * Handles token verification and role-based access control
 */
const { verifyToken, extractTokenFromHeader } = require('../utils/tokens');
const { User } = require('../models');
const config = require('../config/config');

/**
 * Middleware to authenticate a user by validating their JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const authenticate = async (req, res, next) => {
  // Get the authorization header
  const authHeader = req.headers.authorization;
  
  // Extract the token from the Authorization header
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No se proporcionó un token de autenticación'
    });
  }
  
  // Verify the token
  const decoded = await verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticación inválido o expirado'
    });
  }
  
  // Get the user from the database to make sure they still exist and are active
  const user = await User.findOne({ 
    where: { 
      id: decoded.id,
      is_active: true
    } 
  });
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Usuario no encontrado o inactivo'
    });
  }
  
  // Attach the user and their data to the request object
  req.user = {
    id: user.id,
    username: user.username,
    role: user.role,
    temp_password_flag: user.temp_password_flag
  };
  
  // Continue to the next middleware or route handler
  next();
};

/**
 * Middleware to check if user has at least one of the required roles
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} - Express middleware function
 */
const hasRole = (roles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
    }
    
    // Check if user has one of the required roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para acceder a este recurso'
      });
    }
    
    // User has the required role, proceed
    next();
  };
};

/**
 * Middleware to check if user is an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === config.roles.ADMIN) {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Se requieren permisos de administrador'
    });
  }
};

/**
 * Middleware to check if user is a secretary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const isSecretary = (req, res, next) => {
  if (req.user && req.user.role === config.roles.SECRETARY) {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Se requieren permisos de secretaria'
    });
  }
};

/**
 * Middleware to check if user is a technician
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const isTechnician = (req, res, next) => {
  if (req.user && req.user.role === config.roles.TECHNICIAN) {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Se requieren permisos de técnico'
    });
  }
};

/**
 * Middleware to require password change for users with temporary passwords
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const requirePasswordChange = (req, res, next) => {
  // Skip for password change endpoints
  if (req.path === '/auth/change-password') {
    return next();
  }
  
  if (req.user && req.user.temp_password_flag) {
    return res.status(403).json({
      success: false,
      error: 'Debe cambiar su contraseña temporal antes de continuar',
      requirePasswordChange: true
    });
  }
  
  next();
};

module.exports = {
  authenticate,
  hasRole,
  isAdmin,
  isSecretary,
  isTechnician,
  requirePasswordChange
};
