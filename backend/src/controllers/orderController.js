/**
 * Controlador de Órdenes
 * Maneja operaciones CRUD para la gestión de órdenes por secretarias
 */
const { Order, User, OrderComment, OrderUpdate, OrderAttachment, Client, sequelize } = require('../models'); // Importar sequelize si no está ya
const { Op } = require('sequelize'); // Importar Op para consultas complejas

/**
 * Crear una nueva orden de servicio
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
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
    
    // Validar campos requeridos
    if (!client_name || !service_type || !problem_description) {
      return res.status(400).json({
        success: false,
        error: "Información incompleta o inválida"
      });
    }

    // Validar tipo de servicio
    if (!['equipment_repair', 'remote_assistance'].includes(service_type)) {
      return res.status(400).json({
        success: false,
        error: "Tipo de servicio inválido"
      });
    }
    
    // Manejar la creación o selección del cliente
    if (client_id) {
      // Usar cliente existente
      clientRecord = await Client.findByPk(client_id);
      if (!clientRecord) {
        return res.status(404).json({
          success: false,
          error: "Cliente seleccionado no encontrado"
        });
      }
    } else if (create_client === true) {
      // Crear nuevo registro de cliente
      clientRecord = await Client.create({
        name: client_name,
        phone: client_phone || null,
        email: client_email || null
      });
    }

    // Crear nueva orden
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
 * Obtener todas las órdenes con filtrado opcional por estado
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getOrders = async (req, res) => {
  try {
    const { status, service_type, search, start_date, end_date } = req.query; // Include new filters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Construir condiciones de consulta
    const whereClause = {}; // Usar un objeto whereClause separado

    // Agregar filtro de estado si se proporciona
    if (status) {
      if (status === 'closed') {
        // En caso de buscar 'closed', incluir también 'completed'
        whereClause.status = { [Op.in]: ['closed', 'completed'] };
      } else {
        whereClause.status = status;
      }
    }
    
    // Filtrar por service_type si se proporciona
    if (service_type) {
      whereClause.service_type = service_type;
    }
    
    // Filtrar por texto de búsqueda si se proporciona (a través de múltiples campos)
    if (search) {
      const searchTerm = `%${search}%`;
      whereClause[Op.or] = [
        { ticket_code: { [Op.like]: searchTerm } },
        { client_name: { [Op.like]: searchTerm } },
        { problem_description: { [Op.like]: searchTerm } }
      ];
    }
    
    // Filtrar por rango de fecha si se proporciona
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
      where: whereClause, // Aplicar el whereClause construido
      order: [['created_at', 'DESC']],
      limit,
      offset,
      attributes: ['id', 'ticket_code', 'client_name', 'client_phone', 'client_email', 'service_type', 'problem_description', 'status', 'created_at', 'updated_at', 'accessories']
    };

    // Obtener órdenes con paginación
    const { count, rows: orders } = await Order.findAndCountAll(queryOptions);

    // Calcular información de paginación
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
 * Obtener detalles de una orden específica por ID
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
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
          as: 'comments' // Asumiendo que 'comments' es el alias correcto para la asociación OrderComment
        },
        {
          model: OrderUpdate,
          as: 'statusUpdates' // Alias corregido basado en mensaje de error
        },
        {
          model: OrderAttachment,
          as: 'attachments' // Asumiendo que 'attachments' es el alias correcto para la asociación OrderAttachment
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Orden no encontrada"
      });
    }

    // Verificar si el usuario está autorizado para ver esta orden
    // Nota: Esta verificación podría necesitar ajustes dependiendo de los requisitos exactos
    // Actualmente permite admin, secretaria y el técnico asignado
    if (req.user.role !== 'admin' && 
        req.user.role !== 'secretary' && 
        (req.user.role !== 'technician' || req.user.id !== order.assigned_technician_id)) {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para ver esta orden"
      });
    }

    // Formatear datos de respuesta para mejor legibilidad
    const orderData = {
      id: order.id,
      ticket_code: order.ticket_code,
      // security_key generalmente no debería expuesto aquí a menos que sea específicamente necesario
      // security_key: order.security_key, 
      client_name: order.client_name,
      client_phone: order.client_phone,
      client_email: order.client_email,
      service_type: order.service_type,
      problem_description: order.problem_description,
      status: order.status,
      accessories: order.accessories,
      assigned_technician_id: order.assigned_technician_id,
      assigned_technician: order.technician ? order.technician.username : null, // Usar el alias 'technician'
      created_by: order.created_by,
      created_by_user: order.creator ? order.creator.username : null, // Usar el alias 'creator'
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      closed_at: order.closed_at,
      comments: order.comments || [], // Usar el alias 'comments'
      updates: order.statusUpdates || [], // Corregido para usar 'statusUpdates' desde include
      attachments: order.attachments || [] // Usar el alias 'attachments'
    };

    return res.status(200).json({
      success: true,
      data: {
        order: orderData
      }
    });

  } catch (error) {
    // Registrar el error específico de Sequelize si está disponible
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
 * Asignar un técnico a una orden
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
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

    // Verificar si el técnico existe y tiene rol de técnico
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

    // Buscar la orden
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Orden no encontrada"
      });
    }

    // Verificar si la orden ya está cerrada
    if (order.status === 'closed') {
      return res.status(400).json({
        success: false,
        error: "No se puede asignar técnico a una orden cerrada"
      });
    }

    // Guardar ID de técnico anterior para registro de actualización
    const oldTechnicianId = order.assigned_technician_id;

    // Actualizar la orden con el nuevo técnico
    order.assigned_technician_id = technician_id;
    await order.save();

    // Crear registro en actualizaciones de orden si el técnico cambió
    if (oldTechnicianId !== technician_id) {
      // Asumiendo que el modelo OrderUpdate tiene un método o create directo funciona
      await OrderUpdate.create({
        order_id: order.id,
        // Asumiendo que el estado no cambia en la asignación, usar estado actual
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
          assigned_technician: technician.username, // Devolver nombre de usuario por conveniencia
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
 * Cerrar una orden
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const closeOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { closing_notes } = req.body;

    // Buscar la orden
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Orden no encontrada"
      });
    }

    // Verificar si la orden ya está cerrada
    if (order.status === 'closed') {
      return res.status(400).json({
        success: false,
        error: "La orden ya está cerrada"
      });
    }

    // Verificar si la orden tiene técnico asignado - Eliminado por posible flexibilidad de flujo de trabajo
    // if (!order.isAssigned()) {
    //   return res.status(400).json({
    //     success: false,
    //     error: "No se puede cerrar una orden sin técnico asignado"
    //   });
    // }

    // Almacenar estado anterior para registro de actualización
    const oldStatus = order.status;
    
    // Cerrar la orden - usando estado 'completed' que probablemente es válido
    order.status = 'completed';
    order.closed_at = new Date();
    await order.save();

    // Crear registro de actualización de estado usando el método estático si está disponible
    // Asumiendo que OrderUpdate.createStatusUpdate existe según el resumen del archivo de referencia
    await OrderUpdate.createStatusUpdate(
      order.id,
      oldStatus,
      'completed',
      req.user.id,
      closing_notes || 'Orden cerrada por secretaría'
    );

    // Agregar nota de cierre como comentario si se proporciona
    if (closing_notes) {
      await OrderComment.create({
        order_id: order.id,
        user_id: req.user.id,
        comment_type: 'status_update', // O 'client' dependiendo de las necesidades de visibilidad
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
 * Agregar un comentario a una orden (client o technical)
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, comment_type } = req.body; // Espera 'client' o 'technical'

    // Validar entradas
    if (!content) {
      return res.status(400).json({
        success: false,
        error: "El comentario no puede estar vacío"
      });
    }

    // Determinar tipo de comentario - por defecto 'client' si no se especifica o es inválido
    let finalCommentType = 'client';
    if (comment_type && ['client', 'technical', 'status_update'].includes(comment_type)) {
      finalCommentType = comment_type;
    }

    // Verificar si la orden existe
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Orden no encontrada"
      });
    }

    // Verificación de permisos: Solo técnicos y admins pueden agregar comentarios 'technical'
    // Secretarias y admins pueden agregar comentarios 'client' o 'status_update'
    if (finalCommentType === 'technical' && 
        req.user.role !== 'technician' && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para agregar comentarios técnicos"
      });
    }
    
    // Asumiendo que secretarias solo deberían agregar comentarios 'client' o 'status_update' a través de este endpoint
    if (req.user.role === 'secretary' && finalCommentType === 'technical') {
       return res.status(403).json({
        success: false,
        error: "Secretarías no pueden agregar comentarios técnicos directamente"
      });     
    }


    // Crear el comentario
    const comment = await OrderComment.create({
      order_id: id,
      user_id: req.user.id,
      comment_type: finalCommentType,
      content
    });

    // Devolver el nuevo comentario
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
 * Actualizar una orden
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
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

    // Buscar la orden
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Orden no encontrada"
      });
    }

    // Verificar si el usuario está autorizado para actualizar esta orden
    if (req.user.role !== 'admin' && req.user.role !== 'secretary') {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para actualizar esta orden"
      });
    }

    // Actualizar campos de la orden
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
