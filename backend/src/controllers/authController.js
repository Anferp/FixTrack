/**
 * Controlador de Autenticación para FixTrack
 * Maneja el inicio de sesión de usuario y la gestión de contraseñas
 */
const { User } = require('../models/index');
const { hashPassword, verifyPassword, validatePasswordStrength } = require('../utils/password');
const { generateToken } = require('../utils/tokens');

/**
 * Autentica un usuario y devuelve un token JWT
 * 
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar solicitud
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de usuario y contraseña son requeridos'
      });
    }

    // Buscar usuario por nombre de usuario
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario está activo
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Esta cuenta ha sido desactivada. Contacte a un administrador.'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = generateToken(user);

    // Devolver respuesta exitosa con token y datos de usuario
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
 * Cambiar la contraseña de un usuario
 * 
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    const userId = req.user.id;

    // Validar solicitud
    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }

    // Verificar si las nuevas contraseñas coinciden
    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        error: 'Las contraseñas no coinciden'
      });
    }

    // Validar fortaleza de la contraseña
    const validationResult = validatePasswordStrength(new_password);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: validationResult.errors.join('. ')
      });
    }

    // Obtener usuario
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
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

    // Hashear nueva contraseña
    const newPasswordHash = await hashPassword(new_password);

    // Actualizar contraseña del usuario
    user.password_hash = newPasswordHash;
    user.temp_password_flag = false;
    await user.save();

    // Generar nuevo token con temp_password_flag actualizado
    const token = generateToken(user);

    // Devolver respuesta exitosa
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
 * Obtener perfil del usuario autenticado actual
 * 
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Obtener datos de usuario sin contraseña
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
