/**
 * Rutas de Productos
 * Define los endpoints para la gestión de productos con sistema de papelera
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const productosController = require('../controllers/productosController');
const { validarRequest } = require('../middlewares/validarRequest');
const { verificarToken, soloAdministrador, administradorOVendedor } = require('../middlewares');
const { esUUID } = require('../utils/validaciones');

/**
 * Validaciones para crear producto
 */
const validacionCrear = [
  body('id_categoria')
    .notEmpty().withMessage('La categoría es requerida')
    .custom(esUUID).withMessage('El ID de categoría debe ser un UUID válido'),
  
  body('nombre')
    .notEmpty().withMessage('El nombre es requerido')
    .isString().withMessage('El nombre debe ser texto')
    .trim()
    .isLength({ min: 1, max: 150 }).withMessage('El nombre debe tener entre 1 y 150 caracteres'),
  
  body('descripcion')
    .optional()
    .isString().withMessage('La descripción debe ser texto')
    .trim(),
  
  body('precio_venta')
    .notEmpty().withMessage('El precio de venta es requerido')
    .isFloat({ min: 0 }).withMessage('El precio de venta debe ser un número positivo'),
  
  body('unidad_medida')
    .notEmpty().withMessage('La unidad de medida es requerida')
    .isString().withMessage('La unidad de medida debe ser texto')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('La unidad de medida debe tener entre 1 y 50 caracteres'),
  
  body('cantidad_stock')
    .optional()
    .isInt({ min: 0 }).withMessage('La cantidad en stock debe ser un número entero positivo'),
  
  body('stock_minimo')
    .optional()
    .isInt({ min: 0 }).withMessage('El stock mínimo debe ser un número entero positivo'),
  
  validarRequest
];

/**
 * Validaciones para actualizar producto
 */
const validacionActualizar = [
  param('id')
    .custom(esUUID).withMessage('El ID del producto debe ser un UUID válido'),
  
  body('id_categoria')
    .optional()
    .custom(esUUID).withMessage('El ID de categoría debe ser un UUID válido'),
  
  body('nombre')
    .optional()
    .isString().withMessage('El nombre debe ser texto')
    .trim()
    .isLength({ min: 1, max: 150 }).withMessage('El nombre debe tener entre 1 y 150 caracteres'),
  
  body('descripcion')
    .optional()
    .isString().withMessage('La descripción debe ser texto')
    .trim(),
  
  body('precio_venta')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio de venta debe ser un número positivo'),
  
  body('unidad_medida')
    .optional()
    .isString().withMessage('La unidad de medida debe ser texto')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('La unidad de medida debe tener entre 1 y 50 caracteres'),
  
  body('stock_minimo')
    .optional()
    .isInt({ min: 0 }).withMessage('El stock mínimo debe ser un número entero positivo'),
  
  // Permitir actualizar cantidad_stock
  body('cantidad_stock')
    .optional()
    .isInt({ min: 0 }).withMessage('La cantidad en stock debe ser un número entero positivo'),
  
  validarRequest
];

/**
 * Validaciones para parámetros con UUID
 */
const validacionId = [
  param('id')
    .custom(esUUID).withMessage('El ID del producto debe ser un UUID válido'),
  
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
  
  query('id_categoria')
    .optional()
    .custom(esUUID).withMessage('El ID de categoría debe ser un UUID válido'),
  
  query('stock_minimo')
    .optional()
    .isBoolean().withMessage('stock_minimo debe ser un valor booleano'),
  
  query('soloActivos')
    .optional()
    .isBoolean().withMessage('soloActivos debe ser un valor booleano'),
  
  validarRequest
];

// ============================================
// RUTAS PÚBLICAS (Lectura - VENDEDOR puede ver)
// ============================================

/**
 * GET /api/productos
 * Obtener todos los productos activos
 * Permite búsqueda, filtrado por categoría y stock bajo
 * Acceso: ADMINISTRADOR, VENDEDOR
 */
router.get(
  '/',
  verificarToken,
  administradorOVendedor,
  validacionBusqueda,
  productosController.obtenerTodos
);

