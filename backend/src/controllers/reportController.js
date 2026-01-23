/**
 * Controlador de Reportes
 * Maneja la generación de reportes y estadísticas para el dashboard
 */
const { Op } = require('sequelize');
const { Order, User, OrderComment, sequelize } = require('../models/index');
const config = require('../config/config');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Obtener distribución de órdenes por estado
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getStatusDistribution = async (req, res) => {
  try {
    const { start_date, end_date, service_type, search } = req.query; // Agregar service_type y búsqueda
    
    // Construir filtros
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
    
    // Agregar filtro de service_type
    if (service_type) {
      whereClause.service_type = service_type;
    }
    
    // Agregar filtro de búsqueda
    if (search) {
      const searchTerm = `%${search}%`;
      whereClause[Op.or] = [
        { ticket_code: { [Op.like]: searchTerm } },
        { client_name: { [Op.like]: searchTerm } },
        { problem_description: { [Op.like]: searchTerm } }
      ];
    }

    // Obtener conteo de órdenes agrupadas por estado
    const statusCounts = await Order.findAll({
      where: whereClause,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Calcular total de órdenes para porcentaje
    const totalOrders = statusCounts.reduce((sum, item) => sum + parseInt(item.count), 0);

    // Formatear la respuesta con porcentajes
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
 * Obtener métricas de rendimiento para técnicos
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getTechnicianPerformance = async (req, res) => {
  try {
    const { start_date, end_date, service_type, search } = req.query; // Agregar service_type y búsqueda
    
    // Buscar todos los técnicos
    const technicians = await User.findAll({
      where: { 
        role: config.roles.TECHNICIAN,
        is_active: true
      },
      attributes: ['id', 'username'],
      raw: true
    });

    const technicianStats = [];

    // Para cada técnico, calcular estadísticas
    for (const tech of technicians) {
      // Construir filtros de fecha
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
      
      // Agregar filtro de service_type
      if (service_type) {
        whereClause.service_type = service_type;
      }
      
      // Agregar filtro de búsqueda
      if (search) {
        const searchTerm = `%${search}%`;
        whereClause[Op.or] = [
          { ticket_code: { [Op.like]: searchTerm } },
          { client_name: { [Op.like]: searchTerm } },
          { problem_description: { [Op.like]: searchTerm } }
        ];
      }

      // Obtener conteo de órdenes asignadas
      const ordersAssigned = await Order.count({ where: whereClause });
      
      // Obtener conteo de órdenes completadas (agregar filtro de estado a la whereClause base)
      const ordersCompleted = await Order.count({ 
        where: { 
          ...whereClause,
          status: { [Op.in]: ['closed', 'completed'] }
        } 
      });

      // Calcular tiempo promedio de resolución (para órdenes completadas)
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
        const resolutionTime = (closedDate - createdDate) / (1000 * 60 * 60 * 24); // en días
        totalResolutionTime += resolutionTime;
      }

      const averageResolutionTime = completedOrders.length > 0 
        ? parseFloat((totalResolutionTime / completedOrders.length).toFixed(1)) 
        : 0;

      // Calcular tasa de finalización
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
 * Obtener análisis de problemas comunes reportados
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getCommonProblems = async (req, res) => {
  try {
    const { start_date, end_date, service_type, search, limit = 10 } = req.query; // Agregar service_type y búsqueda
    
    // Construir filtros
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
    
    // Agregar filtro de service_type
    if (service_type) {
      whereClause.service_type = service_type;
    }
    
    // Agregar filtro de búsqueda
    if (search) {
      const searchTerm = `%${search}%`;
      whereClause[Op.or] = [
        { ticket_code: { [Op.like]: searchTerm } },
        { client_name: { [Op.like]: searchTerm } },
        { problem_description: { [Op.like]: searchTerm } }
      ];
    }

    // Obtener todas las descripciones de órdenes para análisis
    const orders = await Order.findAll({
      where: whereClause,
      attributes: ['problem_description'],
      raw: true
    });

    // Extracción simple de palabras clave y conteo
    const keywordMap = {};
    const commonKeywords = [
      'no enciende', 'pantalla', 'lento', 'virus', 'batería', 'error', 
      'azul', 'negro', 'wifi', 'internet', 'audio', 'sonido', 'teclado',
      'mouse', 'carga', 'memoria', 'disco', 'software', 'hardware', 'red'
    ];

    // Contar apariciones de palabras clave comunes en descripciones de problemas
    orders.forEach(order => {
      const description = order.problem_description.toLowerCase();
      commonKeywords.forEach(keyword => {
        if (description.includes(keyword.toLowerCase())) {
          keywordMap[keyword] = (keywordMap[keyword] || 0) + 1;
        }
      });
    });

    // Convertir a array y ordenar por conteo
    const keywordArray = Object.entries(keywordMap)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, parseInt(limit));

    // Calcular porcentajes
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
 * Exportar órdenes como Excel o PDF
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const exportOrders = async (req, res) => {
  try {
    const { format = 'excel', start_date, end_date, status, service_type, search, technician_id } = req.query; // Agregar service_type y búsqueda
    
    // Validar formato
    if (format !== 'excel' && format !== 'pdf') {
      return res.status(400).json({
        success: false,
        error: "Formato de exportación no válido. Use 'excel' o 'pdf'"
      });
    }

    // Construir filtros
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
    
    // Agregar filtro de service_type
    if (service_type) {
      whereClause.service_type = service_type;
    }
    
    // Agregar filtro de búsqueda
    if (search) {
      const searchTerm = `%${search}%`;
      whereClause[Op.or] = [
        { ticket_code: { [Op.like]: searchTerm } },
        { client_name: { [Op.like]: searchTerm } },
        { problem_description: { [Op.like]: searchTerm } }
      ];
    }

    // Obtener órdenes con detalles de técnico
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

    // Formatear la fecha para el nombre de archivo
    const today = new Date();
    const dateString = `${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    
    if (format === 'excel') {
      // Crear libro de Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Órdenes de Servicio');
      
      // Definir columnas
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
      
      // Agregar filas de datos
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
      
      // Estilizar la fila de encabezado
      worksheet.getRow(1).font = { bold: true };
      
      // Establecer tipo de contenido y disposición
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="orders_report_${dateString}.xlsx"`);
      
      // Escribir en la respuesta
      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      // Crear documento PDF
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        layout: 'landscape'
      });
      
      // Establecer encabezados para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="orders_report_${dateString}.pdf"`);
      
      // Enviar el PDF a la respuesta mediante pipe
      doc.pipe(res);
      
      // Agregar título
      doc.fontSize(16).text('Reporte de Órdenes de Servicio', { align: 'center' });
      doc.moveDown();
      
      // Definir diseño de tabla
      const tableTop = 100;
      const tableLeft = 50;
      const rowHeight = 30;
      const colWidths = [80, 100, 80, 80, 80, 80, 120];
      
      // Dibujar fila de encabezado
      doc.fontSize(10).font('Helvetica-Bold');
      let currentLeft = tableLeft;
      
      ['Código', 'Cliente', 'Tipo', 'Estado', 'Técnico', 'Creado', 'Problema'].forEach((header, i) => {
        doc.text(header, currentLeft, tableTop, { width: colWidths[i], align: 'left' });
        currentLeft += colWidths[i];
      });
      
      // Dibujar filas
      doc.font('Helvetica');
      let currentTop = tableTop + rowHeight;
      
      orders.slice(0, 15).forEach((order, rowIndex) => {
        currentLeft = tableLeft;
        
        // Agregar página si es necesario
        if (currentTop > 500) {
          doc.addPage();
          currentTop = 100;
          
          // Redibujar encabezado
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
        
        // Dibujar datos de fila
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
      
      // Nota si hay más órdenes de las mostradas
      if (orders.length > 15) {
        doc.moveDown();
        doc.text(`... y ${orders.length - 15} órdenes más. Exportar a Excel para ver todas.`, { align: 'center' });
      }
      
      // Agregar pie de página con fecha
      doc.fontSize(8).text(
        `Reporte generado el ${formatDate(new Date())}`, 
        50, 
        doc.page.height - 50, 
        { align: 'center' }
      );
      
      // Finalizar y terminar respuesta
      doc.end();
    }
  } catch (error) {
    console.error('Error exporting orders:', error);
    // Si los encabezados ya fueron enviados, no podemos enviar respuesta JSON
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
 * Función auxiliar para traducir códigos de estado a español
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
 * Función auxiliar para formatear fechas
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
