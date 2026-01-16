/**
 * Job: Limpieza Automática de Papelera
 * Elimina permanentemente registros que llevan más de 30 días en papelera
 */

const supabase = require('../config/database');
const { logger } = require('../utils/logger');

/**
 * Días que deben pasar para eliminar permanentemente
 */
const DIAS_PAPELERA = 30;

/**
 * Calcula la fecha límite (30 días atrás desde hoy)
 */
function obtenerFechaLimite() {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - DIAS_PAPELERA);
  return fecha.toISOString();
}

/**
 * Elimina productos que llevan más de 30 días en papelera
 */
async function limpiarProductosPapelera() {
  try {
    const fechaLimite = obtenerFechaLimite();
    
    // Buscar productos a eliminar
    const { data: productosAEliminar, error: errorBuscar } = await supabase
      .from('productos')
      .select('id, nombre, deleted_at')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', fechaLimite);
    
    if (errorBuscar) {
      throw errorBuscar;
    }
    
    if (!productosAEliminar || productosAEliminar.length === 0) {
      logger.info('Limpieza papelera productos: No hay registros para eliminar');
      return { eliminados: 0, entidad: 'productos' };
    }
    
    // Eliminar permanentemente
    const idsAEliminar = productosAEliminar.map(p => p.id);
    
    const { error: errorEliminar } = await supabase
      .from('productos')
      .delete()
      .in('id', idsAEliminar);
    
    if (errorEliminar) {
      throw errorEliminar;
    }
    
    // Log de productos eliminados
    logger.info(`Limpieza papelera productos: ${productosAEliminar.length} registros eliminados`, {
      cantidad: productosAEliminar.length,
      productos: productosAEliminar.map(p => ({ id: p.id, nombre: p.nombre, deleted_at: p.deleted_at }))
    });
    
    return { 
      eliminados: productosAEliminar.length, 
      entidad: 'productos',
      registros: productosAEliminar 
    };
    
  } catch (error) {
    logger.error('Error en limpieza de productos en papelera', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Elimina categorías que llevan más de 30 días en papelera
 */
async function limpiarCategoriasPapelera() {
  try {
    const fechaLimite = obtenerFechaLimite();
    
    // Buscar categorías a eliminar
    const { data: categoriasAEliminar, error: errorBuscar } = await supabase
      .from('categorias')
      .select('id, nombre, deleted_at')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', fechaLimite);
    
    if (errorBuscar) {
      throw errorBuscar;
    }
    
    if (!categoriasAEliminar || categoriasAEliminar.length === 0) {
      logger.info('Limpieza papelera categorías: No hay registros para eliminar');
      return { eliminados: 0, entidad: 'categorias' };
    }
    
    // Eliminar permanentemente
    const idsAEliminar = categoriasAEliminar.map(c => c.id);
    
    const { error: errorEliminar } = await supabase
      .from('categorias')
      .delete()
      .in('id', idsAEliminar);
    
    if (errorEliminar) {
      throw errorEliminar;
    }
    
    // Log de categorías eliminadas
    logger.info(`Limpieza papelera categorías: ${categoriasAEliminar.length} registros eliminados`, {
      cantidad: categoriasAEliminar.length,
      categorias: categoriasAEliminar.map(c => ({ id: c.id, nombre: c.nombre, deleted_at: c.deleted_at }))
    });
    
    return { 
      eliminados: categoriasAEliminar.length, 
      entidad: 'categorias',
      registros: categoriasAEliminar 
    };
    
  } catch (error) {
    logger.error('Error en limpieza de categorías en papelera', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Elimina clientes que llevan más de 30 días en papelera
 */
async function limpiarClientesPapelera() {
  try {
    const fechaLimite = obtenerFechaLimite();
    
    // Buscar clientes a eliminar
    const { data: clientesAEliminar, error: errorBuscar } = await supabase
      .from('clientes')
      .select('id, nombre, deleted_at')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', fechaLimite);
    
    if (errorBuscar) {
      throw errorBuscar;
    }
    
    if (!clientesAEliminar || clientesAEliminar.length === 0) {
      logger.info('Limpieza papelera clientes: No hay registros para eliminar');
      return { eliminados: 0, entidad: 'clientes' };
    }
    
    // Eliminar permanentemente
    const idsAEliminar = clientesAEliminar.map(c => c.id);
    
    const { error: errorEliminar } = await supabase
      .from('clientes')
      .delete()
      .in('id', idsAEliminar);
    
    if (errorEliminar) {
      throw errorEliminar;
    }
    
    // Log de clientes eliminados
    logger.info(`Limpieza papelera clientes: ${clientesAEliminar.length} registros eliminados`, {
      cantidad: clientesAEliminar.length,
      clientes: clientesAEliminar.map(c => ({ id: c.id, nombre: c.nombre, deleted_at: c.deleted_at }))
    });
    
    return { 
      eliminados: clientesAEliminar.length, 
      entidad: 'clientes',
      registros: clientesAEliminar 
    };
    
  } catch (error) {
    logger.error('Error en limpieza de clientes en papelera', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Ejecuta la limpieza completa de la papelera
 */
async function ejecutarLimpiezaPapelera() {
  logger.info('========================================');
  logger.info('Iniciando limpieza automática de papelera');
  logger.info('========================================');
  
  const inicio = Date.now();
  const resultados = {
    fecha: new Date().toISOString(),
    productos: 0,
    categorias: 0,
    clientes: 0,
    totalEliminados: 0,
    exito: true,
    errores: []
  };
  
  try {
    // Limpiar productos
    try {
      const resProductos = await limpiarProductosPapelera();
      resultados.productos = resProductos.eliminados;
    } catch (error) {
      resultados.errores.push({ entidad: 'productos', error: error.message });
    }
    
    // Limpiar categorías
    try {
      const resCategorias = await limpiarCategoriasPapelera();
      resultados.categorias = resCategorias.eliminados;
    } catch (error) {
      resultados.errores.push({ entidad: 'categorias', error: error.message });
    }
    
    // Limpiar clientes
    try {
      const resClientes = await limpiarClientesPapelera();
      resultados.clientes = resClientes.eliminados;
    } catch (error) {
      resultados.errores.push({ entidad: 'clientes', error: error.message });
    }
    
    resultados.totalEliminados = resultados.productos + resultados.categorias + resultados.clientes;
    resultados.exito = resultados.errores.length === 0;
    
    const duracion = Date.now() - inicio;
    
    logger.info('========================================');
    logger.info(`Limpieza de papelera completada en ${duracion}ms`);
    logger.info(`Total eliminados: ${resultados.totalEliminados}`);
    logger.info(`  - Productos: ${resultados.productos}`);
    logger.info(`  - Categorías: ${resultados.categorias}`);
    logger.info(`  - Clientes: ${resultados.clientes}`);
    if (resultados.errores.length > 0) {
      logger.warn(`Errores encontrados: ${resultados.errores.length}`, resultados.errores);
    }
    logger.info('========================================');
    
    return resultados;
    
  } catch (error) {
    logger.error('Error crítico en limpieza de papelera', {
      error: error.message,
      stack: error.stack
    });
    resultados.exito = false;
    resultados.errores.push({ general: error.message });
    return resultados;
  }
}

module.exports = {
  ejecutarLimpiezaPapelera,
  limpiarProductosPapelera,
  limpiarCategoriasPapelera,
  limpiarClientesPapelera,
  DIAS_PAPELERA
};
