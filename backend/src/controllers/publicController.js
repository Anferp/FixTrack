/**
 * Public Controller for FixTrack
 * Handles public access to order status and updates without authentication
 */
const { Order, OrderUpdate, OrderComment } = require('../models/index');

/**
 * Get order details using ticket code and security key
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOrderByTicket = async (req, res) => {
  try {
    const { ticket_code, security_key } = req.params;

    // Validate parameters
    if (!ticket_code || !security_key) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere código de ticket y clave de seguridad'
      });
    }

    // Find order with the given ticket code and security key
    const order = await Order.findOne({
      where: { 
        ticket_code: ticket_code,
        security_key: security_key
      },
      attributes: [
        'ticket_code',
        'client_name',
        'client_contact',
        'service_type',
        'problem_description',
        'status',
        'accessories',
        'created_at',
        'updated_at',
        'closed_at'
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada o clave de seguridad incorrecta'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Error getting public order:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor. Intente nuevamente más tarde.'
    });
  }
};

/**
 * Get order status updates history using ticket code and security key
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOrderUpdates = async (req, res) => {
  try {
    const { ticket_code, security_key } = req.params;

    // Validate parameters
    if (!ticket_code || !security_key) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere código de ticket y clave de seguridad'
      });
    }

    // Find order first to validate ticket and security key
    const order = await Order.findOne({
      where: { 
        ticket_code: ticket_code,
        security_key: security_key
      },
      attributes: ['id']
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada o clave de seguridad incorrecta'
      });
    }

    // Get order updates
    const updates = await OrderUpdate.findByOrderId(order.id);

    // Format updates for public consumption
    const formattedUpdates = updates.map(update => ({
      old_status: update.old_status,
      new_status: update.new_status,
      created_at: update.created_at,
      change_note: update.change_note
    }));

    return res.status(200).json({
      success: true,
      data: {
        updates: formattedUpdates
      }
    });
  } catch (error) {
    console.error('Error getting order updates:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor. Intente nuevamente más tarde.'
    });
  }
};

/**
 * Get client-visible comments for an order using ticket code and security key
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOrderComments = async (req, res) => {
  try {
    const { ticket_code, security_key } = req.params;

    // Validate parameters
    if (!ticket_code || !security_key) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere código de ticket y clave de seguridad'
      });
    }

    // Find order first to validate ticket and security key
    const order = await Order.findOne({
      where: { 
        ticket_code: ticket_code,
        security_key: security_key
      },
      attributes: ['id']
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada o clave de seguridad incorrecta'
      });
    }

    // Get client-visible comments
    const comments = await OrderComment.findClientCommentsByOrderId(order.id);

    // Format comments for public consumption
    const formattedComments = comments.map(comment => ({
      content: comment.content,
      created_at: comment.created_at
    }));

    return res.status(200).json({
      success: true,
      data: {
        comments: formattedComments
      }
    });
  } catch (error) {
    console.error('Error getting order comments:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor. Intente nuevamente más tarde.'
    });
  }
};

module.exports = {
  getOrderByTicket,
  getOrderUpdates,
  getOrderComments
};
