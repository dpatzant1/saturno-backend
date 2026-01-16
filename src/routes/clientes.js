/**
 * Rutas de Clientes
 * Define los endpoints para la gestión de clientes con sistema de papelera
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const clientesController = require('../controllers/clientesController');
const { validarRequest } = require('../middlewares/validarRequest');
const { verificarToken, soloAdministrador, administradorOVendedor } = require('../middlewares');
const { esUUID } = require('../utils/validaciones');

/**
 * Validaciones para crear cliente
 */
const validacionCrear = [
  body('nombre')
    .notEmpty().withMessage('El nombre es requerido')
    .isString().withMessage('El nombre debe ser texto')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  
  body('apellido')
    .optional()
    .isString().withMessage('El apellido debe ser texto')
    .trim()
    .isLength({ max: 100 }).withMessage('El apellido no puede exceder 100 caracteres'),
  
  body('telefono')
    .optional()
    .isString().withMessage('El teléfono debe ser texto')
    .trim()
    .isLength({ max: 20 }).withMessage('El teléfono no puede exceder 20 caracteres'),
  
  body('correo')
    .optional()
    .isEmail().withMessage('El correo electrónico no es válido')
    .trim()
    .isLength({ max: 150 }).withMessage('El correo no puede exceder 150 caracteres'),
  
  body('direccion')
    .optional()
    .isString().withMessage('La dirección debe ser texto')
    .trim(),
  
  body('tipo_cliente')
    .notEmpty().withMessage('El tipo de cliente es requerido')
    .isIn(['CONTADO', 'CREDITO']).withMessage('El tipo de cliente debe ser CONTADO o CREDITO'),
  
  body('limite_credito')
    .if(body('tipo_cliente').equals('CREDITO'))
    .notEmpty().withMessage('El límite de crédito es requerido para clientes de tipo CREDITO')
    .isFloat({ min: 0 }).withMessage('El límite de crédito debe ser un número positivo'),
  
  body('limite_credito')
    .if(body('tipo_cliente').equals('CONTADO'))
    .not().exists().withMessage('Los clientes de tipo CONTADO no deben tener límite de crédito'),
  
  validarRequest
];

/**
 * Validaciones para actualizar cliente
 */
const validacionActualizar = [
  param('id')
    .custom(esUUID).withMessage('El ID del cliente debe ser un UUID válido'),
  
  body('nombre')
    .optional()
    .isString().withMessage('El nombre debe ser texto')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  
  body('apellido')
    .optional()
    .isString().withMessage('El apellido debe ser texto')
    .trim()
    .isLength({ max: 100 }).withMessage('El apellido no puede exceder 100 caracteres'),
  
  body('telefono')
    .optional()
    .isString().withMessage('El teléfono debe ser texto')
    .trim()
    .isLength({ max: 20 }).withMessage('El teléfono no puede exceder 20 caracteres'),
  
  body('correo')
    .optional()
    .isEmail().withMessage('El correo electrónico no es válido')
    .trim()
    .isLength({ max: 150 }).withMessage('El correo no puede exceder 150 caracteres'),
  
  body('direccion')
    .optional()
    .isString().withMessage('La dirección debe ser texto')
    .trim(),
  
  body('tipo_cliente')
    .optional()
    .isIn(['CONTADO', 'CREDITO']).withMessage('El tipo de cliente debe ser CONTADO o CREDITO'),
  
  body('limite_credito')
    .optional()
    .isFloat({ min: 0 }).withMessage('El límite de crédito debe ser un número positivo'),
  
  validarRequest
];

/**
 * Validaciones para parámetros con UUID
 */
const validacionId = [
  param('id')
    .custom(esUUID).withMessage('El ID del cliente debe ser un UUID válido'),
  
  validarRequest
];

/**
 * Validaciones para parámetro de tipo
 */
const validacionTipo = [
  param('tipo')
    .isIn(['CONTADO', 'CREDITO', 'contado', 'credito'])
    .withMessage('El tipo debe ser CONTADO o CREDITO'),
  
  validarRequest
];

/**
 * Validaciones para búsqueda y filtros
 */
const validacionBusqueda = [
  query('busqueda')
    .optional()
    .isString().withMessage('El término de búsqueda debe ser texto')
    .trim(),
  
  query('tipo_cliente')
    .optional()
    .isIn(['CONTADO', 'CREDITO']).withMessage('El tipo de cliente debe ser CONTADO o CREDITO'),
  
  query('soloActivos')
    .optional()
    .isBoolean().withMessage('soloActivos debe ser un valor booleano'),
  
  validarRequest
];

// ============================================
// RUTAS PÚBLICAS (Lectura - VENDEDOR puede ver)
// ============================================

/**
 * GET /api/clientes
 * Obtener todos los clientes activos
 * Permite búsqueda y filtrado por tipo
 * Acceso: ADMINISTRADOR, VENDEDOR
 */
