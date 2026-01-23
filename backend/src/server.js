/**
 * FixTrack - Punto de entrada principal del servidor
 * Este es el archivo principal de la aplicación que configura el servidor Express
 * y conecta todos los middleware y rutas.
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');

// Cargar variables de entorno
dotenv.config();

// Importar conexión a base de datos para asegurar su inicialización
const sequelize = require('./config/database');

// Importar rutas
const routes = require('./routes/index');

// Importar configuración
const config = require('./config/config');

// Crear aplicación Express
const app = express();

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Aplicar middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Usar rutas con prefijo API
app.use('/api', routes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Configurar puerto e iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`🚀 FixTrack API ejecutándose en puerto ${PORT}`);
  console.log(`===========================================`);
});

// Manejar rechazos de promesas no controlados
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED PROMISE REJECTION:', err);
});

module.exports = app; // Exportar para pruebas
