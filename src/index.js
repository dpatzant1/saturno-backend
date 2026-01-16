const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

const config = require('./config');
const { verificarConexion } = require('./config/database');
const { 
  errorHandler, 
  notFound, 
  limiterGeneral, 
  sanitizarRequest 
} = require('./middlewares');
const { iniciarJobs } = require('./jobs/scheduler');

const app = express();

// Seguridad con Helmet
app.use(helmet());

// CORS
app.use(cors(config.cors));

// Rate limiting general
app.use(limiterGeneral);

// Logging
if (config.server.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitización de datos
app.use(sanitizarRequest);

// Rutas de la API
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const categoriasRoutes = require('./routes/categorias');
const productosRoutes = require('./routes/productos');
const movimientosRoutes = require('./routes/movimientos');
const clientesRoutes = require('./routes/clientes');
const ventasRoutes = require('./routes/ventas');
const creditosRoutes = require('./routes/creditos');

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/creditos', creditosRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'API de Gestión de Inventario y Ventas - Carpintería',
    version: '1.0.0',
    status: 'OK',
    environment: config.server.env
  });
});

// Health check
app.get('/health', async (req, res) => {
  const dbStatus = await verificarConexion();
  res.json({
    status: 'OK',
    database: dbStatus ? 'conectada' : 'desconectada',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas (404)
app.use(notFound);

// Manejo de errores global
app.use(errorHandler);

// Puerto
const PORT = config.server.port;

// Iniciar servidor
const iniciarServidor = async () => {
  try {
    // Verificar conexión a la base de datos
    console.log('🔍 Verificando conexión a la base de datos...');
    const dbConectada = await verificarConexion();
    
    if (!dbConectada && config.server.isProduction) {
      console.error('❌ No se pudo conectar a la base de datos en producción. Abortando...');
      process.exit(1);
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ========================================');
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`🚀 Ambiente: ${config.server.env}`);
      console.log(`🚀 URL: http://localhost:${PORT}`);
      console.log('🚀 ========================================');
      console.log('');
      
      // Iniciar jobs automáticos
      iniciarJobs();
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

iniciarServidor();

module.exports = app;