router.get(
  '/',
  verificarToken,
  administradorOVendedor,
  validacionBusqueda,
  clientesController.obtenerClientes
);

/**
 * GET /api/clientes/papelera
 * Obtener clientes en papelera
 * IMPORTANTE: Debe ir ANTES de /tipo/:tipo y /:id
 * Acceso: Solo ADMINISTRADOR
 */
router.get(
  '/papelera',
  verificarToken,
  soloAdministrador,
  clientesController.obtenerPapelera
);

/**
 * GET /api/clientes/tipo/:tipo
 * Obtener clientes por tipo (CONTADO o CREDITO)
 * IMPORTANTE: Debe ir ANTES de /:id
 * Acceso: ADMINISTRADOR, VENDEDOR
 */
router.get(
  '/tipo/:tipo',
  verificarToken,
  administradorOVendedor,
  validacionTipo,
  clientesController.obtenerPorTipo
);

/**
 * GET /api/clientes/:id
 * Obtener cliente por ID
 * Acceso: ADMINISTRADOR, VENDEDOR
 */
router.get(
  '/:id',
  verificarToken,
  administradorOVendedor,
  validacionId,
  clientesController.obtenerClientePorId
);

/**
 * GET /api/clientes/:id/creditos
 * Obtener historial de créditos de un cliente
 * Acceso: ADMINISTRADOR, VENDEDOR
 */
router.get(
  '/:id/creditos',
  verificarToken,
  administradorOVendedor,
  validacionId,
  clientesController.obtenerHistorialCreditos
);

/**
 * GET /api/clientes/:id/compras
 * Obtener historial de compras/ventas de un cliente
 * Query params: limite (default: 50)
 * Acceso: ADMINISTRADOR, VENDEDOR
 */
router.get(
  '/:id/compras',
  verificarToken,
  administradorOVendedor,
  validacionId,
  clientesController.obtenerHistorialCompras
);

/**
 * GET /api/clientes/:id/deuda
 * Obtener reporte de deuda de un cliente
 * Incluye créditos activos, vencidos, disponibilidad y alertas
 * Acceso: ADMINISTRADOR, VENDEDOR
 */
router.get(
  '/:id/deuda',
  verificarToken,
  administradorOVendedor,
  validacionId,
  clientesController.obtenerReporteDeuda
);

// ============================================
// RUTAS DE ADMINISTRACIÓN (Solo ADMINISTRADOR)
// ============================================

/**
 * POST /api/clientes
 * Crear nuevo cliente
 * Acceso: Solo ADMINISTRADOR
 * Validaciones:
 * - Correo único
 * - Límite de crédito requerido para tipo CREDITO
 * - Límite de crédito no permitido para tipo CONTADO
 */
router.post(
  '/',
  verificarToken,
  soloAdministrador,
  validacionCrear,
  clientesController.crear
);

/**
 * PUT /api/clientes/:id
 * Actualizar cliente
 * Acceso: Solo ADMINISTRADOR
 */
router.put(
  '/:id',
  verificarToken,
  soloAdministrador,
  validacionActualizar,
  clientesController.actualizar
);

/**
 * PATCH /api/clientes/:id/activar
 * Activar cliente
 * Acceso: Solo ADMINISTRADOR
 */
router.patch(
  '/:id/activar',
  verificarToken,
  soloAdministrador,
  validacionId,
  clientesController.activar
);

/**
 * PATCH /api/clientes/:id/desactivar
 * Desactivar cliente
 * Acceso: Solo ADMINISTRADOR
 */
router.patch(
  '/:id/desactivar',
  verificarToken,
  soloAdministrador,
  validacionId,
  clientesController.desactivar
);

/**
 * DELETE /api/clientes/:id
 * Mover cliente a papelera (soft delete)
 * Acceso: Solo ADMINISTRADOR
 * VALIDACIONES CRÍTICAS:
 * - Bloquea si tiene créditos activos o vencidos
 * - Bloquea si tiene ventas recientes (últimos 30 días)
 */
router.delete(
  '/:id',
  verificarToken,
  soloAdministrador,
  validacionId,
  clientesController.moverPapelera
);

/**
 * PATCH /api/clientes/:id/restaurar
 * Restaurar cliente desde papelera
 * Acceso: Solo ADMINISTRADOR
 */
router.patch(
  '/:id/restaurar',
  verificarToken,
  soloAdministrador,
  validacionId,
  clientesController.restaurarDePapelera
);

/**
 * DELETE /api/clientes/:id/permanente
 * Eliminar cliente permanentemente (hard delete)
 * Acceso: Solo ADMINISTRADOR
 * ADVERTENCIA: Esta acción es irreversible
 * VALIDACIÓN: Solo permite si NO tiene ventas ni créditos
 */
router.delete(
  '/:id/permanente',
  verificarToken,
  soloAdministrador,
  validacionId,
  clientesController.eliminarPermanentemente
);

module.exports = router;
