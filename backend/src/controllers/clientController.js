/**
 * Client Controller for FixTrack
 * Handles client management operations
 */
const { Client, Order } = require('../models/index');
const { Op } = require('sequelize');

/**
 * Get all clients with optional filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getClients = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    // Build search conditions
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Get clients with pagination
    const { count, rows: clients } = await Client.findAndCountAll({
      where: whereClause,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    
    return res.status(200).json({
      success: true,
      data: {
        clients,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: totalPages
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching clients:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener la lista de clientes'
    });
  }
};

/**
 * Create a new client
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createClient = async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del cliente es obligatorio'
      });
    }
    
    // Create new client
    const client = await Client.create({
      name,
      phone,
      email,
      address,
      notes
    });
    
    return res.status(201).json({
      success: true,
      data: {
        client
      }
    });
    
  } catch (error) {
    console.error('Error creating client:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear el cliente'
    });
  }
};

/**
 * Get client details by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find client
    const client = await Client.findByPk(id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    // Get client's order history
    const orders = await Order.findAll({
      where: { client_id: id },
      attributes: ['id', 'ticket_code', 'service_type', 'problem_description', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    return res.status(200).json({
      success: true,
      data: {
        client,
        order_history: orders
      }
    });
    
  } catch (error) {
    console.error('Error fetching client:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener los datos del cliente'
    });
  }
};

/**
 * Update client details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, notes } = req.body;
    
    // Find client
    const client = await Client.findByPk(id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    // Validate required fields
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del cliente no puede estar vacío'
      });
    }
    
    // Update client fields
    if (name !== undefined) client.name = name;
    if (phone !== undefined) client.phone = phone;
    if (email !== undefined) client.email = email;
    if (address !== undefined) client.address = address;
    if (notes !== undefined) client.notes = notes;
    
    await client.save();
    
    return res.status(200).json({
      success: true,
      data: {
        client
      }
    });
    
  } catch (error) {
    console.error('Error updating client:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar el cliente'
    });
  }
};

/**
 * Check if a phone number or email already exists in the database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const checkDuplicate = async (req, res) => {
  try {
    const { phone, email } = req.query;
    
    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        error: 'Se debe proporcionar un teléfono o correo para verificar'
      });
    }
    
    const whereClause = {};
    
    if (phone) {
      whereClause.phone = phone;
    }
    
    if (email) {
      whereClause.email = email;
    }
    
    const existingClient = await Client.findOne({ 
      where: whereClause,
      attributes: ['id', 'name', 'phone', 'email']
    });
    
    return res.status(200).json({
      success: true,
      data: {
        exists: !!existingClient,
        client: existingClient
      }
    });
    
  } catch (error) {
    console.error('Error checking client duplicate:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al verificar la información del cliente'
    });
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  checkDuplicate
};
