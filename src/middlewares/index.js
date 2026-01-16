/**
 * Índice de middlewares
 * Exporta todos los middlewares de manera centralizada
 */

const { AppError, errorHandler, notFound } = require('./errorHandler');
const { validarRequest } = require('./validarRequest');
const { validarCampos } = require('./validarCampos');
const { 
  limiterGeneral, 
  limiterAuth, 
  limiterCreacion,
  limiterPagos,
  limiterCreditos,
  limiterVentas,
  limiterAnulacion,
  limiterEliminacion
} = require('./rateLimiter');
const { sanitizarRequest, sanitizarBody } = require('./sanitizacion');
const verificarToken = require('./verificarToken');
const { verificarRol, soloAdministrador, administradorOVendedor } = require('./verificarRol');
const { 
  soloPerfilPropio, 
  soloVentasPropias, 
  verificarPropiedadVenta,
  verificarPropiedadCredito,
  reportesPorVendedor,
  soloAdminPuedeAnular
} = require('./autorizacionRecurso');
const {
  ACCIONES_AUDITABLES,
  registrarAuditoria,
  auditarCreacion,
  auditarActualizacion,
  auditarEliminacion
} = require('./auditoria');

module.exports = {
  // Manejo de errores
  AppError,
  errorHandler,
  notFound,
  
  // Validación
  validarRequest,
  validarCampos,
  
  // Rate limiting
  limiterGeneral,
  limiterAuth,
  limiterCreacion,
  limiterPagos,
  limiterCreditos,
  limiterVentas,
  limiterAnulacion,
  limiterEliminacion,
  
  // Sanitización
  sanitizarRequest,
  sanitizarBody,
  
  // Autenticación y Autorización
  verificarToken,
  verificarRol,
  soloAdministrador,
  administradorOVendedor,
  
  // Autorización por recurso
  soloPerfilPropio,
  soloVentasPropias,
  verificarPropiedadVenta,
  verificarPropiedadCredito,
  reportesPorVendedor,
  soloAdminPuedeAnular,
  
  // Auditoría
  ACCIONES_AUDITABLES,
  registrarAuditoria,
  auditarCreacion,
  auditarActualizacion,
  auditarEliminacion
};
