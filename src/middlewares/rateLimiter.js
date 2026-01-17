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
      max: config.rateLimit.max, // Máximo de requests por ventana
      message: {
        success: false,
        message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde'
      },
      standardHeaders: true, // Retorna info en headers `RateLimit-*`
      legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
      skipSuccessfulRequests: false, // Contar requests exitosas
      skipFailedRequests: false, // Contar requests fallidas
      // Configuración para Render y otros servicios de hosting
      trustProxy: true, // Confiar en headers de proxy (X-Forwarded-For)
      keyGenerator: (req) => {
        // Usar la IP real del cliente, no la del proxy de Render
        return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      }
    });

/**
 * Rate limiter estricto para endpoints de autenticación
 * Previene ataques de fuerza bruta
 */
const limiterAuth = config.server.isDevelopment 
  ? bypassRateLimit 
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 10, // 10 intentos (aumentado para evitar bloqueos legítimos)
      message: {
        success: false,
        message: 'Demasiados intentos de inicio de sesión, intente más tarde'
      },
      skipSuccessfulRequests: true, // No contar intentos exitosos
      trustProxy: true
    });

/**
 * Rate limiter para creación de recursos
 * Previene spam de creación de datos
 */
const limiterCreacion = config.server.isDevelopment 
  ? bypassRateLimit 
  : rateLimit({
      windowMs: 60 * 1000, // 1 minuto
      max: 30, // 30 creaciones por minuto (aumentado)
      message: {
        success: false,
        message: 'Está creando recursos muy rápido, espere un momento'
      },
      trustProxy: true
    });

/**
 * Rate limiter específico para operaciones de pago
 * Más restrictivo por ser operación crítica financiera
 */
const limiterPagos = config.server.isDevelopment 
  ? bypassRateLimit 
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 50, // Máximo 50 pagos por ventana (aumentado)
      message: {
        success: false,
        message: 'Demasiadas operaciones de pago, por favor intente más tarde'
      },
      skipSuccessfulRequests: false,
      trustProxy: true
    });

/**
 * Rate limiter para creación de créditos
 */
const limiterCreditos = config.server.isDevelopment 
  ? bypassRateLimit 
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 50, // Máximo 50 créditos por ventana (aumentado)
      message: {
        success: false,
        message: 'Demasiadas operaciones de crédito, por favor intente más tarde'
      },
      trustProxy: true
    });

/**
 * Rate limiter para creación de ventas
 */
const limiterVentas = config.server.isDevelopment 
  ? bypassRateLimit 
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // Máximo 100 ventas por ventana (aumentado)
      message: {
        success: false,
        message: 'Demasiadas operaciones de venta, por favor intente más tarde'
      },
      trustProxy: true
    });

/**
 * Rate limiter para anulaciones
 * Muy restrictivo por ser operación delicada
 */
const limiterAnulacion = config.server.isDevelopment 
  ? bypassRateLimit 
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 20, // Máximo 20 anulaciones por ventana (aumentado)
      message: {
        success: false,
        message: 'Demasiadas operaciones de anulación, por favor intente más tarde'
      },
      skipSuccessfulRequests: false,
      trustProxy: true
    });

/**
 * Rate limiter para eliminaciones (soft delete)
 * Restrictivo por ser operación delicada
 */
const limiterEliminacion = config.server.isDevelopment 
  ? bypassRateLimit 
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 30, // Máximo 30 eliminaciones por ventana (aumentado)
      message: {
        success: false,
        message: 'Demasiadas operaciones de eliminación, por favor intente más tarde'
      },
      trustProxy: true
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
