/**
 * Middleware de Rate Limiting
 * Previene abuso de la API limitando número de requests por IP
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * Middleware bypass para desarrollo
 * En desarrollo, no aplica rate limiting
 */
const bypassRateLimit = (req, res, next) => next();

/**
 * Rate limiter general para toda la API
 */
const limiterGeneral = config.server.isDevelopment 
  ? bypassRateLimit 
  : rateLimit({
      windowMs: config.rateLimit.windowMs, // Ventana de tiempo (15 min por defecto)
      max: config.rateLimit.max, // Máximo de requests por ventana (100 por defecto)
      message: {
        success: false,
        message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde'
      },
      standardHeaders: true, // Retorna info en headers `RateLimit-*`
      legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
      skipSuccessfulRequests: false, // Contar requests exitosas
      skipFailedRequests: false // Contar requests fallidas
    });

/**
 * Rate limiter estricto para endpoints de autenticación
 * Previene ataques de fuerza bruta
 */
const limiterAuth = config.server.isDevelopment 
  ? bypassRateLimit 
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // Solo 5 intentos
      message: {
        success: false,
        message: 'Demasiados intentos de inicio de sesión, intente más tarde'
      },
      skipSuccessfulRequests: true // No contar intentos exitosos
    });

/**
 * Rate limiter para creación de recursos
 * Previene spam de creación de datos
 */
const limiterCreacion = config.server.isDevelopment 
  ? bypassRateLimit 
  : rateLimit({
      windowMs: 60 * 1000, // 1 minuto
      max: 10, // 10 creaciones por minuto
      message: {
        success: false,
        message: 'Está creando recursos muy rápido, espere un momento'
      }
    });

/**
 * Rate limiter específico para operaciones de pago
 * Más restrictivo por ser operación crítica financiera
 */
const limiterPagos = config.server.isDevelopment 
  ? bypassRateLimit 
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 10, // Máximo 10 pagos por ventana
      message: {
        success: false,
        message: 'Demasiadas operaciones de pago, por favor intente más tarde'
      },
      skipSuccessfulRequests: false
    });

/**
 * Rate limiter para creación de créditos
 */
const limiterCreditos = config.server.isDevelopment 
  ? bypassRateLimit 
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 15, // Máximo 15 créditos por ventana
      message: {
        success: false,
        message: 'Demasiadas operaciones de crédito, por favor intente más tarde'
      }
    });

/**
 * Rate limiter para creación de ventas
 */
const limiterVentas = config.server.isDevelopment 
  ? bypassRateLimit 
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 30, // Máximo 30 ventas por ventana
      message: {
        success: false,
        message: 'Demasiadas operaciones de venta, por favor intente más tarde'
      }
    });

/**
 * Rate limiter para anulaciones
 * Muy restrictivo por ser operación delicada
 */
const limiterAnulacion = config.server.isDevelopment 
  ? bypassRateLimit 
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // Máximo 5 anulaciones por ventana
      message: {
        success: false,
        message: 'Demasiadas operaciones de anulación, por favor intente más tarde'
      },
      skipSuccessfulRequests: false
    });

/**
 * Rate limiter para eliminaciones (soft delete)
 * Restrictivo por ser operación delicada
 */
const limiterEliminacion = config.server.isDevelopment 
  ? bypassRateLimit 
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 10, // Máximo 10 eliminaciones por ventana
      message: {
        success: false,
        message: 'Demasiadas operaciones de eliminación, por favor intente más tarde'
      }
    });

module.exports = {
  limiterGeneral,
  limiterAuth,
  limiterCreacion,
  limiterPagos,
  limiterCreditos,
  limiterVentas,
  limiterAnulacion,
  limiterEliminacion
};
