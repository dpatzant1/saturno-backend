/**
 * Job: Actualización de Estado de Créditos Vencidos
 * Actualiza automáticamente el estado de créditos que han vencido
 */

const supabase = require('../config/database');
const { logger } = require('../utils/logger');
const { obtenerFechaHoyGuatemala } = require('../utils/fechas');

/**
 * Actualiza créditos que ya vencieron a estado VENCIDO
 */
async function actualizarCreditosVencidos() {
  try {
    logger.info('Iniciando actualización de créditos vencidos...');
    
    const hoy = obtenerFechaHoyGuatemala(); // Fecha en zona horaria de Guatemala
    
    // Buscar créditos ACTIVOS que ya vencieron
    const { data: creditosVencidos, error: errorBuscar } = await supabase
      .from('creditos')
      .select('id, fecha_vencimiento, saldo_pendiente, clientes(nombre)')
      .eq('estado', 'ACTIVO')
      .lt('fecha_vencimiento', hoy);
    
    if (errorBuscar) {
      throw errorBuscar;
    }
    
    if (!creditosVencidos || creditosVencidos.length === 0) {
      logger.info('Actualización créditos vencidos: No hay créditos para actualizar');
      return { 
        actualizados: 0, 
        creditos: [] 
      };
    }
    
    // Actualizar estado a VENCIDO
    const idsActualizar = creditosVencidos.map(c => c.id);
    
    const { error: errorActualizar } = await supabase
      .from('creditos')
      .update({ estado: 'VENCIDO' })
      .in('id', idsActualizar);
    
    if (errorActualizar) {
      throw errorActualizar;
    }
    
    // Log detallado
    logger.warn(`Actualización créditos vencidos: ${creditosVencidos.length} créditos marcados como VENCIDO`, {
      cantidad: creditosVencidos.length,
      creditos: creditosVencidos.map(c => ({
        id: c.id,
        cliente: c.clientes?.nombre || 'Desconocido',
        fecha_vencimiento: c.fecha_vencimiento,
        saldo_pendiente: c.saldo_pendiente
      }))
    });
    
    return {
      actualizados: creditosVencidos.length,
      creditos: creditosVencidos
    };
    
  } catch (error) {
    logger.error('Error al actualizar créditos vencidos', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Ejecuta la actualización de créditos vencidos
 */
async function ejecutarActualizacionCreditos() {
  logger.info('========================================');
  logger.info('Job: Actualización de Créditos Vencidos');
  logger.info('========================================');
  
  const inicio = Date.now();
  
  try {
    const resultado = await actualizarCreditosVencidos();
    const duracion = Date.now() - inicio;
    
    logger.info(`Actualización completada en ${duracion}ms`);
    logger.info(`Créditos actualizados a VENCIDO: ${resultado.actualizados}`);
    logger.info('========================================');
    
    return resultado;
    
  } catch (error) {
    logger.error('Error crítico en actualización de créditos', {
      error: error.message,
      stack: error.stack
    });
    return {
      exito: false,
      error: error.message
    };
  }
}

module.exports = {
  ejecutarActualizacionCreditos,
  actualizarCreditosVencidos
};
