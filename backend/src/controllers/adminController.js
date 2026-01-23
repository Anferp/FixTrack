/**
 * Controlador de Administración
 * Maneja todas las operaciones específicas de administrador para gestión de usuarios
 */
const { User, sequelize } = require('../models/index'); // Importar sequelize si no está ya
const { Op } = require('sequelize'); // Importar Op para consultas complejas
const { hashPassword, validatePasswordStrength, generateTemporaryPassword } = require('../utils/password');
const config = require('../config/config');

/**
 * Crear un nuevo usuario
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validar entrada
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de usuario, contraseña y rol son obligatorios'
      });
    }

    // Validar rol
    if (!Object.values(config.roles).includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Rol no válido. Roles permitidos: ${Object.values(config.roles).join(', ')}`
      });
    }

    // Verificar si el nombre de usuario ya existe
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'El nombre de usuario ya existe'
      });
    }

    // Validar fortaleza de la contraseña
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.errors.join('. ')
      });
    }

    // Hashear contraseña
    const password_hash = await hashPassword(password);

    // Crear nuevo usuario
    const newUser = await User.create({
      username,
      password_hash,
      role,
      temp_password_flag: true, // Requerir cambio de contraseña en el primer inicio de sesión
      is_active: true
    });

    // Devolver usuario creado sin datos sensibles
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
 * Obtener todos los usuarios (con filtrado opcional)
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getUsers = async (req, res) => {
  try {
    const { role, active, search, page = 1, limit = 20 } = req.query; // Incluir búsqueda
    const offset = (page - 1) * limit;
    
    // Construir condiciones de filtro
    const where = {};
    if (role) {
      where.role = role;
    }
    if (active !== undefined) {
      where.is_active = active === 'true';
    }
    
    // Agregar filtro de búsqueda si se proporciona
    if (search) {
      where.username = {
        [Op.like]: `%${search}%`
      };
    }

    // Buscar usuarios con paginación
    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: ['id', 'username', 'role', 'temp_password_flag', 'is_active', 'created_at', 'updated_at'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Calcular información de paginación
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
 * Actualizar la información de un usuario
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role } = req.body;

    // Buscar usuario
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Validar rol si se proporciona
    if (role && !Object.values(config.roles).includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Rol no válido. Roles permitidos: ${Object.values(config.roles).join(', ')}`
      });
    }

    // Si el nombre de usuario cambia, verificar duplicados
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

    // Actualizar rol si se proporciona
    if (role) {
      user.role = role;
    }

    // Guardar cambios
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
 * Activar o desactivar un usuario
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
/**
 * Obtener un usuario por su ID
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar usuario
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

    // Validar entrada
    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        error: 'El estado de activación (is_active) es requerido'
      });
    }

    // Buscar usuario
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Evitar que el admin se desactive a sí mismo
    if (user.id === req.user.id && is_active === false) {
      return res.status(400).json({
        success: false,
        error: 'No puedes desactivar tu propia cuenta'
      });
    }

    // Actualizar estado activo
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
 * Restablecer contraseña de usuario y establecer bandera de contraseña temporal
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    let { new_password } = req.body;

    // Generar una contraseña temporal si no se proporciona ninguna
    if (!new_password) {
      new_password = generateTemporaryPassword();
    } else {
      // Validar fortaleza de contraseña si se proporciona
      const passwordValidation = validatePasswordStrength(new_password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: passwordValidation.errors.join('. ')
        });
      }
    }

    // Buscar usuario
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Actualizar contraseña y establecer bandera temporal
    user.password_hash = await hashPassword(new_password);
    user.temp_password_flag = true;
    await user.save();

    // Determinar qué incluir en la respuesta
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

    // Incluir la contraseña generada en la respuesta si fue autogenerada
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
