/**
 * Middleware de Auditoría
 * Registra acciones críticas del sistema para trazabilidad
 */

const supabase = require('../config/database');

/**
 * Tipos de acciones auditables
 */
const ACCIONES_AUDITABLES = {
  // Autenticación
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  
  // Usuarios
  CREAR_USUARIO: 'CREAR_USUARIO',
  ACTUALIZAR_USUARIO: 'ACTUALIZAR_USUARIO',
  ELIMINAR_USUARIO: 'ELIMINAR_USUARIO',
  
  // Productos
  CREAR_PRODUCTO: 'CREAR_PRODUCTO',
  ACTUALIZAR_PRODUCTO: 'ACTUALIZAR_PRODUCTO',
  ELIMINAR_PRODUCTO: 'ELIMINAR_PRODUCTO',
  RESTAURAR_PRODUCTO: 'RESTAURAR_PRODUCTO',
  
  // Inventario
  ENTRADA_INVENTARIO: 'ENTRADA_INVENTARIO',
  SALIDA_INVENTARIO: 'SALIDA_INVENTARIO',
  
  // Ventas
  CREAR_VENTA_CONTADO: 'CREAR_VENTA_CONTADO',
  CREAR_VENTA_CREDITO: 'CREAR_VENTA_CREDITO',
  ANULAR_VENTA: 'ANULAR_VENTA',
  
  // Créditos y Pagos
  CREAR_CREDITO: 'CREAR_CREDITO',
  REGISTRAR_PAGO: 'REGISTRAR_PAGO',
  
  // Clientes
  CREAR_CLIENTE: 'CREAR_CLIENTE',
  ACTUALIZAR_CLIENTE: 'ACTUALIZAR_CLIENTE',
  ELIMINAR_CLIENTE: 'ELIMINAR_CLIENTE'
};

/**
 * Registra una acción en el log de auditoría
 * @param {Object} datos - Datos de la auditoría
 * @param {string} datos.accion - Tipo de acción (usar ACCIONES_AUDITABLES)
 * @param {string} datos.id_usuario - UUID del usuario que realizó la acción
 * @param {string} datos.entidad - Nombre de la entidad afectada (productos, ventas, etc.)
 * @param {string} datos.id_entidad - ID del registro afectado
 * @param {Object} datos.datos_anteriores - Estado anterior (para updates/deletes)
 * @param {Object} datos.datos_nuevos - Estado nuevo (para creates/updates)
 * @param {string} datos.ip - IP del cliente
 * @param {string} datos.user_agent - User agent del cliente
 */
async function registrarAuditoria(datos) {
  try {
    await supabase
      .from('auditoria')
      .insert([{
        accion: datos.accion,
        id_usuario: datos.id_usuario,
        entidad: datos.entidad,
        id_entidad: datos.id_entidad,
        datos_anteriores: datos.datos_anteriores || null,
        datos_nuevos: datos.datos_nuevos || null,
        ip_cliente: datos.ip || null,
        user_agent: datos.user_agent || null
      }]);
  } catch (error) {
    // No lanzar error para no interrumpir el flujo
    console.error('Error al registrar auditoría:', error.message);
  }
}

/**
 * Middleware para auditar acciones POST (creación)
 * Debe usarse DESPUÉS de que la acción se complete exitosamente
 */
function auditarCreacion(accion, entidad) {
  return async (req, res, next) => {
    // Guardar el método original de res.json
    const originalJson = res.json.bind(res);
    
    // Sobrescribir res.json para interceptar la respuesta
    res.json = function(data) {
      // Solo auditar si fue exitoso (status 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Registrar en segundo plano (no bloqueante)
        setImmediate(async () => {
          try {
            await registrarAuditoria({
              accion,
              id_usuario: req.usuario?.id_usuario || null,
              entidad,
              id_entidad: data.datos?.id || data.datos?.id_venta || data.datos?.id_credito || null,
              datos_nuevos: data.datos || null,
              ip: req.ip || req.connection.remoteAddress,
              user_agent: req.get('user-agent')
            });
          } catch (error) {
            console.error('Error en auditoría:', error.message);
          }
        });
      }
      
      // Llamar al método original
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Middleware para auditar acciones PUT/PATCH (actualización)
 */
function auditarActualizacion(accion, entidad, obtenerDatosAnteriores) {
  return async (req, res, next) => {
    // Obtener datos anteriores antes de la actualización
    let datosAnteriores = null;
    if (obtenerDatosAnteriores && typeof obtenerDatosAnteriores === 'function') {
      try {
        datosAnteriores = await obtenerDatosAnteriores(req);
      } catch (error) {
        console.error('Error al obtener datos anteriores:', error.message);
      }
    }
    
    // Guardar el método original de res.json
    const originalJson = res.json.bind(res);
    
    // Sobrescribir res.json
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(async () => {
          try {
            await registrarAuditoria({
              accion,
              id_usuario: req.usuario?.id_usuario || null,
              entidad,
              id_entidad: req.params.id || data.datos?.id,
              datos_anteriores: datosAnteriores,
              datos_nuevos: data.datos || null,
              ip: req.ip || req.connection.remoteAddress,
              user_agent: req.get('user-agent')
            });
          } catch (error) {
            console.error('Error en auditoría:', error.message);
          }
        });
      }
      
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Middleware para auditar acciones DELETE
 */
function auditarEliminacion(accion, entidad, obtenerDatosAnteriores) {
  return async (req, res, next) => {
    let datosAnteriores = null;
    if (obtenerDatosAnteriores && typeof obtenerDatosAnteriores === 'function') {
      try {
        datosAnteriores = await obtenerDatosAnteriores(req);
      } catch (error) {
        console.error('Error al obtener datos anteriores:', error.message);
      }
    }
    
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(async () => {
          try {
            await registrarAuditoria({
              accion,
              id_usuario: req.usuario?.id_usuario || null,
              entidad,
              id_entidad: req.params.id,
              datos_anteriores: datosAnteriores,
              datos_nuevos: null,
              ip: req.ip || req.connection.remoteAddress,
              user_agent: req.get('user-agent')
            });
          } catch (error) {
            console.error('Error en auditoría:', error.message);
          }
        });
      }
      
      return originalJson(data);
    };
    
    next();
  };
}

module.exports = {
  ACCIONES_AUDITABLES,
  registrarAuditoria,
  auditarCreacion,
  auditarActualizacion,
  auditarEliminacion
};
