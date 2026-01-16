/**
 * Middleware de validación de campos
 * Alias de validarRequest para mantener coherencia con nombres en rutas
 */

const { validarRequest } = require('./validarRequest');

/**
 * Middleware que verifica los resultados de las validaciones
 * Debe usarse después de las reglas de validación de express-validator
 */
const validarCampos = validarRequest;

module.exports = {
  validarCampos
};
