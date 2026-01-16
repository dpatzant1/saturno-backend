/**
 * Rutas de Créditos y Pagos
 * Define endpoints para la gestión de créditos y cobranza
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validarRequest } = require('../middlewares/validarRequest');
const { verificarToken, soloAdministrador, administradorOVendedor } = require('../middlewares');
const creditosController = require('../controllers/creditosController');
const { ESTADOS_CREDITO } = require('../services/creditosService');

// ===== VALIDACIONES =====

// Validación para crear crédito
const validacionCrearCredito = [
  body('id_cliente')
    .isUUID()
    .withMessage('El id_cliente debe ser un UUID válido'),
  
  body('monto_total')
    .isFloat({ min: 0.01 })
    .withMessage('El monto_total debe ser un número mayor a 0'),
  
  body('fecha_inicio')
    .isISO8601()
    .withMessage('La fecha_inicio debe tener formato ISO8601 (YYYY-MM-DD)'),
  
  body('fecha_vencimiento')
    .isISO8601()
    .withMessage('La fecha_vencimiento debe tener formato ISO8601 (YYYY-MM-DD)'),
  
  validarRequest
];

// Validación para registrar pago
const validacionRegistrarPago = [
  param('id')
    .isUUID()
    .withMessage('El ID del crédito debe ser un UUID válido'),
  
  body('monto_pagado')
    .isFloat({ min: 0.01 })
    .withMessage('El monto_pagado debe ser un número mayor a 0'),
  
  body('metodo_pago')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('El método de pago no puede exceder 50 caracteres'),
  
  body('observaciones')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las observaciones no pueden exceder 500 caracteres'),
  
  validarRequest
];

// Validación para obtener por ID
const validacionId = [
  param('id')
    .isUUID()
    .withMessage('El ID debe ser un UUID válido'),
  
  validarRequest
];

// Validación para ID de cliente
const validacionIdCliente = [
  param('id_cliente')
    .isUUID()
    .withMessage('El id_cliente debe ser un UUID válido'),
  
  validarRequest
];

// Validación para filtros
const validacionFiltros = [
  query('id_cliente')
    .optional()
    .isUUID()
    .withMessage('El id_cliente debe ser un UUID válido'),
  
  query('estado')
    .optional()
    .isIn([ESTADOS_CREDITO.ACTIVO, ESTADOS_CREDITO.PAGADO, ESTADOS_CREDITO.VENCIDO])
    .withMessage(`El estado debe ser ${ESTADOS_CREDITO.ACTIVO}, ${ESTADOS_CREDITO.PAGADO} o ${ESTADOS_CREDITO.VENCIDO}`),
  
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

// Validación para días de alerta
const validacionDiasAlerta = [
  query('dias')
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage('Los días deben ser un número entre 1 y 90'),
  
  validarRequest
];

// ===== RUTAS =====

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/creditos/dashboard/cobranza - Dashboard (debe ir antes de /:id)
router.get(
  '/dashboard/cobranza',
  administradorOVendedor,
  creditosController.obtenerDashboardCobranza
);

// GET /api/creditos/reportes/cartera-vencida - Reporte cartera vencida
router.get(
  '/reportes/cartera-vencida',
  administradorOVendedor,
  creditosController.obtenerReporteCarteraVencida
);

// GET /api/creditos/alertas/proximos-vencer - Alertas
router.get(
  '/alertas/proximos-vencer',
  administradorOVendedor,
  validacionDiasAlerta,
  creditosController.obtenerCreditosProximosAVencer
);

// GET /api/creditos/activos - Créditos activos
router.get(
  '/activos',
  administradorOVendedor,
  creditosController.obtenerCreditosActivos
);

// GET /api/creditos/vencidos - Créditos vencidos
router.get(
  '/vencidos',
  administradorOVendedor,
  creditosController.obtenerCreditosVencidos
);

// GET /api/creditos/cliente/:id_cliente - Créditos por cliente
router.get(
  '/cliente/:id_cliente',
  administradorOVendedor,
  validacionIdCliente,
  creditosController.obtenerCreditosPorCliente
);

// POST /api/creditos - Crear crédito
router.post(
  '/',
  administradorOVendedor,
  validacionCrearCredito,
  creditosController.crearCredito
);

// GET /api/creditos - Listar créditos
router.get(
  '/',
  administradorOVendedor,
  validacionFiltros,
  creditosController.obtenerCreditos
);

// GET /api/creditos/:id - Obtener crédito por ID
router.get(
  '/:id',
  administradorOVendedor,
  validacionId,
  creditosController.obtenerCreditoPorId
);

// POST /api/creditos/:id/pagar - Registrar pago
router.post(
  '/:id/pagar',
  administradorOVendedor,
  validacionRegistrarPago,
  creditosController.registrarPago
);

// GET /api/creditos/:id/pagos - Historial de pagos
router.get(
  '/:id/pagos',
  administradorOVendedor,
  validacionId,
  creditosController.obtenerPagosDeCredito
);

module.exports = router;
