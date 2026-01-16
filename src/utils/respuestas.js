/**
 * Utilidades para respuestas HTTP estandarizadas
 * Mantiene consistencia en todas las respuestas de la API
 */

/**
 * Respuesta exitosa genérica
 * @param {Object} params - Parámetros de la respuesta
 * @param {Object} params.res - Objeto response de Express
 * @param {Object} params.datos - Datos a retornar
 * @param {String} params.mensaje - Mensaje opcional
 * @param {Number} params.status - Código HTTP (default 200)
 * @param {Object} params.metadatos - Metadatos adicionales (opcional)
 */
const exito = ({ res, datos = null, mensaje = 'Operación exitosa', status = 200, metadatos = null }) => {
  const respuesta = {
    success: true,
    mensaje: mensaje,
    datos: datos
  };

  if (metadatos) {
    respuesta.metadatos = metadatos;
  }

  return res.status(status).json(respuesta);
};

/**
 * Respuesta para creación exitosa (201)
 * @param {Object} params - Parámetros de la respuesta
 * @param {Object} params.res - Objeto response de Express
 * @param {Object} params.datos - Datos del recurso creado
 * @param {String} params.mensaje - Mensaje opcional
 */
const creado = ({ res, datos, mensaje = 'Recurso creado exitosamente' }) => {
  return res.status(201).json({
    success: true,
    mensaje: mensaje,
    datos: datos
  });
};

/**
 * Respuesta para actualización exitosa
 * @param {Object} params - Parámetros de la respuesta
 * @param {Object} params.res - Objeto response de Express
 * @param {Object} params.datos - Datos actualizados
 * @param {String} params.mensaje - Mensaje opcional
 */
const actualizado = ({ res, datos, mensaje = 'Recurso actualizado exitosamente' }) => {
  return res.status(200).json({
    success: true,
    mensaje: mensaje,
    datos: datos
  });
};

/**
 * Respuesta para eliminación exitosa
 * @param {Object} params - Parámetros de la respuesta
 * @param {Object} params.res - Objeto response de Express
 * @param {String} params.mensaje - Mensaje opcional
 */
const eliminado = ({ res, mensaje = 'Recurso eliminado exitosamente' }) => {
  return res.status(200).json({
    success: true,
    mensaje: mensaje
  });
};

/**
 * Respuesta con paginación
 * @param {Object} res - Objeto response de Express
 * @param {Array} data - Array de datos
 * @param {Object} paginacion - Información de paginación
 * @param {String} message - Mensaje opcional
 */
const conPaginacion = (res, data, paginacion, message = 'Datos obtenidos exitosamente') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    paginacion: {
      paginaActual: paginacion.paginaActual,
      totalPaginas: paginacion.totalPaginas,
      totalRegistros: paginacion.totalRegistros,
      registrosPorPagina: paginacion.registrosPorPagina,
      tienePaginaAnterior: paginacion.paginaActual > 1,
      tienePaginaSiguiente: paginacion.paginaActual < paginacion.totalPaginas
    }
  });
};

/**
 * Respuesta de error genérica
 * @param {Object} res - Objeto response de Express
 * @param {String} message - Mensaje de error
 * @param {Number} statusCode - Código HTTP (default 500)
 * @param {Object} details - Detalles adicionales del error
 */
const error = (res, message = 'Error en el servidor', statusCode = 500, details = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details })
  });
};

/**
 * Respuesta de error de validación (400)
 * @param {Object} res - Objeto response de Express
 * @param {Object} errores - Array o objeto con los errores de validación
 * @param {String} message - Mensaje opcional
 */
const errorValidacion = (res, errores, message = 'Error de validación') => {
  return res.status(400).json({
    success: false,
    message,
    errores
  });
};

/**
 * Respuesta de no autorizado (401)
 * @param {Object} res - Objeto response de Express
 * @param {String} message - Mensaje opcional
 */
const noAutorizado = (res, message = 'No autorizado') => {
  return res.status(401).json({
    success: false,
    message
  });
};

/**
 * Respuesta de prohibido (403)
 * @param {Object} res - Objeto response de Express
 * @param {String} message - Mensaje opcional
 */
const prohibido = (res, message = 'No tiene permisos para realizar esta acción') => {
  return res.status(403).json({
    success: false,
    message
  });
};

/**
 * Respuesta de no encontrado (404)
 * @param {Object} res - Objeto response de Express
 * @param {String} message - Mensaje opcional
 */
const noEncontrado = (res, message = 'Recurso no encontrado') => {
  return res.status(404).json({
    success: false,
    message
  });
};

/**
 * Respuesta de conflicto (409)
 * @param {Object} res - Objeto response de Express
 * @param {String} message - Mensaje opcional
 */
const conflicto = (res, message = 'El recurso ya existe') => {
  return res.status(409).json({
    success: false,
    message
  });
};

module.exports = {
  exito,
  creado,
  actualizado,
  eliminado,
  conPaginacion,
  error,
  errorValidacion,
  noAutorizado,
  prohibido,
  noEncontrado,
  conflicto
};
