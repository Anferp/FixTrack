/**
 * Middleware de autenticación para el sistema FixTrack
 * Maneja verificación de token y control de acceso basado en roles
 */
const { verifyToken, extractTokenFromHeader } = require('../utils/tokens');
const { User } = require('../models');
const config = require('../config/config');

/**
 * Middleware para autenticar a un usuario validando su token JWT
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Siguiente función middleware
 */
const authenticate = async (req, res, next) => {
  // Obtener el encabezado de autorización
  const authHeader = req.headers.authorization;
  
  // Extraer el token del encabezado Authorization
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No se proporcionó un token de autenticación'
    });
  }
  
  // Verificar el token
  const decoded = await verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticación inválido o expirado'
    });
  }
  
  // Obtener el usuario de la base de datos para asegurar que aún existe y está activo
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
  
  // Adjuntar el usuario y sus datos al objeto de solicitud
  req.user = {
    id: user.id,
    username: user.username,
    role: user.role,
    temp_password_flag: user.temp_password_flag
  };
  
  // Continuar al siguiente middleware o manejador de ruta
  next();
};

/**
 * Middleware para verificar si el usuario tiene al menos uno de los roles requeridos
 * @param {string[]} roles - Array de roles permitidos
 * @returns {Function} - Función middleware de Express
 */
const hasRole = (roles) => {
  return (req, res, next) => {
    // Verificar si el usuario está autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
    }
    
    // Verificar si el usuario tiene uno de los roles requeridos
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para acceder a este recurso'
      });
    }
    
    // El usuario tiene el rol requerido, proceder
    next();
  };
};

/**
 * Middleware para verificar si el usuario es un administrador
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Siguiente función middleware
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
 * Middleware para verificar si el usuario es una secretaria
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Siguiente función middleware
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
 * Middleware para verificar si el usuario es un técnico
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Siguiente función middleware
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
 * Middleware para requerir cambio de contraseña para usuarios con contraseñas temporales
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Siguiente función middleware
 */
const requirePasswordChange = (req, res, next) => {
  // Omitir para endpoints de cambio de contraseña
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
