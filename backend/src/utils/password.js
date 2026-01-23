/**
 * Utilidades de contraseña para el sistema FixTrack
 * Maneja hashing, verificación y validación de contraseñas
 */
const bcrypt = require('bcrypt');
const config = require('../config/config');

// Rondas para bcrypt (más alto es más seguro pero más lento)
const SALT_ROUNDS = 10;

/**
 * Hashea una contraseña de texto plano
 * @param {string} password - La contraseña de texto plano a hashear
 * @returns {Promise<string>} - La contraseña hasheada
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compara una contraseña de texto plano contra un hash
 * @param {string} password - La contraseña de texto plano a verificar
 * @param {string} hashedPassword - La contraseña hasheada contra la cual comparar
 * @returns {Promise<boolean>} - Verdadero si la contraseña coincide, falso de lo contrario
 */
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Verifica si una contraseña cumple con los requisitos definidos en la configuración
 * @param {string} password - La contraseña a validar
 * @returns {Object} - Objeto con bandera isValid y cualquier mensaje de error
 */
const validatePasswordStrength = (password) => {
  const policy = config.passwordPolicy;
  const errors = [];

  // Verificar longitud mínima
  if (password.length < policy.minLength) {
    errors.push(`La contraseña debe tener al menos ${policy.minLength} caracteres`);
  }

  // Verificar tipos de caracteres requeridos
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
 * Genera una contraseña temporal aleatoria
 * @param {number} length - Longitud de la contraseña a generar (por defecto: 10)
 * @returns {string} - La contraseña temporal generada
 */
const generateTemporaryPassword = (length = 10) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=';
  
  // Asegurar uno de cada tipo de carácter requerido
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Completar el resto con caracteres aleatorios de todos los conjuntos
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar los caracteres de la contraseña
  password = password.split('').sort(() => 0.5 - Math.random()).join('');
  
  return password;
};

module.exports = {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateTemporaryPassword
};
