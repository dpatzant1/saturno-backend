/**
 * Rutas de Movimientos de Inventario
 * Define los endpoints para la gestión de movimientos de stock
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const movimientosController = require('../controllers/movimientosController');
const { validarRequest } = require('../middlewares/validarRequest');
const { verificarToken, soloAdministrador, administradorOVendedor } = require('../middlewares');
const { esUUID } = require('../utils/validaciones');

/**
 * Validaciones para crear movimiento
 */
const validacionCrearMovimiento = [
  body('id_producto')
    .notEmpty().withMessage('El ID del producto es requerido')
    .custom(esUUID).withMessage('El ID del producto debe ser un UUID válido'),
  
  body('tipo_movimiento')
    .notEmpty().withMessage('El tipo de movimiento es requerido')
    .isIn(['ENTRADA', 'SALIDA']).withMessage('El tipo de movimiento debe ser ENTRADA o SALIDA'),
  
  body('cantidad')
    .notEmpty().withMessage('La cantidad es requerida')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser un número entero mayor a 0'),
  
  body('motivo')
    .notEmpty().withMessage('El motivo es requerido')
    .isString().withMessage('El motivo debe ser texto')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('El motivo debe tener entre 1 y 50 caracteres'),
  
  body('referencia')
    .optional()
    .isString().withMessage('La referencia debe ser texto')
    .trim()
    .isLength({ max: 100 }).withMessage('La referencia no puede exceder 100 caracteres'),
  
  validarRequest
];

/**
 * Validaciones para crear entrada
 */
const validacionCrearEntrada = [
  body('id_producto')
    .notEmpty().withMessage('El ID del producto es requerido')
    .custom(esUUID).withMessage('El ID del producto debe ser un UUID válido'),
  
  body('cantidad')
    .notEmpty().withMessage('La cantidad es requerida')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser un número entero mayor a 0'),
  
  body('motivo')
    .notEmpty().withMessage('El motivo es requerido')
    .isString().withMessage('El motivo debe ser texto')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('El motivo debe tener entre 1 y 50 caracteres'),
  
  body('referencia')
    .optional()
    .isString().withMessage('La referencia debe ser texto')
    .trim()
    .isLength({ max: 100 }).withMessage('La referencia no puede exceder 100 caracteres'),
  
  validarRequest
];

/**
 * Validaciones para crear salida
 */
const validacionCrearSalida = [
  body('id_producto')
    .notEmpty().withMessage('El ID del producto es requerido')
    .custom(esUUID).withMessage('El ID del producto debe ser un UUID válido'),
  
  body('cantidad')
    .notEmpty().withMessage('La cantidad es requerida')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser un número entero mayor a 0'),
  
  body('motivo')
    .notEmpty().withMessage('El motivo es requerido')
    .isString().withMessage('El motivo debe ser texto')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('El motivo debe tener entre 1 y 50 caracteres'),
  
  body('referencia')
    .optional()
    .isString().withMessage('La referencia debe ser texto')
    .trim()
    .isLength({ max: 100 }).withMessage('La referencia no puede exceder 100 caracteres'),
  
  validarRequest
];

/**
 * Validaciones para ajuste de inventario
 */
const validacionAjusteInventario = [
  body('id_producto')
    .notEmpty().withMessage('El ID del producto es requerido')
    .custom(esUUID).withMessage('El ID del producto debe ser un UUID válido'),
  
  body('cantidad_objetivo')
    .notEmpty().withMessage('La cantidad objetivo es requerida')
    .isInt({ min: 0 }).withMessage('La cantidad objetivo debe ser un número entero no negativo'),
  
  body('motivo')
    .optional()
    .isString().withMessage('El motivo debe ser texto')
    .trim()
    .isLength({ max: 50 }).withMessage('El motivo no puede exceder 50 caracteres'),
  
  body('referencia')
    .optional()
    .isString().withMessage('La referencia debe ser texto')
    .trim()
    .isLength({ max: 100 }).withMessage('La referencia no puede exceder 100 caracteres'),
  
  validarRequest
];

/**
 * Validaciones para parámetros con UUID
 */
const validacionId = [
  param('id')
    .custom(esUUID).withMessage('El ID debe ser un UUID válido'),
  
  validarRequest
];

/**
 * Validaciones para parámetros de producto
 */
const validacionIdProducto = [
  param('id_producto')
    .custom(esUUID).withMessage('El ID del producto debe ser un UUID válido'),
  
  validarRequest
];

/**
 * Validaciones para filtros de búsqueda
 */
const validacionFiltros = [
  query('id_producto')
    .optional()
    .custom(esUUID).withMessage('El ID del producto debe ser un UUID válido'),
  
  query('tipo_movimiento')
    .optional()
    .isIn(['ENTRADA', 'SALIDA']).withMessage('El tipo de movimiento debe ser ENTRADA o SALIDA'),
  
  query('fecha_desde')
    .optional()
    .isISO8601().withMessage('fecha_desde debe ser una fecha válida en formato ISO8601'),
  
  query('fecha_hasta')
    .optional()
    .isISO8601().withMessage('fecha_hasta debe ser una fecha válida en formato ISO8601'),
  
  query('limite')
    .optional()
    .isInt({ min: 1, max: 500 }).withMessage('El límite debe ser un número entre 1 y 500'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 }).withMessage('El offset debe ser un número mayor o igual a 0'),
  
  validarRequest
];

