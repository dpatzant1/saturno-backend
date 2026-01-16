/**
 * Rutas de Ventas
 * Define endpoints para la gestión de ventas
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validarRequest } = require('../middlewares/validarRequest');
const { verificarToken, soloAdministrador, administradorOVendedor } = require('../middlewares');
const ventasController = require('../controllers/ventasController');
const { TIPOS_VENTA, ESTADOS_VENTA } = require('../services/ventasService');

// ===== VALIDACIONES =====

// Validación para crear venta al CONTADO
const validacionCrearContado = [
  body('id_cliente')
    .isUUID()
    .withMessage('El id_cliente debe ser un UUID válido'),
  
  body('productos')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un producto'),
  
  body('productos.*.id_producto')
    .isUUID()
    .withMessage('Cada id_producto debe ser un UUID válido'),
  
  body('productos.*.cantidad')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser un número entero mayor a 0'),
  
  body('productos.*.precio_unitario')
    .isFloat({ min: 0 })
    .withMessage('El precio_unitario debe ser un número mayor o igual a 0'),
  
  validarRequest
];

// Validación para crear venta a CRÉDITO
const validacionCrearCredito = [
  body('id_cliente')
    .isUUID()
    .withMessage('El id_cliente debe ser un UUID válido'),
  
  body('productos')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un producto'),
  
  body('productos.*.id_producto')
    .isUUID()
    .withMessage('Cada id_producto debe ser un UUID válido'),
  
  body('productos.*.cantidad')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser un número entero mayor a 0'),
  
  body('productos.*.precio_unitario')
    .isFloat({ min: 0 })
    .withMessage('El precio_unitario debe ser un número mayor o igual a 0'),
  
  body('dias_credito')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Los días de crédito deben ser un número entre 1 y 365'),
  
  validarRequest
];

// Validación para anular venta
const validacionAnular = [
  param('id')
    .isUUID()
    .withMessage('El ID de la venta debe ser un UUID válido'),
  
  body('motivo')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('El motivo no puede exceder 500 caracteres'),
  
  validarRequest
];

// Validación para obtener por ID
const validacionId = [
  param('id')
    .isUUID()
    .withMessage('El ID debe ser un UUID válido'),
  
  validarRequest
];

// Validación para filtros de listado
const validacionFiltros = [
  query('id_cliente')
    .optional()
    .isUUID()
    .withMessage('El id_cliente debe ser un UUID válido'),
  
  query('id_usuario')
    .optional()
    .isUUID()
    .withMessage('El id_usuario debe ser un UUID válido'),
  
  query('tipo_venta')
    .optional()
    .isIn([TIPOS_VENTA.CONTADO, TIPOS_VENTA.CREDITO])
    .withMessage(`El tipo_venta debe ser ${TIPOS_VENTA.CONTADO} o ${TIPOS_VENTA.CREDITO}`),
  
  query('estado')
    .optional()
    .isIn([ESTADOS_VENTA.ACTIVA, ESTADOS_VENTA.ANULADA])
    .withMessage(`El estado debe ser ${ESTADOS_VENTA.ACTIVA} o ${ESTADOS_VENTA.ANULADA}`),
  
  query('fecha_desde')
    .optional()
    .isISO8601()
    .withMessage('La fecha_desde debe tener formato ISO8601 (YYYY-MM-DD)'),
  
  query('fecha_hasta')
    .optional()
    .isISO8601()
    .withMessage('La fecha_hasta debe tener formato ISO8601 (YYYY-MM-DD)'),
  
  query('limite')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El offset debe ser un número mayor o igual a 0'),
  
  validarRequest
];

// Validación para reporte por período
const validacionReporte = [
  query('fecha_desde')
    .isISO8601()
    .withMessage('La fecha_desde es requerida y debe tener formato ISO8601 (YYYY-MM-DD)'),
  
  query('fecha_hasta')
    .isISO8601()
    .withMessage('La fecha_hasta es requerida y debe tener formato ISO8601 (YYYY-MM-DD)'),
  
  validarRequest
];

// Validación para productos más vendidos
const validacionProductosMasVendidos = [
  query('fecha_desde')
    .optional()
    .isISO8601()
    .withMessage('La fecha_desde debe tener formato ISO8601 (YYYY-MM-DD)'),
  
  query('fecha_hasta')
    .optional()
    .isISO8601()
    .withMessage('La fecha_hasta debe tener formato ISO8601 (YYYY-MM-DD)'),
  
  query('limite')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('El límite debe ser un número entre 1 y 50'),
  
  validarRequest
];

// ===== RUTAS =====

// Todas las rutas requieren autenticación
router.use(verificarToken);

// POST /api/ventas/contado - Crear venta al CONTADO
router.post(
  '/contado',
  administradorOVendedor,
  validacionCrearContado,
  ventasController.crearVentaContado
);

// POST /api/ventas/credito - Crear venta a CRÉDITO
router.post(
  '/credito',
  administradorOVendedor,
  validacionCrearCredito,
  ventasController.crearVentaCredito
);

// GET /api/ventas/dashboard/dia - Dashboard del día (debe ir antes de /:id)
router.get(
  '/dashboard/dia',
  administradorOVendedor,
  ventasController.obtenerDashboardDia
);

// GET /api/ventas/reporte - Reporte por período
router.get(
  '/reporte',
  administradorOVendedor,
  validacionReporte,
  ventasController.obtenerReportePorPeriodo
);

// GET /api/ventas/productos/mas-vendidos - Productos más vendidos
router.get(
  '/productos/mas-vendidos',
  administradorOVendedor,
  validacionProductosMasVendidos,
  ventasController.obtenerProductosMasVendidos
);

// GET /api/ventas/cliente/:id_cliente - Ventas por cliente
router.get(
  '/cliente/:id_cliente',
  administradorOVendedor,
  validacionId,
  ventasController.obtenerVentasPorCliente
);

// GET /api/ventas/usuario/:id_usuario - Ventas por usuario/vendedor
router.get(
  '/usuario/:id_usuario',
  administradorOVendedor,
  validacionId,
  ventasController.obtenerVentasPorUsuario
);

// GET /api/ventas - Listar ventas con filtros
router.get(
  '/',
  administradorOVendedor,
  validacionFiltros,
  ventasController.obtenerVentas
);

// GET /api/ventas/:id - Obtener venta por ID
router.get(
  '/:id',
  administradorOVendedor,
  validacionId,
  ventasController.obtenerVentaPorId
);

// POST /api/ventas/:id/anular - Anular venta
router.post(
  '/:id/anular',
  soloAdministrador,
  validacionAnular,
  ventasController.anularVenta
);

module.exports = router;
