/**
 * Rutas de Autenticación
 * Endpoints para login, renovación de token y logout
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authService = require('../services/authService');
const { validarRequest } = require('../middlewares/validarRequest');
const { limiterAuth } = require('../middlewares/rateLimiter');
const { exito } = require('../utils/respuestas');

/**
 * Validaciones para login
 */
const validacionLogin = [
  body('nombre')
    .notEmpty().withMessage('El nombre es requerido')
    .isString().withMessage('El nombre debe ser texto')
    .trim(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isString().withMessage('La contraseña debe ser texto'),
  
  validarRequest
];

/**
 * Validaciones para refresh token
 */
const validacionRefresh = [
  body('refreshToken')
    .notEmpty().withMessage('El refresh token es requerido')
    .isString().withMessage('El refresh token debe ser texto'),
  
  validarRequest
];

/**
 * POST /api/auth/login
 * Iniciar sesión
 * Body: { nombre, password }
 * Retorna: { usuario, accessToken, refreshToken }
 */
router.post('/login', limiterAuth, validacionLogin, async (req, res, next) => {
  try {
    const { nombre, password } = req.body;
    const resultado = await authService.login({ nombre, password });
    
    exito({
      res,
      datos: resultado,
      mensaje: 'Login exitoso'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Renovar access token usando refresh token
 * Body: { refreshToken }
 * Retorna: { accessToken, refreshToken }
 */
router.post('/refresh', validacionRefresh, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.renovarToken(refreshToken);
    
    exito({
      res,
      datos: tokens,
      mensaje: 'Token renovado exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Cerrar sesión
 * Nota: El cliente debe eliminar los tokens almacenados
 * Body: opcional { accessToken, refreshToken } (para futura implementación de blacklist)
 */
router.post('/logout', async (req, res, next) => {
  try {
    const resultado = authService.logout();
    
    exito({
      res,
      datos: resultado,
      mensaje: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
