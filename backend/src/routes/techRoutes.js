/**
 * Rutas de operaciones técnicas para el sistema FixTrack
 * Maneja rutas para que los técnicos gestionen sus órdenes asignadas
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const techController = require('../controllers/techController');
const { authenticate, hasRole, isTechnician, requirePasswordChange } = require('../middleware/auth');

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Crear directorio para adjuntos de orden si no existe
    const orderDir = path.join('src/public/uploads/orders', req.params.id);
    fs.mkdirSync(orderDir, { recursive: true });
    cb(null, orderDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre de archivo único con marca de tiempo y extensión original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filtrar tipos de archivo permitidos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no permitido'), false);
  }
};

// Configurar middleware de subida
const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB
  }
});

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);
router.use(requirePasswordChange);

// Ruta para obtener todas las órdenes asignadas al técnico
router.get('/assigned-orders', 
  hasRole(['technician', 'admin']), 
  techController.getAssignedOrders
);

// Ruta para obtener todas las órdenes (no solo las asignadas)
router.get('/all-orders', 
  hasRole(['technician', 'admin']), 
  techController.getAllOrders
);

// Ruta para actualizar estado de orden
router.put('/orders/:id/status', 
  hasRole(['technician', 'admin']), 
  techController.updateOrderStatus
);

// Ruta para auto-asignar una orden
router.put('/orders/:id/self-assign', 
  hasRole(['technician', 'admin']), 
  techController.selfAssignOrder
);

// Ruta para reasignar una orden
router.put('/orders/:id/reassign', 
  hasRole(['technician', 'admin']), 
  techController.reassignOrder
);

// Ruta para subir adjuntos a una orden
router.post('/orders/:id/attachments', 
  hasRole(['technician', 'admin']), 
  upload.single('file'), 
  techController.addOrderAttachment
);

// Ruta para agregar comentarios a una orden
router.post('/orders/:id/comments', 
  hasRole(['technician', 'admin']), 
  techController.addOrderComment
);

// Manejador de errores para multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'El archivo es demasiado grande (máximo 5MB)'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Error en la carga de archivos: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  next();
});

module.exports = router;
