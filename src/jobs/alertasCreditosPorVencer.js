/**
 * Job: Alertas de Créditos Próximos a Vencer
 * Genera alertas para créditos que vencen pronto (próximos 7 días)
 */

const supabase = require('../config/database');
const { logger } = require('../utils/logger');

/**
 * Días de anticipación para alertar (7 días antes del vencimiento)
 */
const DIAS_ANTICIPACION = 7;

/**
 * Encuentra créditos que vencen pronto
 */
async function detectarCreditosPorVencer() {
  try {
    logger.info('Verificando créditos próximos a vencer...');
    
    const hoy = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + DIAS_ANTICIPACION);
    
    const hoyStr = hoy.toISOString().split('T')[0];
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];
    
    // Buscar créditos ACTIVOS que vencen en los próximos 7 días
    const { data: creditosPorVencer, error } = await supabase
      .from('creditos')
      .select(`
        id,
        fecha_inicio,
        fecha_vencimiento,
        monto_total,
        saldo_pendiente,
        clientes(id, nombre, telefono, correo)
      `)
      .eq('estado', 'ACTIVO')
      .gte('fecha_vencimiento', hoyStr)
      .lte('fecha_vencimiento', fechaLimiteStr)
      .order('fecha_vencimiento', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    if (!creditosPorVencer || creditosPorVencer.length === 0) {
      logger.info('Alertas créditos por vencer: No hay créditos próximos a vencer');
      return {
        total: 0,
        creditos: []
      };
    }
    
    // Calcular días restantes para cada crédito
    const creditosConDias = creditosPorVencer.map(credito => {
      const fechaVenc = new Date(credito.fecha_vencimiento);
      const diasRestantes = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
      
      return {
        ...credito,
        dias_restantes: diasRestantes
      };
    });
    
    // Clasificar por urgencia
    const urgentes = creditosConDias.filter(c => c.dias_restantes <= 3); // 3 días o menos
    const proximosAVencer = creditosConDias.filter(c => c.dias_restantes > 3);
    
    // Log detallado
    logger.warn(`⚠️ ALERTA CRÉDITOS POR VENCER: ${creditosPorVencer.length} créditos vencen en los próximos ${DIAS_ANTICIPACION} días`, {
      total: creditosPorVencer.length,
      urgentes: urgentes.length,
      proximos: proximosAVencer.length
    });
    
    if (urgentes.length > 0) {
      logger.error(`🚨 CRÉDITOS URGENTES (${urgentes.length}) - Vencen en 3 días o menos:`, {
        creditos: urgentes.map(c => ({
          id: c.id,
          cliente: c.clientes?.nombre || 'Desconocido',
          telefono: c.clientes?.telefono || 'N/A',
          dias_restantes: c.dias_restantes,
          fecha_vencimiento: c.fecha_vencimiento,
          saldo_pendiente: parseFloat(c.saldo_pendiente).toFixed(2)
        }))
      });
    }
    
    if (proximosAVencer.length > 0) {
      logger.warn(`⚠️ CRÉDITOS PRÓXIMOS A VENCER (${proximosAVencer.length}):`, {
        creditos: proximosAVencer.map(c => ({
          id: c.id,
          cliente: c.clientes?.nombre || 'Desconocido',
          telefono: c.clientes?.telefono || 'N/A',
          dias_restantes: c.dias_restantes,
          fecha_vencimiento: c.fecha_vencimiento,
          saldo_pendiente: parseFloat(c.saldo_pendiente).toFixed(2)
        }))
      });
    }
    
    return {
      total: creditosPorVencer.length,
      urgentes: urgentes.length,
      proximos: proximosAVencer.length,
      creditos: creditosConDias
    };
    
  } catch (error) {
    logger.error('Error al detectar créditos próximos a vencer', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Ejecuta la detección de créditos próximos a vencer
 */
async function ejecutarAlertasCreditosPorVencer() {
  logger.info('========================================');
  logger.info('Job: Alertas de Créditos Próximos a Vencer');
  logger.info('========================================');
  
  const inicio = Date.now();
  
  try {
    const resultado = await detectarCreditosPorVencer();
    const duracion = Date.now() - inicio;
    
    logger.info(`Verificación completada en ${duracion}ms`);
    logger.info(`Total créditos próximos a vencer: ${resultado.total}`);
    logger.info(`  - Urgentes (≤3 días): ${resultado.urgentes}`);
    logger.info(`  - Próximos (4-7 días): ${resultado.proximos}`);
    logger.info('========================================');
    
    return resultado;
    
  } catch (error) {
    logger.error('Error crítico en alertas de créditos por vencer', {
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
  ejecutarAlertasCreditosPorVencer,
  detectarCreditosPorVencer,
  DIAS_ANTICIPACION
};
