/**
 * Rutas de Categorías
 * Define los endpoints para la gestión de categorías con sistema de papelera
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const categoriasController = require('../controllers/categoriasController');
const { validarRequest } = require('../middlewares/validarRequest');
const { verificarToken, soloAdministrador, administradorOVendedor } = require('../middlewares');
const { esUUID } = require('../utils/validaciones');

/**
 * Validaciones para crear categoría
 */
const validacionCrear = [
  body('nombre')
    .notEmpty().withMessage('El nombre es requerido')
    .isString().withMessage('El nombre debe ser texto')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  
  body('descripcion')
    .optional()
    .isString().withMessage('La descripción debe ser texto')
    .trim(),
  
  validarRequest
];

/**
 * Validaciones para actualizar categoría
 */
const validacionActualizar = [
  param('id')
    .custom(esUUID).withMessage('El ID de la categoría debe ser un UUID válido'),
  
  body('nombre')
    .optional()
    .isString().withMessage('El nombre debe ser texto')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  
  body('descripcion')
    .optional()
    .isString().withMessage('La descripción debe ser texto')
    .trim(),
  
  validarRequest
];

/**
 * Validaciones para parámetros con UUID
 */
const validacionId = [
  param('id')
    .custom(esUUID).withMessage('El ID de la categoría debe ser un UUID válido'),
  
  validarRequest
];

/**
 * Validaciones para búsqueda
 */
const validacionBusqueda = [
  query('busqueda')
    .optional()
    .isString().withMessage('El término de búsqueda debe ser texto')
    .trim(),
  
  query('soloActivas')
    .optional()
    .isBoolean().withMessage('soloActivas debe ser un valor booleano'),
  
  validarRequest
];

// ============================================
// RUTAS PÚBLICAS (Solo lectura - VENDEDOR puede ver)
// ============================================

/**
 * GET /api/categorias
 * Obtener todas las categorías activas
 * Permite búsqueda y filtrado
 * Acceso: ADMINISTRADOR, VENDEDOR
 */
router.get(
  '/',
  verificarToken,
  administradorOVendedor,
  validacionBusqueda,
  categoriasController.obtenerTodas
);

/**
 * GET /api/categorias/papelera
 * Obtener categorías en papelera
 * IMPORTANTE: Debe ir ANTES de /:id
 * Acceso: Solo ADMINISTRADOR
 */
router.get(
  '/papelera',
  verificarToken,
  soloAdministrador,
  categoriasController.obtenerPapelera
);

/**
 * GET /api/categorias/:id
 * Obtener categoría por ID
 * Acceso: ADMINISTRADOR, VENDEDOR
 */
router.get(
  '/:id',
  verificarToken,
  administradorOVendedor,
  validacionId,
  categoriasController.obtenerPorId
);

// ============================================
// RUTAS DE ADMINISTRACIÓN (Solo ADMINISTRADOR)
// ============================================

/**
 * POST /api/categorias
 * Crear nueva categoría
 * Acceso: Solo ADMINISTRADOR
 */
router.post(
  '/',
  verificarToken,
  soloAdministrador,
  validacionCrear,
  categoriasController.crear
);

/**
 * PUT /api/categorias/:id
 * Actualizar categoría
 * Acceso: Solo ADMINISTRADOR
 */
router.put(
  '/:id',
  verificarToken,
  soloAdministrador,
  validacionActualizar,
  categoriasController.actualizar
);

/**
 * PATCH /api/categorias/:id/activar
 * Activar categoría
 * Acceso: Solo ADMINISTRADOR
 */
router.patch(
  '/:id/activar',
  verificarToken,
  soloAdministrador,
  validacionId,
  categoriasController.activar
);

/**
 * PATCH /api/categorias/:id/desactivar
 * Desactivar categoría
 * Acceso: Solo ADMINISTRADOR
 */
router.patch(
  '/:id/desactivar',
  verificarToken,
  soloAdministrador,
  validacionId,
  categoriasController.desactivar
);

/**
 * DELETE /api/categorias/:id
 * Mover categoría a papelera (soft delete)
 * Acceso: Solo ADMINISTRADOR
 */
router.delete(
  '/:id',
  verificarToken,
  soloAdministrador,
  validacionId,
  categoriasController.moverPapelera
);

/**
 * PATCH /api/categorias/:id/restaurar
 * Restaurar categoría desde papelera
 * Acceso: Solo ADMINISTRADOR
 */
router.patch(
  '/:id/restaurar',
  verificarToken,
  soloAdministrador,
  validacionId,
  categoriasController.restaurarDePapelera
);

/**
 * DELETE /api/categorias/:id/permanente
 * Eliminar categoría permanentemente (hard delete)
 * Acceso: Solo ADMINISTRADOR
 * ADVERTENCIA: Esta acción es irreversible
 */
router.delete(
  '/:id/permanente',
  verificarToken,
  soloAdministrador,
  validacionId,
  categoriasController.eliminarPermanentemente
);

module.exports = router;
