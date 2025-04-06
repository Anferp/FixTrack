/**
 * Token utilities for FixTrack system
 * Handles generation and verification of JWT tokens for authentication
 */
const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Generates a JWT token for an authenticated user
 * @param {Object} user - User object with id, username, and role
 * @returns {string} - JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    temp_password_flag: user.temp_password_flag,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Verifies a JWT token and returns the decoded payload
 * @param {string} token - JWT token to verify
 * @returns {Promise<Object|null>} - Decoded payload or null if invalid
 */
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
};

/**
 * Generates a refresh token for extended sessions
 * @param {Object} user - User object with id
 * @returns {string} - Refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    type: 'refresh',
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

/**
 * Extracts the token from the Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Token or null if not found/invalid
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  extractTokenFromHeader,
};
