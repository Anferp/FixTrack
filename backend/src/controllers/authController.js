/**
 * Authentication Controller for FixTrack
 * Handles user login and password management
 */
const { User } = require('../models/index');
const { hashPassword, verifyPassword, validatePasswordStrength } = require('../utils/password');
const { generateToken } = require('../utils/tokens');

/**
 * Authenticate a user and return a JWT token
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate request
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de usuario y contraseña son requeridos'
      });
    }

    // Find user by username
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Esta cuenta ha sido desactivada. Contacte a un administrador.'
      });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Generate token
    const token = generateToken(user);

    // Return success response with token and user data
    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          temp_password_flag: user.temp_password_flag
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor. Intente nuevamente más tarde.'
    });
  }
};

/**
 * Change a user's password
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    const userId = req.user.id;

    // Validate request
    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }

    // Check if new passwords match
    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        error: 'Las contraseñas no coinciden'
      });
    }

    // Validate password strength
    const validationResult = validatePasswordStrength(new_password);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: validationResult.errors.join('. ')
      });
    }

    // Get user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(current_password, user.password_hash);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña actual incorrecta'
      });
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    if (current_password === new_password) {
      return res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe ser diferente a la actual'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(new_password);

    // Update user's password
    user.password_hash = newPasswordHash;
    user.temp_password_flag = false;
    await user.save();

    // Generate new token with updated temp_password_flag
    const token = generateToken(user);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente',
      data: {
        temp_password_flag: false,
        token
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor. Intente nuevamente más tarde.'
    });
  }
};

/**
 * Get current authenticated user's profile
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data without password
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'role', 'temp_password_flag', 'is_active', 'created_at']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor. Intente nuevamente más tarde.'
    });
  }
};

module.exports = {
  login,
  changePassword,
  getProfile
};
