/**
 * Validaciones comunes reutilizables
 * Funciones de validación que se usan frecuentemente en toda la aplicación
 */

const { body, param, query } = require('express-validator');

/**
 * Valida que un campo sea un UUID válido
 */
const esUUID = (campo, mensaje = 'ID inválido') => {
  return param(campo)
    .isUUID()
    .withMessage(mensaje);
};

/**
 * Valida que un campo no esté vacío
 */
const requerido = (campo, mensaje) => {
  return body(campo)
    .notEmpty()
    .withMessage(mensaje || `${campo} es requerido`)
    .trim();
};

/**
 * Valida que un campo sea un string con longitud específica
 */
const longitudString = (campo, min, max, mensaje) => {
  return body(campo)
    .isLength({ min, max })
    .withMessage(mensaje || `${campo} debe tener entre ${min} y ${max} caracteres`);
};

/**
 * Valida que un campo sea un email válido
 */
const esEmail = (campo = 'correo') => {
  return body(campo)
    .optional()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail();
};

/**
 * Valida que un campo sea un número entero
 */
const esEntero = (campo, mensaje) => {
  return body(campo)
    .isInt()
    .withMessage(mensaje || `${campo} debe ser un número entero`);
};

/**
 * Valida que un campo sea un número decimal
 */
const esDecimal = (campo, mensaje) => {
  return body(campo)
    .isDecimal()
    .withMessage(mensaje || `${campo} debe ser un número decimal`);
};

/**
 * Valida que un número sea positivo
 */
const esPositivo = (campo, mensaje) => {
  return body(campo)
    .custom(value => parseFloat(value) > 0)
    .withMessage(mensaje || `${campo} debe ser mayor a 0`);
};

/**
 * Valida que un campo sea una fecha válida
 */
const esFecha = (campo, mensaje) => {
  return body(campo)
    .isISO8601()
    .withMessage(mensaje || `${campo} debe ser una fecha válida`);
};

/**
 * Valida que un campo esté en una lista de valores permitidos
 */
const esUnoDe = (campo, valores, mensaje) => {
  return body(campo)
    .isIn(valores)
    .withMessage(mensaje || `${campo} debe ser uno de: ${valores.join(', ')}`);
};

/**
 * Valida que un campo sea booleano
 */
const esBooleano = (campo, mensaje) => {
  return body(campo)
    .isBoolean()
    .withMessage(mensaje || `${campo} debe ser verdadero o falso`);
};

/**
 * Valida que un campo sea un array
 */
const esArray = (campo, mensaje) => {
  return body(campo)
    .isArray()
    .withMessage(mensaje || `${campo} debe ser un array`);
};

/**
 * Valida que un array no esté vacío
 */
const arrayNoVacio = (campo, mensaje) => {
  return body(campo)
    .isArray({ min: 1 })
    .withMessage(mensaje || `${campo} no puede estar vacío`);
};

/**
 * Validación de paginación en query params
 */
const validarPaginacion = () => {
  return [
    query('pagina')
      .optional()
      .isInt({ min: 1 })
      .withMessage('La página debe ser un número entero mayor a 0'),
    query('limite')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('El límite debe ser un número entre 1 y 100')
  ];
};

/**
 * Validación de búsqueda en query params
 */
const validarBusqueda = (campoNombre = 'busqueda') => {
  return query(campoNombre)
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('La búsqueda debe tener entre 1 y 100 caracteres');
};

/**
 * Validaciones específicas del negocio
 */

// Valida tipo de cliente (CONTADO o CREDITO)
const validarTipoCliente = () => {
  return body('tipo_cliente')
    .isIn(['CONTADO', 'CREDITO'])
    .withMessage('El tipo de cliente debe ser CONTADO o CREDITO');
};

// Valida tipo de movimiento de inventario
const validarTipoMovimiento = () => {
  return body('tipo_movimiento')
    .isIn(['ENTRADA', 'SALIDA'])
    .withMessage('El tipo de movimiento debe ser ENTRADA o SALIDA');
};

// Valida tipo de venta
const validarTipoVenta = () => {
  return body('tipo_venta')
    .isIn(['CONTADO', 'CREDITO'])
    .withMessage('El tipo de venta debe ser CONTADO o CREDITO');
};

// Valida estado de venta
const validarEstadoVenta = () => {
  return body('estado')
    .optional()
    .isIn(['ACTIVA', 'ANULADA'])
    .withMessage('El estado debe ser ACTIVA o ANULADA');
};

// Valida estado de crédito
const validarEstadoCredito = () => {
  return body('estado')
    .optional()
    .isIn(['ACTIVO', 'PAGADO', 'VENCIDO'])
    .withMessage('El estado debe ser ACTIVO, PAGADO o VENCIDO');
};

/**
 * Helper para validar que un monto sea válido para crédito
 */
const validarMontoCredito = (campo = 'monto_total') => {
  return [
    body(campo)
      .isDecimal()
      .withMessage(`${campo} debe ser un número decimal`),
    body(campo)
      .custom(value => parseFloat(value) > 0)
      .withMessage(`${campo} debe ser mayor a 0`)
  ];
};

module.exports = {
  // Validaciones básicas
  esUUID,
  requerido,
  longitudString,
  esEmail,
  esEntero,
  esDecimal,
  esPositivo,
  esFecha,
  esUnoDe,
  esBooleano,
  esArray,
  arrayNoVacio,
  
  // Validaciones de query
  validarPaginacion,
  validarBusqueda,
  
  // Validaciones de negocio
  validarTipoCliente,
  validarTipoMovimiento,
  validarTipoVenta,
  validarEstadoVenta,
  validarEstadoCredito,
  validarMontoCredito
};
