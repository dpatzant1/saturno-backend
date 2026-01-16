/**
 * Middleware de manejo de errores global
 * Captura y formatea todos los errores de la aplicación
 */

const config = require('../config');

/**
 * Clase de error personalizado para errores de la aplicación
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de manejo de errores global
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error en consola
  console.error('❌ Error capturado:', {
    message: err.message,
    statusCode: err.statusCode || 500,
    path: req.path,
    method: req.method,
    ...(config.server.isDevelopment && { stack: err.stack })
  });

  // Error de validación de express-validator
  if (err.name === 'ValidationError') {
    error.message = 'Error de validación';
    error.statusCode = 400;
  }

  // Error de Supabase
  if (err.code && err.code.startsWith('PGRST')) {
    error.message = 'Error en la base de datos';
    error.statusCode = 500;
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Token inválido';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expirado';
    error.statusCode = 401;
  }

  // Respuesta al cliente
  res.status(error.statusCode || 500).json({
    success: false,
    mensaje: error.message || 'Error interno del servidor',
    message: error.message || 'Error interno del servidor', // Para compatibilidad
    ...(error.details && { details: error.details }),
    ...(config.server.isDevelopment && { stack: err.stack })
  });
};

/**
 * Middleware para rutas no encontradas (404)
 */
const notFound = (req, res, next) => {
  const error = new AppError(`Ruta no encontrada: ${req.originalUrl}`, 404);
  next(error);
};

module.exports = {
  AppError,
  errorHandler,
  notFound
};
