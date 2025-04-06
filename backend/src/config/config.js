/**
 * Configuration settings for FixTrack system
 * Loads from environment variables with sensible defaults
 */
require('dotenv').config();

const config = {
  // Server settings
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fixtrack-jwt-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // Database configuration
  database: {
    path: process.env.DB_PATH || './data/fixtrack.sqlite',
    logging: process.env.DB_LOGGING === 'true',
  },
  
  // File upload settings
  uploads: {
    path: process.env.UPLOAD_PATH || './src/public/uploads',
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || 5242880, 10), // 5MB default
    allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),
  },
  
  // Password policy
  passwordPolicy: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || 8, 10),
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
    requireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS !== 'false',
  },
  
  // Order status constants
  orderStatus: {
    PENDING: 'pending',
    IN_REVIEW: 'in_review',
    WAITING_PARTS: 'waiting_parts',
    REPAIRED: 'repaired',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },
  
  // Service types
  serviceTypes: {
    EQUIPMENT_REPAIR: 'equipment_repair',
    REMOTE_ASSISTANCE: 'remote_assistance',
  },
  
  // User roles
  roles: {
    ADMIN: 'admin',
    TECHNICIAN: 'technician',
    SECRETARY: 'secretary',
  },
  
  // Email configuration (not implemented in current version)
  email: {
    enabled: false, // This feature is excluded from current scope
  },
};

module.exports = config;
