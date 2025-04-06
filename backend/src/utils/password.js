/**
 * Password utilities for FixTrack system
 * Handles hashing, verification and validation of passwords
 */
const bcrypt = require('bcrypt');
const config = require('../config/config');

// Rounds for bcrypt (higher is more secure but slower)
const SALT_ROUNDS = 10;

/**
 * Hashes a plain text password
 * @param {string} password - The plain text password to hash
 * @returns {Promise<string>} - The hashed password
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compares a plain text password against a hash
 * @param {string} password - The plain text password to check
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {Promise<boolean>} - True if the password matches, false otherwise
 */
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Checks if a password meets the requirements defined in config
 * @param {string} password - The password to validate
 * @returns {Object} - Object with isValid flag and any error messages
 */
const validatePasswordStrength = (password) => {
  const policy = config.passwordPolicy;
  const errors = [];

  // Check for minimum length
  if (password.length < policy.minLength) {
    errors.push(`La contraseña debe tener al menos ${policy.minLength} caracteres`);
  }

  // Check for required character types
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (policy.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('La contraseña debe contener al menos un símbolo');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generates a random temporary password
 * @param {number} length - Length of password to generate (default: 10)
 * @returns {string} - The generated temporary password
 */
const generateTemporaryPassword = (length = 10) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=';
  
  // Ensure one of each required character type
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest with random characters from all sets
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password characters
  password = password.split('').sort(() => 0.5 - Math.random()).join('');
  
  return password;
};

module.exports = {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateTemporaryPassword
};