/**
 * GET /api/productos/lista-simple
 * Obtener lista simple de todos los productos activos (sin paginación)
 * Retorna: id, nombre, descripción, precio_venta, cantidad_stock, stock_minimo, unidad_medida, categorías
 * Útil para selectores, dropdowns y buscadores en el frontend
 * Acceso: ADMINISTRADOR y VENDEDOR
 */
router.get(
  '/lista-simple',
  verificarToken,
  administradorOVendedor,
  productosController.obtenerListaSimple
);

/**
 * GET /api/productos/papelera
 * Obtener productos en papelera
 * IMPORTANTE: Debe ir ANTES de /stock-bajo y /:id
 * Acceso: Solo ADMINISTRADOR
 */
router.get(
  '/papelera',
  verificarToken,
  soloAdministrador,
  productosController.obtenerPapelera
);

/**
 * GET /api/productos/stock-bajo
 * Obtener productos con stock bajo o agotado
 * IMPORTANTE: Debe ir ANTES de /:id
 * Acceso: ADMINISTRADOR, VENDEDOR
 */
router.get(
  '/stock-bajo',
  verificarToken,
  administradorOVendedor,
  productosController.obtenerStockBajo
);

/**
 * GET /api/productos/:id
 * Obtener producto por ID
 * Acceso: ADMINISTRADOR, VENDEDOR
 */
router.get(
  '/:id',
  verificarToken,
  administradorOVendedor,
  validacionId,
  productosController.obtenerPorId
);

// ============================================
// RUTAS DE ADMINISTRACIÓN (Solo ADMINISTRADOR)
// ============================================

/**
 * POST /api/productos
 * Crear nuevo producto
 * Acceso: Solo ADMINISTRADOR
 * Nota: Se crea con cantidad_stock = 0, se modifica solo con movimientos
 */
router.post(
  '/',
  verificarToken,
  soloAdministrador,
  validacionCrear,
  productosController.crear
);

/**
 * PUT /api/productos/:id
 * Actualizar producto
 * Acceso: Solo ADMINISTRADOR
 * Nota: NO permite modificar cantidad_stock directamente
 */
router.put(
  '/:id',
  verificarToken,
  soloAdministrador,
  validacionActualizar,
  productosController.actualizar
);

/**
 * PATCH /api/productos/:id/activar
 * Activar producto
 * Acceso: Solo ADMINISTRADOR
 */
router.patch(
  '/:id/activar',
  verificarToken,
  soloAdministrador,
  validacionId,
  productosController.activar
);

/**
 * PATCH /api/productos/:id/desactivar
 * Desactivar producto
 * Acceso: Solo ADMINISTRADOR
 */
router.patch(
  '/:id/desactivar',
  verificarToken,
  soloAdministrador,
  validacionId,
  productosController.desactivar
);

/**
 * DELETE /api/productos/:id
 * Mover producto a papelera (soft delete)
 * Acceso: Solo ADMINISTRADOR
 * VALIDACIONES CRÍTICAS:
 * - Bloquea si tiene stock > 0
 * - Bloquea si tiene movimientos recientes (últimos 30 días)
 */
router.delete(
  '/:id',
  verificarToken,
  soloAdministrador,
  validacionId,
  productosController.moverPapelera
);

/**
 * PATCH /api/productos/:id/restaurar
 * Restaurar producto desde papelera
 * Acceso: Solo ADMINISTRADOR
 */
router.patch(
  '/:id/restaurar',
  verificarToken,
  soloAdministrador,
  validacionId,
  productosController.restaurarDePapelera
);

/**
 * DELETE /api/productos/:id/permanente
 * Eliminar producto permanentemente (hard delete)
 * Acceso: Solo ADMINISTRADOR
 * ADVERTENCIA: Esta acción es irreversible
 * VALIDACIÓN: Solo permite si NO tiene movimientos de inventario
 */
router.delete(
  '/:id/permanente',
  verificarToken,
  soloAdministrador,
  validacionId,
  productosController.eliminarPermanentemente
);

module.exports = router;
