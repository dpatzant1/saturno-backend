/**
 * Middleware de validación de requests
 * Utiliza express-validator para validar datos de entrada
 */

const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

/**
 * Middleware que verifica los resultados de las validaciones
 * Debe usarse después de las reglas de validación de express-validator
 */
const validarRequest = (req, res, next) => {
  const errores = validationResult(req);
  
  if (!errores.isEmpty()) {
    const erroresFormateados = errores.array().map(error => ({
      campo: error.path || error.param,
      mensaje: error.msg,
      valor: error.value
    }));

    // Log detallado para debugging
    console.log('❌ ERRORES DE VALIDACIÓN:', JSON.stringify(erroresFormateados, null, 2));
    console.log('📦 BODY RECIBIDO:', JSON.stringify(req.body, null, 2));

    return next(new AppError('Errores de validación', 400, erroresFormateados));
  }
  
  next();
};

module.exports = {
  validarRequest
};