/**
 * Validaciones para reporte por fecha
 */
const validacionReporteFecha = [
  query('fecha_desde')
    .notEmpty().withMessage('La fecha desde es requerida')
    .isISO8601().withMessage('fecha_desde debe ser una fecha válida en formato ISO8601'),
  
  query('fecha_hasta')
    .notEmpty().withMessage('La fecha hasta es requerida')
    .isISO8601().withMessage('fecha_hasta debe ser una fecha válida en formato ISO8601'),
  
  validarRequest
];

/**
 * Validaciones para kardex
 */
const validacionKardex = [
  param('id_producto')
    .custom(esUUID).withMessage('El ID del producto debe ser un UUID válido'),
  
  query('fecha_desde')
    .optional()
    .isISO8601().withMessage('fecha_desde debe ser una fecha válida en formato ISO8601'),
  
  query('fecha_hasta')
    .optional()
    .isISO8601().withMessage('fecha_hasta debe ser una fecha válida en formato ISO8601'),
  
  validarRequest
];

// ============================================
// RUTAS DE CREACIÓN (Solo ADMINISTRADOR)
// ============================================

/**
 * POST /api/movimientos
 * Registra un movimiento de inventario (genérico)
 * Acceso: Solo ADMINISTRADOR
 */
router.post(
  '/',
  verificarToken,
  soloAdministrador,
  validacionCrearMovimiento,
  movimientosController.registrarMovimiento
);

/**
 * POST /api/movimientos/entrada
 * Registra una entrada de productos
 * Acceso: Solo ADMINISTRADOR
 */
router.post(
  '/entrada',
  verificarToken,
  soloAdministrador,
  validacionCrearEntrada,
  movimientosController.registrarEntrada
);

/**
 * POST /api/movimientos/salida
 * Registra una salida de productos
 * VALIDACIÓN: Verifica stock disponible
 * Acceso: Solo ADMINISTRADOR
 */
router.post(
  '/salida',
  verificarToken,
  soloAdministrador,
  validacionCrearSalida,
  movimientosController.registrarSalida
);

/**
 * POST /api/movimientos/ajuste
 * Ajusta el stock de un producto a una cantidad específica
 * Acceso: Solo ADMINISTRADOR
 */
router.post(
  '/ajuste',
  verificarToken,
  soloAdministrador,
  validacionAjusteInventario,
  movimientosController.ajustarInventario
);

// ============================================
// RUTAS DE CONSULTA (ADMINISTRADOR y VENDEDOR)
// ============================================

/**
 * GET /api/movimientos/reporte
 * Obtiene reporte de movimientos por período
 * IMPORTANTE: Debe ir ANTES de /:id
 * Acceso: ADMINISTRADOR, VENDEDOR
 */
router.get(
  '/reporte',
  verificarToken,
  administradorOVendedor,
  validacionReporteFecha,
  movimientosController.obtenerReportePorFecha
);

/**
 * GET /api/movimientos/producto/:id_producto/historial
 * Obtiene historial de movimientos de un producto
 * Acceso: ADMINISTRADOR, VENDEDOR
 */
router.get(
  '/producto/:id_producto/historial',
  verificarToken,
  administradorOVendedor,
  validacionIdProducto,
  movimientosController.obtenerHistorialProducto
);

/**
 * GET /api/movimientos/producto/:id_producto/estadisticas
 * Obtiene estadísticas de movimientos de un producto
 * Acceso: ADMINISTRADOR, VENDEDOR
 */
router.get(
  '/producto/:id_producto/estadisticas',
  verificarToken,
  administradorOVendedor,
  validacionIdProducto,
  movimientosController.obtenerEstadisticasProducto
);

/**
 * GET /api/movimientos/producto/:id_producto/kardex
 * Obtiene el kardex (registro contable) de un producto
 * Acceso: ADMINISTRADOR, VENDEDOR
 */
router.get(
  '/producto/:id_producto/kardex',
  verificarToken,
  administradorOVendedor,
  validacionKardex,
  movimientosController.obtenerKardex
);

/**
 * GET /api/movimientos
 * Obtiene todos los movimientos con filtros
 * Acceso: ADMINISTRADOR, VENDEDOR
 */
router.get(
  '/',
  verificarToken,
  administradorOVendedor,
  validacionFiltros,
  movimientosController.obtenerMovimientos
);

/**
 * GET /api/movimientos/:id
 * Obtiene un movimiento específico por ID
 * Acceso: ADMINISTRADOR, VENDEDOR
 */
router.get(
  '/:id',
  verificarToken,
  administradorOVendedor,
  validacionId,
  movimientosController.obtenerMovimientoPorId
);

module.exports = router;
