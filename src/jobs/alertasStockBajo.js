/**
 * Job: Alertas de Productos con Stock Bajo
 * Genera alertas para productos que tienen stock por debajo del mínimo
 */

const supabase = require('../config/database');
const { logger } = require('../utils/logger');

/**
 * Encuentra productos con stock bajo o agotado
 */
async function detectarProductosStockBajo() {
  try {
    logger.info('Verificando productos con stock bajo...');
    
    // Buscar productos activos con stock <= stock_minimo
    const { data: productosStockBajo, error } = await supabase
      .from('productos')
      .select(`
        id,
        nombre,
        cantidad_stock,
        stock_minimo,
        categorias(nombre)
      `)
      .eq('estado', true)
      .is('deleted_at', null)
      .filter('cantidad_stock', 'lte', supabase.raw('stock_minimo'));
    
    if (error) {
      throw error;
    }
    
    if (!productosStockBajo || productosStockBajo.length === 0) {
      logger.info('Alertas stock bajo: No hay productos con stock bajo');
      return {
        total: 0,
        agotados: 0,
        stockBajo: 0,
        productos: []
      };
    }
    
    // Clasificar productos
    const agotados = productosStockBajo.filter(p => p.cantidad_stock === 0);
    const stockBajo = productosStockBajo.filter(p => p.cantidad_stock > 0);
    
    // Log detallado
    logger.warn(`⚠️ ALERTA STOCK BAJO: ${productosStockBajo.length} productos requieren atención`, {
      total: productosStockBajo.length,
      agotados: agotados.length,
      stockBajo: stockBajo.length
    });
    
    if (agotados.length > 0) {
      logger.error(`🚨 PRODUCTOS AGOTADOS (${agotados.length}):`, {
        productos: agotados.map(p => ({
          id: p.id,
          nombre: p.nombre,
          categoria: p.categorias?.nombre || 'Sin categoría',
          stock: p.cantidad_stock,
          stock_minimo: p.stock_minimo
        }))
      });
    }
    
    if (stockBajo.length > 0) {
      logger.warn(`⚠️ PRODUCTOS CON STOCK BAJO (${stockBajo.length}):`, {
        productos: stockBajo.map(p => ({
          id: p.id,
          nombre: p.nombre,
          categoria: p.categorias?.nombre || 'Sin categoría',
          stock: p.cantidad_stock,
          stock_minimo: p.stock_minimo
        }))
      });
    }
    
    return {
      total: productosStockBajo.length,
      agotados: agotados.length,
      stockBajo: stockBajo.length,
      productos: productosStockBajo
    };
    
  } catch (error) {
    logger.error('Error al detectar productos con stock bajo', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Ejecuta la detección de stock bajo
 */
async function ejecutarAlertasStockBajo() {
  logger.info('========================================');
  logger.info('Job: Alertas de Stock Bajo');
  logger.info('========================================');
  
  const inicio = Date.now();
  
  try {
    const resultado = await detectarProductosStockBajo();
    const duracion = Date.now() - inicio;
    
    logger.info(`Verificación completada en ${duracion}ms`);
    logger.info(`Total productos con stock bajo: ${resultado.total}`);
    logger.info(`  - Agotados: ${resultado.agotados}`);
    logger.info(`  - Stock bajo: ${resultado.stockBajo}`);
    logger.info('========================================');
    
    return resultado;
    
  } catch (error) {
    logger.error('Error crítico en alertas de stock bajo', {
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
  ejecutarAlertasStockBajo,
  detectarProductosStockBajo
};
