/**
 * Controlador para operaciones de técnicos en órdenes de servicio
 * Maneja actualizaciones de estado de órdenes, adjuntos, comentarios y recuperación de órdenes asignadas
 */
const fs = require('fs');
const path = require('path');
const { Order, OrderAttachment, OrderComment, OrderUpdate, User, sequelize } = require('../models'); // Importar sequelize si no está ya
const { Op } = require('sequelize'); // Importar Op para consultas complejas
const config = require('../config/config');

/**
 * Actualizar el estado de una orden asignada al técnico
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_status, change_note } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validar estado
    const validStatuses = ['pending', 'in_review', 'repaired', 'waiting_parts', 'closed'];
    if (!validStatuses.includes(new_status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Estado no válido' 
      });
    }

    // Buscar la orden
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: 'Orden no encontrada' 
      });
    }

    // Verificar si el usuario está autorizado (admin o técnico asignado)
    if (userRole !== config.roles.ADMIN && 
       (userRole !== config.roles.TECHNICIAN || order.assigned_technician_id !== userId)) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permiso para actualizar esta orden' 
      });
    }

    // Verificar si el estado realmente está cambiando
    if (order.status === new_status) {
      return res.status(400).json({
        success: false,
        error: 'La orden ya tiene este estado'
      });
    }

    const oldStatus = order.status;

    // Actualizar estado de la orden
    const updatedOrder = await order.update({
      status: new_status,
      closed_at: new_status === 'closed' ? new Date() : order.closed_at
    });

    // Crear un registro de actualización de estado
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
 * Subir archivos adjuntos a una orden
 */
const addOrderAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verificar si se subió el archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se ha subido ningún archivo'
      });
    }

    // Buscar la orden
    const order = await Order.findByPk(id);
    if (!order) {
      // Eliminar el archivo subido si la orden no existe
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Verificar si el usuario está autorizado (admin o técnico asignado)
    if (userRole !== config.roles.ADMIN && 
       (userRole !== config.roles.TECHNICIAN || order.assigned_technician_id !== userId)) {
      // Eliminar el archivo subido si no está autorizado
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para subir archivos a esta orden'
      });
    }

    // Crear registro de archivo en base de datos
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
    // Intentar eliminar el archivo si hubo un error
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
 * Agregar un comentario técnico a una orden
 */
const addOrderComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, comment_type } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validar tipo de comentario
    const validCommentTypes = ['technical', 'status_update'];
    if (!validCommentTypes.includes(comment_type)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de comentario no válido'
      });
    }

    // Buscar la orden
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    // Verificar si el usuario está autorizado (admin o técnico asignado)
    if (userRole !== config.roles.ADMIN && 
       (userRole !== config.roles.TECHNICIAN || order.assigned_technician_id !== userId)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para agregar comentarios a esta orden'
      });
    }

    // Crear el comentario
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
 * Obtener todas las órdenes asignadas al técnico actual
 */
const getAssignedOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Si no es técnico, denegar acceso
    if (userRole !== config.roles.TECHNICIAN && userRole !== config.roles.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Acceso no autorizado'
      });
    }

    // Opciones de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Opciones de filtrado
    const whereClause = {};
    
    // Si el usuario es técnico, solo mostrar sus órdenes asignadas
    if (userRole === config.roles.TECHNICIAN) {
      whereClause.assigned_technician_id = userId;
    }
    
    // Filtrar por estado si se proporciona
    if (req.query.status) {
      whereClause.status = req.query.status;
    }
    
    // Filtrar por service_type si se proporciona
    if (req.query.service_type) {
      whereClause.service_type = req.query.service_type;
    }
    
    // Filtrar por texto de búsqueda si se proporciona (en múltiples campos)
    if (req.query.search) {
      const searchTerm = `%${req.query.search}%`;
      whereClause[Op.or] = [
        { ticket_code: { [Op.like]: searchTerm } },
        { client_name: { [Op.like]: searchTerm } },
        { problem_description: { [Op.like]: searchTerm } }
      ];
    }
    
    // Filtrar por rango de fecha si se proporciona
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

    // Obtener órdenes con conteo para paginación
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

/**
 * Obtener todas las órdenes (no solo las asignadas al técnico)
 */
const getAllOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Si no es técnico o admin, denegar acceso
    if (userRole !== config.roles.TECHNICIAN && userRole !== config.roles.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Acceso no autorizado'
      });
    }

    // Opciones de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Opciones de filtrado
    const whereClause = {};
    
    // Filtrar por estado si se proporciona
    if (req.query.status) {
      whereClause.status = req.query.status;
    }
    
    // Filtrar por service_type si se proporciona
    if (req.query.service_type) {
      whereClause.service_type = req.query.service_type;
    }
    
    // Filtrar por texto de búsqueda si se proporciona (en múltiples campos)
    if (req.query.search) {
      const searchTerm = `%${req.query.search}%`;
      whereClause[Op.or] = [
        { ticket_code: { [Op.like]: searchTerm } },
        { client_name: { [Op.like]: searchTerm } },
        { problem_description: { [Op.like]: searchTerm } }
      ];
    }
    
    // Filtrar por rango de fecha si se proporciona
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

    // Obtener órdenes con conteo para paginación
    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      attributes: {
        include: ['id', 'ticket_code', 'client_name', 'client_phone', 'client_email', 'service_type', 
                 'problem_description', 'status', 'accessories', 'assigned_technician_id', 'created_at', 'updated_at']
      },
      include: [
        {
          model: User,
          as: 'technician',
          attributes: ['id', 'username']
        }
      ]
    });

    // Marcar qué órdenes están asignadas al técnico actual
    const ordersWithAssignmentInfo = rows.map(order => {
      const orderData = order.toJSON();
      orderData.is_assigned_to_me = (orderData.assigned_technician_id === userId);
      return orderData;
    });

    return res.status(200).json({
      success: true,
      data: {
        orders: ordersWithAssignmentInfo,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener las órdenes'
    });
  }
};

/**
 * Auto-asignar una orden al técnico actual
 */
const selfAssignOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const technicianId = req.user.id;
    
    // Buscar la orden
    const order = await Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Orden no encontrada"
      });
    }
    
    // Verificar si la orden ya está asignada a un técnico
    if (order.assigned_technician_id) {
      return res.status(400).json({
        success: false,
        error: "La orden ya está asignada a un técnico"
      });
    }
    
    // Verificar si la orden ya está cerrada
    if (order.status === 'closed') {
      return res.status(400).json({
        success: false,
        error: "No se puede asignar técnico a una orden cerrada"
      });
    }
    
    // Actualizar la orden con el técnico actual
    order.assigned_technician_id = technicianId;
    
    // Si la orden está en estado pendiente, actualizar a en revisión
    if (order.status === 'pending') {
      order.status = 'in_review';
    }
    
    await order.save();
    
    // Crear registro en actualizaciones de orden
    await OrderUpdate.create({
      order_id: order.id,
      old_status: order.status !== 'in_review' ? order.status : 'pending',
      new_status: order.status,
      changed_by: technicianId,
      change_note: `Técnico auto-asignado (ID: ${technicianId})`
    });
    
    return res.status(200).json({
      success: true,
      message: "Orden asignada exitosamente"
    });
  } catch (error) {
    console.error('Error self-assigning order:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al auto-asignar la orden'
    });
  }
};

/**
 * Reasignar una orden de otro técnico al técnico actual
 */
const reassignOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const technicianId = req.user.id;
    
    // Buscar la orden
    const order = await Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Orden no encontrada"
      });
    }
    
    // Verificar si la orden ya está asignada al técnico actual
    if (order.assigned_technician_id === technicianId) {
      return res.status(400).json({
        success: false,
        error: "La orden ya está asignada a ti"
      });
    }
    
    // Verificar si la orden ya está cerrada
    if (order.status === 'closed') {
      return res.status(400).json({
        success: false,
        error: "No se puede reasignar una orden cerrada"
      });
    }
    
    // Guardar el ID del técnico anterior para el registro de actualización
    const oldTechnicianId = order.assigned_technician_id;
    
    // Actualizar la orden con el técnico actual
    order.assigned_technician_id = technicianId;
    await order.save();
    
    // Crear registro en actualizaciones de orden
    await OrderUpdate.create({
      order_id: order.id,
      old_status: order.status,
      new_status: order.status,
      changed_by: technicianId,
      change_note: `Orden reasignada del técnico ID: ${oldTechnicianId} al técnico ID: ${technicianId}`
    });
    
    return res.status(200).json({
      success: true,
      message: "Orden reasignada exitosamente"
    });
  } catch (error) {
    console.error('Error reassigning order:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al reasignar la orden'
    });
  }
};

module.exports = {
  updateOrderStatus,
  addOrderAttachment,
  addOrderComment,
  getAssignedOrders,
  getAllOrders,
  selfAssignOrder,
  reassignOrder
};
