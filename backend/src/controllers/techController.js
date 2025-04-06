/**
 * Controller for technician operations on service orders
 * Handles order status updates, attachments, comments, and retrieval of assigned orders
 */
const fs = require('fs');
const path = require('path');
const { Order, OrderAttachment, OrderComment, OrderUpdate, User, sequelize } = require('../models'); // Import sequelize if not already
const { Op } = require('sequelize'); // Import Op for complex queries
const config = require('../config/config');

/**
 * Update the status of an order assigned to the technician
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_status, change_note } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate status
    const validStatuses = ['pending', 'in_review', 'repaired', 'waiting_parts', 'closed'];
    if (!validStatuses.includes(new_status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Estado no válido' 
      });
    }

    // Find the order
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: 'Orden no encontrada' 
      });
    }

    // Check if user is authorized (admin or assigned technician)
    if (userRole !== config.roles.ADMIN && 
       (userRole !== config.roles.TECHNICIAN || order.assigned_technician_id !== userId)) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permiso para actualizar esta orden' 
      });
    }

    // Check if the status is actually changing
    if (order.status === new_status) {
      return res.status(400).json({
        success: false,
        error: 'La orden ya tiene este estado'
      });
    }

    const oldStatus = order.status;

    // Update order status
    const updatedOrder = await order.update({
      status: new_status,
      closed_at: new_status === 'closed' ? new Date() : order.closed_at
    });

    // Create a status update record
    const update = await OrderUpdate.create({
      order_id: id,
      old_status: oldStatus,
      new_status,
      changed_by: userId,
      change_note
    });

    return res.status(200).json({
      success: true,
      data: {
        order: {
          id: updatedOrder.id,
          ticket_code: updatedOrder.ticket_code,
          old_status: oldStatus,
          new_status: updatedOrder.status,
          updated_at: updatedOrder.updated_at
        },
        update: update
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar el estado de la orden'
    });
  }
};

/**
 * Upload file attachments to an order
 */
const addOrderAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se ha subido ningún archivo'
      });
    }

    // Find the order
    const order = await Order.findByPk(id);
    if (!order) {
      // Delete the uploaded file if order doesn't exist
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Check if user is authorized (admin or assigned technician)
    if (userRole !== config.roles.ADMIN && 
       (userRole !== config.roles.TECHNICIAN || order.assigned_technician_id !== userId)) {
      // Delete the uploaded file if not authorized
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para subir archivos a esta orden'
      });
    }

    // Create file record in database
    const attachment = await OrderAttachment.create({
      order_id: id,
      file_path: req.file.path,
      uploaded_by: userId
    });

    return res.status(201).json({
      success: true,
      data: {
        attachment: {
          id: attachment.id,
          order_id: attachment.order_id,
          file_path: attachment.getPublicUrl(),
          uploaded_by: attachment.uploaded_by,
          created_at: attachment.created_at
        }
      }
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    // Try to delete the file if there was an error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error deleting file after upload error:', e);
      }
    }
    return res.status(500).json({
      success: false,
      error: 'Error al subir el archivo adjunto'
    });
  }
};

/**
 * Add a technical comment to an order
 */
const addOrderComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, comment_type } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate comment type
    const validCommentTypes = ['technical', 'status_update'];
    if (!validCommentTypes.includes(comment_type)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de comentario no válido'
      });
    }

    // Find the order
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Check if user is authorized (admin or assigned technician)
    if (userRole !== config.roles.ADMIN && 
       (userRole !== config.roles.TECHNICIAN || order.assigned_technician_id !== userId)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para agregar comentarios a esta orden'
      });
    }

    // Create the comment
    const comment = await OrderComment.create({
      order_id: id,
      user_id: userId,
      comment_type,
      content
    });

    return res.status(201).json({
      success: true,
      data: {
        comment
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al agregar el comentario'
    });
  }
};

/**
 * Get all orders assigned to the current technician
 */
const getAssignedOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // If not a technician, deny access
    if (userRole !== config.roles.TECHNICIAN && userRole !== config.roles.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Acceso no autorizado'
      });
    }

    // Pagination options
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Filter options
    const whereClause = {};
    
    // If user is a technician, only show their assigned orders
    if (userRole === config.roles.TECHNICIAN) {
      whereClause.assigned_technician_id = userId;
    }
    
    // Filter by status if provided
    if (req.query.status) {
      whereClause.status = req.query.status;
    }
    
    // Filter by service_type if provided
    if (req.query.service_type) {
      whereClause.service_type = req.query.service_type;
    }
    
    // Filter by search text if provided (across multiple fields)
    if (req.query.search) {
      const searchTerm = `%${req.query.search}%`;
      whereClause[Op.or] = [
        { ticket_code: { [Op.like]: searchTerm } },
        { client_name: { [Op.like]: searchTerm } },
        { problem_description: { [Op.like]: searchTerm } }
      ];
    }
    
    // Filter by date range if provided
    if (req.query.start_date && req.query.end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(req.query.start_date), new Date(req.query.end_date + 'T23:59:59.999Z')]
      };
    } else if (req.query.start_date) {
      whereClause.created_at = {
        [Op.gte]: new Date(req.query.start_date)
      };
    } else if (req.query.end_date) {
      whereClause.created_at = {
        [Op.lte]: new Date(req.query.end_date + 'T23:59:59.999Z')
      };
    }

    // Get orders with count for pagination
    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: {
        orders: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching assigned orders:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener las órdenes asignadas'
    });
  }
};

module.exports = {
  updateOrderStatus,
  addOrderAttachment,
  addOrderComment,
  getAssignedOrders
};
