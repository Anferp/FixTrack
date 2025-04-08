/**
 * Report Controller
 * Handles generation of reports and statistics for the dashboard
 */
const { Op } = require('sequelize');
const { Order, User, OrderComment, sequelize } = require('../models/index');
const config = require('../config/config');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Get distribution of orders by status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStatusDistribution = async (req, res) => {
  try {
    const { start_date, end_date, service_type, search } = req.query; // Add service_type and search
    
    // Build filters
    const whereClause = {};
    if (start_date || end_date) {
      whereClause.created_at = {};
      if (start_date) {
        whereClause.created_at[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        whereClause.created_at[Op.lte] = new Date(end_date + ' 23:59:59');
      }
    }
    
    // Add service_type filter
    if (service_type) {
      whereClause.service_type = service_type;
    }
    
    // Add search filter
    if (search) {
      const searchTerm = `%${search}%`;
      whereClause[Op.or] = [
        { ticket_code: { [Op.like]: searchTerm } },
        { client_name: { [Op.like]: searchTerm } },
        { problem_description: { [Op.like]: searchTerm } }
      ];
    }

    // Get count of orders grouped by status
    const statusCounts = await Order.findAll({
      where: whereClause,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Calculate total orders for percentage
    const totalOrders = statusCounts.reduce((sum, item) => sum + parseInt(item.count), 0);

    // Format the response with percentages
    const distribution = statusCounts.map(item => ({
      status: item.status,
      count: parseInt(item.count),
      percentage: totalOrders > 0 ? parseFloat(((parseInt(item.count) / totalOrders) * 100).toFixed(1)) : 0
    }));

    res.status(200).json({
      success: true,
      data: {
        distribution,
        total_orders: totalOrders
      }
    });
  } catch (error) {
    console.error('Error getting status distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener distribución de estados'
    });
  }
};

/**
 * Get performance metrics for technicians
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTechnicianPerformance = async (req, res) => {
  try {
    const { start_date, end_date, service_type, search } = req.query; // Add service_type and search
    
    // Find all technicians
    const technicians = await User.findAll({
      where: { 
        role: config.roles.TECHNICIAN,
        is_active: true
      },
      attributes: ['id', 'username'],
      raw: true
    });

    const technicianStats = [];

    // For each technician, calculate stats
    for (const tech of technicians) {
      // Build date filters
      const whereClause = { assigned_technician_id: tech.id };
      if (start_date || end_date) {
        whereClause.created_at = {};
        if (start_date) {
          whereClause.created_at[Op.gte] = new Date(start_date);
        }
        if (end_date) {
          whereClause.created_at[Op.lte] = new Date(end_date + ' 23:59:59');
        }
      }
      
      // Add service_type filter
      if (service_type) {
        whereClause.service_type = service_type;
      }
      
      // Add search filter
      if (search) {
        const searchTerm = `%${search}%`;
        whereClause[Op.or] = [
          { ticket_code: { [Op.like]: searchTerm } },
          { client_name: { [Op.like]: searchTerm } },
          { problem_description: { [Op.like]: searchTerm } }
        ];
      }

      // Get assigned orders count
      const ordersAssigned = await Order.count({ where: whereClause });
      
      // Get completed orders count (add status filter to the base whereClause)
      const ordersCompleted = await Order.count({ 
        where: { 
          ...whereClause,
          status: { [Op.in]: ['closed', 'completed'] }
        } 
      });

      // Calculate average resolution time (for completed orders)
      const completedOrders = await Order.findAll({
        where: { 
          ...whereClause,
          status: { [Op.in]: ['closed', 'completed'] },
          closed_at: { [Op.ne]: null }
        },
        attributes: ['created_at', 'closed_at'],
        raw: true
      });

      let totalResolutionTime = 0;
      for (const order of completedOrders) {
        const createdDate = new Date(order.created_at);
        const closedDate = new Date(order.closed_at);
        const resolutionTime = (closedDate - createdDate) / (1000 * 60 * 60 * 24); // in days
        totalResolutionTime += resolutionTime;
      }

      const averageResolutionTime = completedOrders.length > 0 
        ? parseFloat((totalResolutionTime / completedOrders.length).toFixed(1)) 
        : 0;

      // Calculate completion rate
      const completionRate = ordersAssigned > 0 
        ? parseFloat(((ordersCompleted / ordersAssigned) * 100).toFixed(1)) 
        : 0;

      technicianStats.push({
        id: tech.id,
        username: tech.username,
        orders_assigned: ordersAssigned,
        orders_completed: ordersCompleted,
        completion_rate: completionRate,
        average_resolution_time: averageResolutionTime
      });
    }

    res.status(200).json({
      success: true,
      data: {
        technicians: technicianStats
      }
    });
  } catch (error) {
    console.error('Error getting technician performance:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener rendimiento de técnicos'
    });
  }
};

/**
 * Get analysis of most common problems reported
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCommonProblems = async (req, res) => {
  try {
    const { start_date, end_date, service_type, search, limit = 10 } = req.query; // Add service_type and search
    
    // Build filters
    const whereClause = {};
    if (start_date || end_date) {
      whereClause.created_at = {};
      if (start_date) {
        whereClause.created_at[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        whereClause.created_at[Op.lte] = new Date(end_date + ' 23:59:59');
      }
    }
    
    // Add service_type filter
    if (service_type) {
      whereClause.service_type = service_type;
    }
    
    // Add search filter
    if (search) {
      const searchTerm = `%${search}%`;
      whereClause[Op.or] = [
        { ticket_code: { [Op.like]: searchTerm } },
        { client_name: { [Op.like]: searchTerm } },
        { problem_description: { [Op.like]: searchTerm } }
      ];
    }

    // Get all order descriptions for analysis
    const orders = await Order.findAll({
      where: whereClause,
      attributes: ['problem_description'],
      raw: true
    });

    // Simple keyword extraction and counting
    const keywordMap = {};
    const commonKeywords = [
      'no enciende', 'pantalla', 'lento', 'virus', 'batería', 'error', 
      'azul', 'negro', 'wifi', 'internet', 'audio', 'sonido', 'teclado',
      'mouse', 'carga', 'memoria', 'disco', 'software', 'hardware', 'red'
    ];

    // Count occurrences of common keywords in problem descriptions
    orders.forEach(order => {
      const description = order.problem_description.toLowerCase();
      commonKeywords.forEach(keyword => {
        if (description.includes(keyword.toLowerCase())) {
          keywordMap[keyword] = (keywordMap[keyword] || 0) + 1;
        }
      });
    });

    // Convert to array and sort by count
    const keywordArray = Object.entries(keywordMap)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, parseInt(limit));

    // Calculate percentages
    const totalAnalyzed = orders.length;
    const problems = keywordArray.map(item => ({
      keyword: item.keyword,
      count: item.count,
      percentage: totalAnalyzed > 0 ? parseFloat(((item.count / totalAnalyzed) * 100).toFixed(1)) : 0
    }));

    res.status(200).json({
      success: true,
      data: {
        problems,
        total_analyzed: totalAnalyzed
      }
    });
  } catch (error) {
    console.error('Error analyzing common problems:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al analizar problemas comunes'
    });
  }
};

/**
 * Export orders as Excel or PDF
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportOrders = async (req, res) => {
  try {
    const { format = 'excel', start_date, end_date, status, service_type, search, technician_id } = req.query; // Add service_type and search
    
    // Validate format
    if (format !== 'excel' && format !== 'pdf') {
      return res.status(400).json({
        success: false,
        error: "Formato de exportación no válido. Use 'excel' o 'pdf'"
      });
    }

    // Build filters
    const whereClause = {};
    if (start_date || end_date) {
      whereClause.created_at = {};
      if (start_date) {
        whereClause.created_at[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        whereClause.created_at[Op.lte] = new Date(end_date + ' 23:59:59');
      }
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (technician_id) {
      whereClause.assigned_technician_id = technician_id;
    }
    
    // Add service_type filter
    if (service_type) {
      whereClause.service_type = service_type;
    }
    
    // Add search filter
    if (search) {
      const searchTerm = `%${search}%`;
      whereClause[Op.or] = [
        { ticket_code: { [Op.like]: searchTerm } },
        { client_name: { [Op.like]: searchTerm } },
        { problem_description: { [Op.like]: searchTerm } }
      ];
    }

    // Get orders with technician details
    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'technician',
          attributes: ['username']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['username']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Format the date for the filename
    const today = new Date();
    const dateString = `${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    
    if (format === 'excel') {
      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Órdenes de Servicio');
      
      // Define columns
      worksheet.columns = [
        { header: 'Código', key: 'ticket_code', width: 15 },
        { header: 'Cliente', key: 'client_name', width: 25 },
        { header: 'Contacto', key: 'client_contact', width: 20 },
        { header: 'Tipo', key: 'service_type', width: 15 },
        { header: 'Estado', key: 'status', width: 15 },
        { header: 'Técnico', key: 'technician', width: 20 },
        { header: 'Creado por', key: 'creator', width: 20 },
        { header: 'Fecha Creación', key: 'created_at', width: 20 },
        { header: 'Fecha Cierre', key: 'closed_at', width: 20 },
        { header: 'Problema', key: 'problem_description', width: 40 }
      ];
      
      // Add data rows
      orders.forEach(order => {
        worksheet.addRow({
          ticket_code: order.ticket_code,
          client_name: order.client_name,
          client_contact: order.client_contact || 'N/A',
          service_type: order.service_type === 'equipment_repair' ? 'Reparación' : 'Asistencia Remota',
          status: translateStatus(order.status),
          technician: order.technician ? order.technician.username : 'No asignado',
          creator: order.creator ? order.creator.username : 'Desconocido',
          created_at: formatDate(order.created_at),
          closed_at: order.closed_at ? formatDate(order.closed_at) : 'N/A',
          problem_description: order.problem_description
        });
      });
      
      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      
      // Set content type and disposition
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="orders_report_${dateString}.xlsx"`);
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      // Create PDF document
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        layout: 'landscape'
      });
      
      // Set headers for download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="orders_report_${dateString}.pdf"`);
      
      // Pipe the PDF to the response
      doc.pipe(res);
      
      // Add title
      doc.fontSize(16).text('Reporte de Órdenes de Servicio', { align: 'center' });
      doc.moveDown();
      
      // Define table layout
      const tableTop = 100;
      const tableLeft = 50;
      const rowHeight = 30;
      const colWidths = [80, 100, 80, 80, 80, 80, 120];
      
      // Draw header row
      doc.fontSize(10).font('Helvetica-Bold');
      let currentLeft = tableLeft;
      
      ['Código', 'Cliente', 'Tipo', 'Estado', 'Técnico', 'Creado', 'Problema'].forEach((header, i) => {
        doc.text(header, currentLeft, tableTop, { width: colWidths[i], align: 'left' });
        currentLeft += colWidths[i];
      });
      
      // Draw rows
      doc.font('Helvetica');
      let currentTop = tableTop + rowHeight;
      
      orders.slice(0, 15).forEach((order, rowIndex) => {
        currentLeft = tableLeft;
        
        // Add page if needed
        if (currentTop > 500) {
          doc.addPage();
          currentTop = 100;
          
          // Redraw header
          doc.fontSize(10).font('Helvetica-Bold');
          currentLeft = tableLeft;
          ['Código', 'Cliente', 'Tipo', 'Estado', 'Técnico', 'Creado', 'Problema'].forEach((header, i) => {
            doc.text(header, currentLeft, tableTop, { width: colWidths[i], align: 'left' });
            currentLeft += colWidths[i];
          });
          doc.font('Helvetica');
          currentTop = tableTop + rowHeight;
          currentLeft = tableLeft;
        }
        
        // Draw row data
        doc.text(order.ticket_code, currentLeft, currentTop, { width: colWidths[0] });
        currentLeft += colWidths[0];
        
        doc.text(order.client_name, currentLeft, currentTop, { width: colWidths[1] });
        currentLeft += colWidths[1];
        
        doc.text(order.service_type === 'equipment_repair' ? 'Reparación' : 'Asistencia', 
                currentLeft, currentTop, { width: colWidths[2] });
        currentLeft += colWidths[2];
        
        doc.text(translateStatus(order.status), currentLeft, currentTop, { width: colWidths[3] });
        currentLeft += colWidths[3];
        
        doc.text(order.technician ? order.technician.username : 'No asignado', 
                currentLeft, currentTop, { width: colWidths[4] });
        currentLeft += colWidths[4];
        
        doc.text(formatDate(order.created_at), currentLeft, currentTop, { width: colWidths[5] });
        currentLeft += colWidths[5];
        
        const truncatedDescription = order.problem_description.length > 40 ? 
                                    order.problem_description.substring(0, 37) + '...' : 
                                    order.problem_description;
        doc.text(truncatedDescription, currentLeft, currentTop, { width: colWidths[6] });
        
        currentTop += rowHeight;
      });
      
      // Note if there are more orders than shown
      if (orders.length > 15) {
        doc.moveDown();
        doc.text(`... y ${orders.length - 15} órdenes más. Exportar a Excel para ver todas.`, { align: 'center' });
      }
      
      // Add footer with date
      doc.fontSize(8).text(
        `Reporte generado el ${formatDate(new Date())}`, 
        50, 
        doc.page.height - 50, 
        { align: 'center' }
      );
      
      // Finalize and end response
      doc.end();
    }
  } catch (error) {
    console.error('Error exporting orders:', error);
    // If headers were already sent, we can't send JSON response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor al exportar órdenes'
      });
    } else {
      res.end();
    }
  }
};

/**
 * Helper function to translate status codes to Spanish
 * @param {string} status - Status code
 * @returns {string} - Translated status
 */
function translateStatus(status) {
  const statusMap = {
    'pending': 'Pendiente',
    'in_review': 'En revisión',
    'repaired': 'Reparado',
    'waiting_parts': 'Esperando repuestos',
    'closed': 'Cerrado'
  };
  return statusMap[status] || status;
}

/**
 * Helper function to format dates
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

module.exports = {
  getStatusDistribution,
  getTechnicianPerformance,
  getCommonProblems,
  exportOrders
};
