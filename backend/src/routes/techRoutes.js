/**
 * Technical operations routes for FixTrack system
 * Handles routes for technicians to manage their assigned orders
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const techController = require('../controllers/techController');
const { authenticate, hasRole, isTechnician, requirePasswordChange } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create directory for order attachments if it doesn't exist
    const orderDir = path.join('src/public/uploads/orders', req.params.id);
    fs.mkdirSync(orderDir, { recursive: true });
    cb(null, orderDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filter allowed file types
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

// Setup upload middleware
const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(requirePasswordChange);

// Route to get all orders assigned to the technician
router.get('/assigned-orders', 
  hasRole(['technician', 'admin']), 
  techController.getAssignedOrders
);

// Route to get all orders (not just assigned ones)
router.get('/all-orders', 
  hasRole(['technician', 'admin']), 
  techController.getAllOrders
);

// Route to update order status
router.put('/orders/:id/status', 
  hasRole(['technician', 'admin']), 
  techController.updateOrderStatus
);

// Route to self-assign an order
router.put('/orders/:id/self-assign', 
  hasRole(['technician', 'admin']), 
  techController.selfAssignOrder
);

// Route to reassign an order
router.put('/orders/:id/reassign', 
  hasRole(['technician', 'admin']), 
  techController.reassignOrder
);

// Route to upload attachments to an order
router.post('/orders/:id/attachments', 
  hasRole(['technician', 'admin']), 
  upload.single('file'), 
  techController.addOrderAttachment
);

// Route to add comments to an order
router.post('/orders/:id/comments', 
  hasRole(['technician', 'admin']), 
  techController.addOrderComment
);

// Error handler for multer
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
