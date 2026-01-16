/**
 * Índice de utilidades
 * Exporta todas las utilidades de manera centralizada
 */

const respuestas = require('./respuestas');
const errores = require('./errores');
const validaciones = require('./validaciones');
const transacciones = require('./transacciones');
const paginacion = require('./paginacion');

module.exports = {
  // Respuestas HTTP
  ...respuestas,
  
  // Manejo de errores
  ...errores,
  
  // Validaciones
  ...validaciones,
  
  // Transacciones
  ...transacciones,
  
  // Paginación
  ...paginacion
};
