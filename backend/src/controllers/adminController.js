/**
 * Admin Controller
 * Handles all admin-specific operations for user management
 */
const { User, sequelize } = require('../models/index'); // Import sequelize if not already
const { Op } = require('sequelize'); // Import Op for complex queries
const { hashPassword, validatePasswordStrength, generateTemporaryPassword } = require('../utils/password');
const config = require('../config/config');

/**
 * Create a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validate input
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de usuario, contraseña y rol son obligatorios'
      });
    }

    // Validate role
    if (!Object.values(config.roles).includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Rol no válido. Roles permitidos: ${Object.values(config.roles).join(', ')}`
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'El nombre de usuario ya existe'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.errors.join('. ')
      });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create new user
    const newUser = await User.create({
      username,
      password_hash,
      role,
      temp_password_flag: true, // Require password change on first login
      is_active: true
    });

    // Return created user without sensitive data
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          temp_password_flag: newUser.temp_password_flag,
          is_active: newUser.is_active,
          created_at: newUser.created_at
        }
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al crear usuario'
    });
  }
};

/**
 * Get all users (with optional filtering)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUsers = async (req, res) => {
  try {
    const { role, active, search, page = 1, limit = 20 } = req.query; // Include search
    const offset = (page - 1) * limit;
    
    // Build filter conditions
    const where = {};
    if (role) {
      where.role = role;
    }
    if (active !== undefined) {
      where.is_active = active === 'true';
    }
    
    // Add search filter if provided
    if (search) {
      where.username = {
        [Op.like]: `%${search}%`
      };
    }

    // Find users with pagination
    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: ['id', 'username', 'role', 'temp_password_flag', 'is_active', 'created_at', 'updated_at'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Calculate pagination information
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: totalPages
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener usuarios'
    });
  }
};

/**
 * Update a user's information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role } = req.body;

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Validate role if provided
    if (role && !Object.values(config.roles).includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Rol no válido. Roles permitidos: ${Object.values(config.roles).join(', ')}`
      });
    }

    // If username is changing, check for duplicates
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'El nombre de usuario ya existe'
        });
      }
      user.username = username;
    }

    // Update role if provided
    if (role) {
      user.role = role;
    }

    // Save changes
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          is_active: user.is_active,
          updated_at: user.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al actualizar usuario'
    });
  }
};

/**
 * Activate or deactivate a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
/**
 * Get a user by their ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          temp_password_flag: user.temp_password_flag,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener usuario'
    });
  }
};

const toggleUserActivation = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Validate input
    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        error: 'El estado de activación (is_active) es requerido'
      });
    }

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Prevent admin from deactivating themselves
    if (user.id === req.user.id && is_active === false) {
      return res.status(400).json({
        success: false,
        error: 'No puedes desactivar tu propia cuenta'
      });
    }

    // Update active status
    user.is_active = is_active;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          is_active: user.is_active,
          updated_at: user.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Error toggling user activation:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al cambiar estado de activación'
    });
  }
};

/**
 * Reset a user's password and set temp password flag
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    let { new_password } = req.body;

    // Generate a temporary password if none provided
    if (!new_password) {
      new_password = generateTemporaryPassword();
    } else {
      // Validate password strength if provided
      const passwordValidation = validatePasswordStrength(new_password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: passwordValidation.errors.join('. ')
        });
      }
    }

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Update password and set temp flag
    user.password_hash = await hashPassword(new_password);
    user.temp_password_flag = true;
    await user.save();

    // Determine what to include in the response
    const response = {
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          temp_password_flag: user.temp_password_flag,
          updated_at: user.updated_at
        }
      }
    };

    // Include the generated password in response if it was auto-generated
    if (!req.body.new_password) {
      response.data.temp_password = new_password;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error resetting user password:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al resetear contraseña'
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  toggleUserActivation,
  resetUserPassword
};
