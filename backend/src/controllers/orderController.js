/**
 * Order Controller
 * Handles CRUD operations for orders management by secretaries
 */
const { Order, User, OrderComment, OrderUpdate, OrderAttachment, Client, sequelize } = require('../models'); // Import sequelize if not already
const { Op } = require('sequelize'); // Import Op for complex queries

/**
 * Create a new service order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createOrder = async (req, res) => {
  try {
    const { 
      client_id,
      client_name, 
      client_phone,
      client_email,
      service_type, 
      problem_description, 
      accessories,
      create_client
    } = req.body;

    let clientRecord = null;
    
    // Validate required fields
    if (!client_name || !service_type || !problem_description) {
      return res.status(400).json({
        success: false,
        error: "Información incompleta o inválida"
      });
    }

    // Validate service type
    if (!['equipment_repair', 'remote_assistance'].includes(service_type)) {
      return res.status(400).json({
        success: false,
        error: "Tipo de servicio inválido"
      });
    }
    
    // Handle client creation or selection
    if (client_id) {
      // Use existing client
      clientRecord = await Client.findByPk(client_id);
      if (!clientRecord) {
        return res.status(404).json({
          success: false,
          error: "Cliente seleccionado no encontrado"
        });
      }
    } else if (create_client === true) {
      // Create new client record
      clientRecord = await Client.create({
        name: client_name,
        phone: client_phone || null,
        email: client_email || null
      });
    }

    // Create new order
    const order = await Order.create({
      client_id: clientRecord ? clientRecord.id : null,
      client_name,
      client_phone: client_phone || null,
      client_email: client_email || null,
      service_type,
      problem_description,
      accessories: accessories || [],
      status: 'pending',
      created_by: req.user.id
    });

    return res.status(201).json({
      success: true,
      data: {
        order: {
          id: order.id,
          ticket_code: order.ticket_code,
          security_key: order.security_key,
          client_id: order.client_id,
          client_name: order.client_name,
          client_phone: order.client_phone,
          client_email: order.client_email,
          service_type: order.service_type,
          problem_description: order.problem_description,
          status: order.status,
          accessories: order.accessories,
          created_by: order.created_by,
          created_at: order.createdAt
        },
        client: clientRecord
      }
    });

  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      error: "Error al crear la orden de servicio"
    });
  }
};

/**
 * Get all orders with optional filtering by status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOrders = async (req, res) => {
  try {
    const { status, service_type, search, start_date, end_date } = req.query; // Include new filters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Build query conditions
    const whereClause = {}; // Use a separate whereClause object

    // Add status filter if provided
    if (status) {
      if (status === 'closed') {
        // Si se busca 'closed', incluir también 'completed'
        whereClause.status = { [Op.in]: ['closed', 'completed'] };
      } else {
        whereClause.status = status;
      }
    }
    
    // Filter by service_type if provided
    if (service_type) {
      whereClause.service_type = service_type;
    }
    
    // Filter by search text if provided (across multiple fields)
    if (search) {
      const searchTerm = `%${search}%`;
      whereClause[Op.or] = [
        { ticket_code: { [Op.like]: searchTerm } },
        { client_name: { [Op.like]: searchTerm } },
        { problem_description: { [Op.like]: searchTerm } }
      ];
    }
    
    // Filter by date range if provided
    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date + 'T23:59:59.999Z')]
      };
    } else if (start_date) {
      whereClause.created_at = {
        [Op.gte]: new Date(start_date)
      };
    } else if (end_date) {
      whereClause.created_at = {
        [Op.lte]: new Date(end_date + 'T23:59:59.999Z')
      };
    }

    const queryOptions = {
      where: whereClause, // Apply the built whereClause
      order: [['created_at', 'DESC']],
      limit,
      offset,
      attributes: ['id', 'ticket_code', 'client_name', 'service_type', 'status', 'created_at']
    };

    // Get orders with pagination
    const { count, rows: orders } = await Order.findAndCountAll(queryOptions);

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          total: count,
          page,
          limit,
          pages: totalPages
        }
      }
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      error: "Error al obtener las órdenes de servicio"
    });
  }
};

/**
 * Get details of a specific order by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'technician',
          attributes: ['id', 'username']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        },
        {
          model: OrderComment,
          as: 'comments' // Assuming 'comments' is the correct alias for OrderComment association
        },
        {
          model: OrderUpdate,
          as: 'statusUpdates' // Corrected alias based on error message
        },
        {
          model: OrderAttachment,
          as: 'attachments' // Assuming 'attachments' is the correct alias for OrderAttachment association
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Orden no encontrada"
      });
    }

    // Check if user is authorized to see this order
    // Note: This check might need adjustment depending on exact requirements
    // Currently allows admin, secretary, and the assigned technician
    if (req.user.role !== 'admin' && 
        req.user.role !== 'secretary' && 
        (req.user.role !== 'technician' || req.user.id !== order.assigned_technician_id)) {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para ver esta orden"
      });
    }

    // Format response data for better readability
    const orderData = {
      id: order.id,
      ticket_code: order.ticket_code,
      // security_key should generally not be exposed here unless specifically needed
      // security_key: order.security_key, 
      client_name: order.client_name,
      client_phone: order.client_phone,
      client_email: order.client_email,
      service_type: order.service_type,
      problem_description: order.problem_description,
      status: order.status,
      accessories: order.accessories,
      assigned_technician_id: order.assigned_technician_id,
      assigned_technician: order.technician ? order.technician.username : null, // Use the alias 'technician'
      created_by: order.created_by,
      created_by_user: order.creator ? order.creator.username : null, // Use the alias 'creator'
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      closed_at: order.closed_at,
      comments: order.comments || [], // Use the alias 'comments'
      updates: order.statusUpdates || [], // Corrected to use 'statusUpdates' from include
      attachments: order.attachments || [] // Use the alias 'attachments'
    };

    return res.status(200).json({
      success: true,
      data: {
        order: orderData
      }
    });

  } catch (error) {
    // Log the specific Sequelize error if available
    if (error.name === 'SequelizeEagerLoadingError') {
      console.error("Eager loading error in getOrderById:", error.message);
    } else {
      console.error("Error fetching order details:", error);
    }
    return res.status(500).json({
      success: false,
      error: "Error al obtener los detalles de la orden"
    });
  }
};

/**
 * Assign a technician to an order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const assignTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const { technician_id } = req.body;

    if (!technician_id) {
      return res.status(400).json({
        success: false,
        error: "ID de técnico no proporcionado"
      });
    }

    // Check if technician exists and has technician role
    const technician = await User.findOne({
      where: {
        id: technician_id,
        role: 'technician',
        is_active: true
      }
    });

    if (!technician) {
      return res.status(404).json({
        success: false,
        error: "Técnico no encontrado o no está activo"
      });
    }

    // Find the order
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Orden no encontrada"
      });
    }

    // Check if order is already closed
    if (order.status === 'closed') {
      return res.status(400).json({
        success: false,
        error: "No se puede asignar técnico a una orden cerrada"
      });
    }

    // Save old technician id for update log
    const oldTechnicianId = order.assigned_technician_id;

    // Update the order with new technician
    order.assigned_technician_id = technician_id;
    await order.save();

    // Create record in order updates if technician changed
    if (oldTechnicianId !== technician_id) {
      // Assuming OrderUpdate model has a method or direct create works
      await OrderUpdate.create({
        order_id: order.id,
        // Assuming status doesn't change on assignment, use current status
        old_status: order.status, 
        new_status: order.status, 
        changed_by: req.user.id,
        change_note: `Técnico ${oldTechnicianId ? 'reasignado de ID ' + oldTechnicianId : 'asignado'} a ID ${technician_id}`
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        order: {
          id: order.id,
          status: order.status,
          assigned_technician_id: order.assigned_technician_id,
          assigned_technician: technician.username, // Return username for convenience
          updated_at: order.updatedAt
        }
      }
    });

  } catch (error) {
    console.error("Error assigning technician:", error);
    return res.status(500).json({
      success: false,
      error: "Error al asignar técnico a la orden"
    });
  }
};

/**
 * Close an order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const closeOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { closing_notes } = req.body;

    // Find the order
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Orden no encontrada"
      });
    }

    // Check if order already closed
    if (order.status === 'closed') {
      return res.status(400).json({
        success: false,
        error: "La orden ya está cerrada"
      });
    }

    // Check if order has assigned technician - Removed based on potential workflow flexibility
    // if (!order.isAssigned()) {
    //   return res.status(400).json({
    //     success: false,
    //     error: "No se puede cerrar una orden sin técnico asignado"
    //   });
    // }

    // Store old status for update log
    const oldStatus = order.status;
    
    // Close the order - using 'completed' status which is likely valid
    order.status = 'completed';
    order.closed_at = new Date();
    await order.save();

    // Create status update record using the static method if available
    // Assuming OrderUpdate.createStatusUpdate exists as per the reference file summary
    await OrderUpdate.createStatusUpdate(
      order.id,
      oldStatus,
      'completed',
      req.user.id,
      closing_notes || 'Orden cerrada por secretaría'
    );

    // Add closing note as a comment if provided
    if (closing_notes) {
      await OrderComment.create({
        order_id: order.id,
        user_id: req.user.id,
        comment_type: 'status_update', // Or 'client' depending on visibility needs
        content: `Orden cerrada: ${closing_notes}`
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        order: {
          id: order.id,
          status: order.status,
          closed_at: order.closed_at,
          updated_at: order.updatedAt
        }
      }
    });

  } catch (error) {
    console.error("Error closing order:", error);
    return res.status(500).json({
      success: false,
      error: "Error al cerrar la orden"
    });
  }
};

/**
 * Add a comment to an order (client or technical)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, comment_type } = req.body; // Expect 'client' or 'technical'

    // Validate inputs
    if (!content) {
      return res.status(400).json({
        success: false,
        error: "El comentario no puede estar vacío"
      });
    }

    // Determine comment type - default to 'client' if not specified or invalid
    let finalCommentType = 'client';
    if (comment_type && ['client', 'technical', 'status_update'].includes(comment_type)) {
      finalCommentType = comment_type;
    }

    // Check if order exists
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Orden no encontrada"
      });
    }

    // Permission check: Only technicians and admins can add 'technical' comments
    // Secretaries and admins can add 'client' or 'status_update' comments
    if (finalCommentType === 'technical' && 
        req.user.role !== 'technician' && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para agregar comentarios técnicos"
      });
    }
    
    // Assuming secretaries should only add 'client' or 'status_update' comments via this endpoint
    if (req.user.role === 'secretary' && finalCommentType === 'technical') {
       return res.status(403).json({
        success: false,
        error: "Secretarías no pueden agregar comentarios técnicos directamente"
      });     
    }


    // Create the comment
    const comment = await OrderComment.create({
      order_id: id,
      user_id: req.user.id,
      comment_type: finalCommentType,
      content
    });

    // Return the new comment
    return res.status(201).json({
      success: true,
      data: {
        comment: {
          id: comment.id,
          order_id: comment.order_id,
          user_id: comment.user_id,
          comment_type: comment.comment_type,
          content: comment.content,
          created_at: comment.createdAt
        }
      }
    });

  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({
      success: false,
      error: "Error al agregar comentario a la orden"
    });
  }
};

/**
 * Update an order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      client_id,
      client_name, 
      client_phone,
      client_email,
      service_type, 
      problem_description, 
      accessories,
      status
    } = req.body;

    // Find the order
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Orden no encontrada"
      });
    }

    // Check if user is authorized to update this order
    if (req.user.role !== 'admin' && req.user.role !== 'secretary') {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para actualizar esta orden"
      });
    }

    // Update order fields
    if (client_id && (client_name || client_phone || client_email)) {
      // Buscar el cliente asociado
      const client = await Client.findByPk(client_id);
      
      if (client) {
        // Actualizar los campos del cliente si han cambiado
        let clientUpdated = false;
        
        if (client_name && client_name !== client.name) {
          client.name = client_name;
          clientUpdated = true;
        }
        
        if (client_phone && client_phone !== client.phone) {
          client.phone = client_phone;
          clientUpdated = true;
        }
        
        if (client_email && client_email !== client.email) {
          client.email = client_email;
          clientUpdated = true;
        }
        
        // Guardar cambios en el cliente si se actualizó algún campo
        if (clientUpdated) {
          await client.save();
          console.log(`Cliente ID ${client_id} actualizado junto con la orden`);
        }
      }
    }

    if (service_type && service_type !== order.service_type) {
      order.service_type = service_type;
    }

    if (problem_description && problem_description !== order.problem_description) {
      order.problem_description = problem_description;
    }

    if (accessories && !accessories.every((item) => order.accessories.includes(item))) {
      order.accessories = [...new Set([...order.accessories, ...accessories])];
    }

    if (status && status !== order.status) {
      order.status = status;
    }

    await order.save();

    return res.status(200).json({
      success: true,
      data: {
        order: {
          id: order.id,
          ticket_code: order.ticket_code,
          security_key: order.security_key,
          client_id: order.client_id,
          client_name: order.client_name,
          client_phone: order.client_phone,
          client_email: order.client_email,
          service_type: order.service_type,
          problem_description: order.problem_description,
          status: order.status,
          accessories: order.accessories,
          created_by: order.created_by,
          created_at: order.createdAt,
          updated_at: order.updatedAt
        }
      }
    });

  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({
      success: false,
      error: "Error al actualizar la orden"
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  assignTechnician,
  closeOrder,
  addComment,
  updateOrder
};
