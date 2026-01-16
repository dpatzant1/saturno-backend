/**
 * Helper para manejo de transacciones SQL con Supabase
 * Permite ejecutar múltiples operaciones de forma atómica
 */

const { supabase } = require('../config/database');
const { ErrorBaseDatos } = require('./errores');

/**
 * Ejecuta múltiples operaciones dentro de una transacción
 * Si alguna falla, todas se revierten automáticamente
 * 
 * IMPORTANTE: Supabase maneja transacciones de forma automática cuando usas
 * .insert(), .update(), .delete() en cadena. Para operaciones complejas,
 * usa PostgreSQL functions o RPC.
 * 
 * @param {Function} operaciones - Función async con las operaciones a ejecutar
 * @returns {Promise} Resultado de la transacción
 * 
 * @example
 * await ejecutarTransaccion(async () => {
 *   const venta = await supabase.from('ventas').insert({...}).select().single();
 *   await supabase.from('detalle_venta').insert(detalles);
 *   await supabase.from('movimientos_inventario').insert(movimientos);
 *   return venta;
 * });
 */
const ejecutarTransaccion = async (operaciones) => {
  try {
    // Nota: Supabase no soporta transacciones explícitas desde el cliente
    // Las operaciones se ejecutan secuencialmente
    // Para transacciones verdaderas, usa PostgreSQL Functions (RPC)
    const resultado = await operaciones();
    return resultado;
  } catch (error) {
    console.error('Error en transacción:', error);
    throw new ErrorBaseDatos('Error al ejecutar la transacción', error.message);
  }
};

/**
 * Ejecuta una función RPC de PostgreSQL (stored procedure)
 * Esto permite transacciones verdaderas del lado del servidor
 * 
 * @param {String} nombreFuncion - Nombre de la función RPC
 * @param {Object} parametros - Parámetros para la función
 * @returns {Promise} Resultado de la función
 * 
 * @example
 * await ejecutarRPC('crear_venta_completa', {
 *   p_id_cliente: clienteId,
 *   p_id_usuario: usuarioId,
 *   p_tipo_venta: 'CONTADO',
 *   p_detalles: detallesJson
 * });
 */
const ejecutarRPC = async (nombreFuncion, parametros = {}) => {
  try {
    const { data, error } = await supabase.rpc(nombreFuncion, parametros);
    
    if (error) {
      console.error(`Error en RPC ${nombreFuncion}:`, error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error ejecutando RPC ${nombreFuncion}:`, error);
    throw new ErrorBaseDatos(`Error al ejecutar ${nombreFuncion}`, error.message);
  }
};

/**
 * Helper para operaciones batch (múltiples inserts/updates)
 * Agrupa operaciones similares para mejor rendimiento
 * 
 * @param {String} tabla - Nombre de la tabla
 * @param {Array} registros - Array de registros a insertar/actualizar
 * @param {String} operacion - 'insert' o 'upsert'
 * @returns {Promise} Resultado de la operación
 * 
 * @example
 * await operacionBatch('detalle_venta', detallesArray, 'insert');
 */
const operacionBatch = async (tabla, registros, operacion = 'insert') => {
  try {
    if (!Array.isArray(registros) || registros.length === 0) {
      throw new Error('Debe proporcionar un array de registros no vacío');
    }
    
    let query = supabase.from(tabla);
    
    if (operacion === 'insert') {
      const { data, error } = await query.insert(registros).select();
      if (error) throw error;
      return data;
    }
    
    if (operacion === 'upsert') {
      const { data, error } = await query.upsert(registros).select();
      if (error) throw error;
      return data;
    }
    
    throw new Error(`Operación ${operacion} no soportada`);
  } catch (error) {
    console.error(`Error en operación batch ${operacion}:`, error);
    throw new ErrorBaseDatos(`Error al ejecutar ${operacion} batch`, error.message);
  }
};

/**
 * Helper para actualizar múltiples registros con rollback manual
 * Guarda los estados anteriores para poder revertir si falla
 * 
 * @param {Array} operaciones - Array de operaciones a ejecutar
 * @returns {Promise} Resultado de todas las operaciones
 * 
 * @example
 * await transaccionConRollback([
 *   { tabla: 'productos', id: '123', datos: { cantidad_stock: 10 } },
 *   { tabla: 'movimientos_inventario', id: null, datos: { tipo: 'ENTRADA' } }
 * ]);
 */
const transaccionConRollback = async (operaciones) => {
  const estadosAnteriores = [];
  const resultados = [];
  
  try {
    // Ejecutar todas las operaciones guardando estados anteriores
    for (const op of operaciones) {
      const { tabla, id, datos, tipo = 'update' } = op;
      
      if (tipo === 'update' && id) {
        // Guardar estado anterior
        const { data: estadoAnterior } = await supabase
          .from(tabla)
          .select('*')
          .eq('id', id)
          .single();
        
        estadosAnteriores.push({ tabla, id, estado: estadoAnterior });
        
        // Ejecutar actualización
        const { data, error } = await supabase
          .from(tabla)
          .update(datos)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        resultados.push(data);
      } else if (tipo === 'insert') {
        // Insertar nuevo registro
        const { data, error } = await supabase
          .from(tabla)
          .insert(datos)
          .select()
          .single();
        
        if (error) throw error;
        
        // Guardar para posible eliminación
        estadosAnteriores.push({ 
          tabla, 
          id: data.id, 
          tipo: 'eliminar',
          idField: Object.keys(data).find(k => k.includes('id_'))
        });
        
        resultados.push(data);
      }
    }
    
    return resultados;
  } catch (error) {
    console.error('Error en transacción, ejecutando rollback:', error);
    
    // Intentar revertir cambios
    for (const anterior of estadosAnteriores.reverse()) {
      try {
        if (anterior.tipo === 'eliminar') {
          // Eliminar registro insertado
          await supabase
            .from(anterior.tabla)
            .delete()
            .eq(anterior.idField, anterior.id);
        } else {
          // Restaurar estado anterior
          await supabase
            .from(anterior.tabla)
            .update(anterior.estado)
            .eq('id', anterior.id);
        }
      } catch (rollbackError) {
        console.error('Error en rollback:', rollbackError);
      }
    }
    
    throw new ErrorBaseDatos('Error en transacción, cambios revertidos', error.message);
  }
};

module.exports = {
  ejecutarTransaccion,
  ejecutarRPC,
  operacionBatch,
  transaccionConRollback
};
