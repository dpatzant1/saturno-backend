/**
 * Scheduler Principal de Jobs Automáticos
 * Configura y ejecuta todas las tareas programadas del sistema
 */

const cron = require('node-cron');
const { logger } = require('../utils/logger');
const { ejecutarLimpiezaPapelera } = require('./limpiezaPapelera');
const { ejecutarActualizacionCreditos } = require('./actualizarCreditosVencidos');
const { ejecutarAlertasStockBajo } = require('./alertasStockBajo');
const { ejecutarAlertasCreditosPorVencer } = require('./alertasCreditosPorVencer');

/**
 * Configuración de horarios de ejecución
 * Formato: cron (segundo minuto hora día mes día-semana)
 */
const HORARIOS = {
  // Limpieza de papelera: El día 1 de cada mes a las 2:00 AM
  LIMPIEZA_PAPELERA: '0 2 1 * *',
  
  // Actualización créditos vencidos: Todos los días a las 1:00 AM
  CREDITOS_VENCIDOS: '0 1 * * *',
  
  // Alertas stock bajo: Todos los días a las 8:00 AM
  ALERTAS_STOCK: '0 8 * * *',
  
  // Alertas créditos por vencer: Todos los días a las 9:00 AM
  ALERTAS_CREDITOS: '0 9 * * *'
};

/**
 * Jobs programados activos
 */
const jobsActivos = [];

/**
 * Inicia todos los jobs automáticos
 */
function iniciarJobs() {
  logger.info('========================================');
  logger.info('🤖 Iniciando sistema de jobs automáticos');
  logger.info('========================================');
  
  // Job 1: Limpieza automática de papelera
  const jobLimpieza = cron.schedule(HORARIOS.LIMPIEZA_PAPELERA, async () => {
    try {
      await ejecutarLimpiezaPapelera();
    } catch (error) {
      logger.error('Error en job de limpieza de papelera', { error: error.message });
    }
  }, {
    scheduled: true,
    timezone: 'America/Mexico_City' // Ajusta a tu zona horaria
  });
  
  jobsActivos.push({ nombre: 'Limpieza Papelera', horario: HORARIOS.LIMPIEZA_PAPELERA, job: jobLimpieza });
  logger.info(`✅ Job "Limpieza Papelera" programado: ${HORARIOS.LIMPIEZA_PAPELERA} (día 1 de cada mes a las 2:00 AM)`);
  
  // Job 2: Actualización de créditos vencidos
  const jobCreditos = cron.schedule(HORARIOS.CREDITOS_VENCIDOS, async () => {
    try {
      await ejecutarActualizacionCreditos();
    } catch (error) {
      logger.error('Error en job de créditos vencidos', { error: error.message });
    }
  }, {
    scheduled: true,
    timezone: 'America/Mexico_City'
  });
  
  jobsActivos.push({ nombre: 'Créditos Vencidos', horario: HORARIOS.CREDITOS_VENCIDOS, job: jobCreditos });
  logger.info(`✅ Job "Créditos Vencidos" programado: ${HORARIOS.CREDITOS_VENCIDOS} (1:00 AM diario)`);
  
  // Job 3: Alertas de stock bajo
  const jobStock = cron.schedule(HORARIOS.ALERTAS_STOCK, async () => {
    try {
      await ejecutarAlertasStockBajo();
    } catch (error) {
      logger.error('Error en job de alertas de stock', { error: error.message });
    }
  }, {
    scheduled: true,
    timezone: 'America/Mexico_City'
  });
  
  jobsActivos.push({ nombre: 'Alertas Stock Bajo', horario: HORARIOS.ALERTAS_STOCK, job: jobStock });
  logger.info(`✅ Job "Alertas Stock Bajo" programado: ${HORARIOS.ALERTAS_STOCK} (8:00 AM diario)`);
  
  // Job 4: Alertas de créditos próximos a vencer
  const jobAlertasCreditos = cron.schedule(HORARIOS.ALERTAS_CREDITOS, async () => {
    try {
      await ejecutarAlertasCreditosPorVencer();
    } catch (error) {
      logger.error('Error en job de alertas de créditos', { error: error.message });
    }
  }, {
    scheduled: true,
    timezone: 'America/Mexico_City'
  });
  
  jobsActivos.push({ nombre: 'Alertas Créditos Por Vencer', horario: HORARIOS.ALERTAS_CREDITOS, job: jobAlertasCreditos });
  logger.info(`✅ Job "Alertas Créditos Por Vencer" programado: ${HORARIOS.ALERTAS_CREDITOS} (9:00 AM diario)`);
  
  logger.info('========================================');
  logger.info(`✅ ${jobsActivos.length} jobs automáticos iniciados correctamente`);
  logger.info('========================================');
}

/**
 * Detiene todos los jobs
 */
function detenerJobs() {
  logger.info('Deteniendo jobs automáticos...');
  
  jobsActivos.forEach(({ nombre, job }) => {
    job.stop();
    logger.info(`⏸️  Job "${nombre}" detenido`);
  });
  
  logger.info('Todos los jobs han sido detenidos');
}

/**
 * Obtiene el estado de los jobs
 */
function obtenerEstadoJobs() {
  return jobsActivos.map(({ nombre, horario }) => ({
    nombre,
    horario,
    estado: 'activo'
  }));
}

/**
 * Ejecuta manualmente un job específico (útil para pruebas)
 */
async function ejecutarJobManual(nombreJob) {
  logger.info(`Ejecutando manualmente job: ${nombreJob}`);
  
  switch (nombreJob) {
    case 'limpieza':
      return await ejecutarLimpiezaPapelera();
    case 'creditos':
      return await ejecutarActualizacionCreditos();
    case 'stock':
      return await ejecutarAlertasStockBajo();
    case 'alertas-creditos':
      return await ejecutarAlertasCreditosPorVencer();
    default:
      throw new Error(`Job no reconocido: ${nombreJob}`);
  }
}

module.exports = {
  iniciarJobs,
  detenerJobs,
  obtenerEstadoJobs,
  ejecutarJobManual,
  HORARIOS
};
