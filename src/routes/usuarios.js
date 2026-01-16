/**
 * Rutas de Usuarios
 * Define los endpoints para la gestión de usuarios
 */

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const usuariosController = require('../controllers/usuariosController');
const { validarRequest } = require('../middlewares/validarRequest');
const { verificarToken, soloAdministrador } = require('../middlewares');
const { esUUID } = require('../utils/validaciones');

/**
 * Validaciones para crear usuario
 */
const validacionCrear = [
  body('nombre')
    .notEmpty().withMessage('El nombre es requerido')
    .isString().withMessage('El nombre debe ser texto')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isString().withMessage('La contraseña debe ser texto')
    .isLength({ min: 6, max: 100 }).withMessage('La contraseña debe tener entre 6 y 100 caracteres'),
  
  body('id_rol')
    .notEmpty().withMessage('El rol es requerido')
    .custom(esUUID).withMessage('El ID del rol debe ser un UUID válido'),
  
  validarRequest
];

/**
 * Validaciones para actualizar usuario
 */
const validacionActualizar = [
  param('id')
    .custom(esUUID).withMessage('El ID del usuario debe ser un UUID válido'),
  
  body('nombre')
    .optional()
    .isString().withMessage('El nombre debe ser texto')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  
  body('id_rol')
    .optional()
    .custom(esUUID).withMessage('El ID del rol debe ser un UUID válido'),
  
  validarRequest
];

/**
 * Validaciones para actualizar contraseña
 */
const validacionActualizarPassword = [
  param('id')
    .custom(esUUID).withMessage('El ID del usuario debe ser un UUID válido'),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isString().withMessage('La contraseña debe ser texto')
    .isLength({ min: 6, max: 100 }).withMessage('La contraseña debe tener entre 6 y 100 caracteres'),
  
  validarRequest
];

/**
 * Validaciones para parámetros con UUID
 */
const validacionId = [
  param('id')
    .custom(esUUID).withMessage('El ID del usuario debe ser un UUID válido'),
  
  validarRequest
];

const validacionIdRol = [
  param('idRol')
    .custom(esUUID).withMessage('El ID del rol debe ser un UUID válido'),
  
  validarRequest
];

// Rutas
// NOTA: Todas las rutas de usuarios requieren autenticación y solo ADMINISTRADOR puede gestionarlas

/**
 * GET /api/usuarios
 * Obtener todos los usuarios
 * Requiere: Token válido + Rol ADMINISTRADOR
 */
router.get('/', verificarToken, soloAdministrador, usuariosController.obtenerTodos);

/**
 * GET /api/usuarios/roles
 * Obtener todos los roles disponibles
 * Requiere: Token válido + Rol ADMINISTRADOR
 * IMPORTANTE: Esta ruta debe ir ANTES de /rol/:idRol para evitar conflictos
 */
router.get('/roles', verificarToken, soloAdministrador, usuariosController.obtenerRoles);

/**
 * GET /api/usuarios/rol/:idRol
 * Obtener usuarios por rol
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id para evitar conflictos
 * Requiere: Token válido + Rol ADMINISTRADOR
 */
router.get('/rol/:idRol', verificarToken, soloAdministrador, validacionIdRol, usuariosController.obtenerPorRol);

/**
 * GET /api/usuarios/:id
 * Obtener usuario por ID
 * Requiere: Token válido + Rol ADMINISTRADOR
 */
router.get('/:id', verificarToken, soloAdministrador, validacionId, usuariosController.obtenerPorId);

/**
 * POST /api/usuarios
 * Crear nuevo usuario
 * Requiere: Token válido + Rol ADMINISTRADOR
 */
router.post('/', verificarToken, soloAdministrador, validacionCrear, usuariosController.crear);

/**
 * PUT /api/usuarios/:id
 * Actualizar usuario
 * Requiere: Token válido + Rol ADMINISTRADOR
 */
router.put('/:id', verificarToken, soloAdministrador, validacionActualizar, usuariosController.actualizar);

/**
 * PATCH /api/usuarios/:id/password
 * Actualizar contraseña
 * Requiere: Token válido + Rol ADMINISTRADOR
 */
router.patch('/:id/password', verificarToken, soloAdministrador, validacionActualizarPassword, usuariosController.actualizarPassword);

/**
 * PATCH /api/usuarios/:id/activar
 * Activar usuario
 * Requiere: Token válido + Rol ADMINISTRADOR
 */
router.patch('/:id/activar', verificarToken, soloAdministrador, validacionId, usuariosController.activar);

/**
 * DELETE /api/usuarios/:id
 * Desactivar usuario (soft delete)
 * Requiere: Token válido + Rol ADMINISTRADOR
 */
router.delete('/:id', verificarToken, soloAdministrador, validacionId, usuariosController.eliminar);

module.exports = router;
