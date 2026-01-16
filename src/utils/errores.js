/**
 * Utilidades para manejo de errores personalizados
 * Extiende la clase AppError del middleware para casos específicos
 */

const { AppError } = require('../middlewares/errorHandler');

/**
 * Error de validación (400)
 */
class ErrorValidacion extends AppError {
  constructor(message = 'Error de validación', details = null) {
    super(message, 400, details);
    this.name = 'ErrorValidacion';
  }
}

/**
 * Error de autenticación/no autorizado (401)
 */
class ErrorAutenticacion extends AppError {
  constructor(message = 'Autenticación requerida') {
    super(message, 401);
    this.name = 'ErrorAutenticacion';
  }
}

/**
 * Alias de ErrorAutenticacion para mayor claridad
 */
class ErrorNoAutorizado extends AppError {
  constructor(message = 'No está autorizado para acceder a este recurso') {
    super(message, 401);
    this.name = 'ErrorNoAutorizado';
  }
}

/**
 * Error de autorización/prohibido (403)
 */
class ErrorAutorizacion extends AppError {
  constructor(message = 'No tiene permisos para realizar esta acción') {
    super(message, 403);
    this.name = 'ErrorAutorizacion';
  }
}

/**
 * Alias de ErrorAutorizacion para mayor claridad
 */
class ErrorProhibido extends AppError {
  constructor(message = 'Acceso prohibido') {
    super(message, 403);
    this.name = 'ErrorProhibido';
  }
}

/**
 * Error de recurso no encontrado (404)
 */
class ErrorNoEncontrado extends AppError {
  constructor(recurso = 'Recurso') {
    super(`${recurso} no encontrado`, 404);
    this.name = 'ErrorNoEncontrado';
  }
}

/**
 * Error de conflicto (409)
 */
class ErrorConflicto extends AppError {
  constructor(message = 'El recurso ya existe') {
    super(message, 409);
    this.name = 'ErrorConflicto';
  }
}

/**
 * Error de base de datos (500)
 */
class ErrorBaseDatos extends AppError {
  constructor(message = 'Error en la base de datos', details = null) {
    super(message, 500, details);
    this.name = 'ErrorBaseDatos';
  }
}

/**
 * Error de negocio (422)
 * Para validaciones de lógica de negocio
 */
class ErrorNegocio extends AppError {
  constructor(message, details = null) {
    super(message, 422, details);
    this.name = 'ErrorNegocio';
  }
}

/**
 * Helper para lanzar error si una condición es verdadera
 * @param {Boolean} condition - Condición a evaluar
 * @param {String} message - Mensaje de error
 * @param {Number} statusCode - Código HTTP
 */
const lanzarSi = (condition, message, statusCode = 400) => {
  if (condition) {
    throw new AppError(message, statusCode);
  }
};

/**
 * Helper para lanzar error si un recurso no existe
 * @param {Any} recurso - Recurso a verificar
 * @param {String} nombreRecurso - Nombre del recurso para el mensaje
 */
const lanzarSiNoExiste = (recurso, nombreRecurso = 'Recurso') => {
  if (!recurso) {
    throw new ErrorNoEncontrado(nombreRecurso);
  }
};

/**
 * Helper para capturar errores de Supabase y transformarlos
 * @param {Object} error - Error de Supabase
 */
const manejarErrorSupabase = (error) => {
  console.error('Error de Supabase:', error);
  
  // Errores comunes de PostgreSQL
  if (error.code === '23505') {
    throw new ErrorConflicto('El registro ya existe (duplicado)');
  }
  
  if (error.code === '23503') {
    throw new ErrorNegocio('No se puede eliminar, existen registros relacionados');
  }
  
  if (error.code === '23502') {
    throw new ErrorValidacion('Faltan campos requeridos');
  }
  
  // Error genérico de base de datos
  throw new ErrorBaseDatos('Error al procesar la operación en la base de datos');
};

module.exports = {
  // Clases de error
  ErrorValidacion,
  ErrorAutenticacion,
  ErrorNoAutorizado, // Alias de ErrorAutenticacion
  ErrorAutorizacion,
  ErrorProhibido, // Alias de ErrorAutorizacion
  ErrorNoEncontrado,
  ErrorConflicto,
  ErrorBaseDatos,
  ErrorNegocio,
  
  // Helpers
  lanzarSi,
  lanzarSiNoExiste,
  manejarErrorSupabase
};
