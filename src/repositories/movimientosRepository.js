/**
 * Repository de Movimientos de Inventario
 * Gestiona el acceso a datos de movimientos con actualización automática de stock
 */

const { supabase } = require('../config/database');
const { ErrorNoEncontrado } = require('../utils/errores');

/**
 * Registra un movimiento de inventario y actualiza el stock del producto
 * IMPORTANTE: Esta función debe ejecutarse dentro de una transacción
 * @param {Object} movimiento - Datos del movimiento
 * @param {string} movimiento.id_producto - UUID del producto
 * @param {string} movimiento.tipo_movimiento - 'ENTRADA' o 'SALIDA'
 * @param {number} movimiento.cantidad - Cantidad del movimiento (> 0)
 * @param {string} movimiento.motivo - Motivo del movimiento
 * @param {string} movimiento.referencia - Referencia externa (opcional)
 * @returns {Promise<Object>} Movimiento creado con datos del producto
 */
async function crear(movimiento) {
  const { id_producto, tipo_movimiento, cantidad, motivo, referencia } = movimiento;

  // 1. Insertar el movimiento
  const { data: nuevoMovimiento, error: errorMovimiento } = await supabase
    .from('movimientos_inventario')
    .insert({
      id_producto,
      tipo_movimiento,
      cantidad,
      motivo,
      referencia
    })
    .select(`
      *,
      productos:id_producto (
        id_producto,
        nombre,
        cantidad_stock,
        unidad_medida
      )
    `)
    .single();

  if (errorMovimiento) {
    throw errorMovimiento;
  }

  // 2. Actualizar el stock del producto
  // Primero obtener el stock actual
  const { data: productoActual, error: errorGet } = await supabase
    .from('productos')
    .select('cantidad_stock')
    .eq('id_producto', id_producto)
    .single();

  if (errorGet) {
    throw errorGet;
  }

  // Calcular nuevo stock
  // ENTRADA: suma al stock
  // SALIDA: resta del stock
  const ajuste = tipo_movimiento === 'ENTRADA' ? cantidad : -cantidad;
  const nuevoStock = productoActual.cantidad_stock + ajuste;

  // Actualizar el stock
  const { data: productoActualizado, error: errorStock } = await supabase
    .from('productos')
    .update({
      cantidad_stock: nuevoStock
    })
    .eq('id_producto', id_producto)
    .select('cantidad_stock')
    .single();

  if (errorStock) {
    throw errorStock;
  }

  // Agregar el stock actualizado al resultado
  return {
    ...nuevoMovimiento,
    stock_anterior: productoActual.cantidad_stock,
    stock_actual: productoActualizado.cantidad_stock
  };
}

/**
 * Obtiene todos los movimientos con filtros opcionales y paginación
 * @param {Object} filtros - Filtros de búsqueda
 * @param {string} filtros.id_producto - Filtrar por producto
 * @param {string} filtros.tipo_movimiento - Filtrar por tipo (ENTRADA/SALIDA)
 * @param {Date} filtros.fecha_desde - Fecha inicio
 * @param {Date} filtros.fecha_hasta - Fecha fin
 * @param {number} filtros.page - Número de página (default: 1)
 * @param {number} filtros.limit - Registros por página (default: 10)
 * @returns {Promise<Object>} Objeto con datos paginados y metadatos
 */
async function obtenerTodos(filtros = {}) {
  const {
    id_producto,
    tipo_movimiento,
    fecha_desde,
    fecha_hasta
  } = filtros;

  const page = parseInt(filtros.page) || 1;
  const limit = parseInt(filtros.limit) || 10;
  const offset = (page - 1) * limit;

  // Query para contar total de registros
  let countQuery = supabase
    .from('movimientos_inventario')
    .select('id_movimiento', { count: 'exact', head: true });

  // Query para obtener datos
  let query = supabase
    .from('movimientos_inventario')
    .select(`
      *,
      productos:id_producto (
        id_producto,
        nombre,
        unidad_medida,
        categorias:id_categoria (
          id_categoria,
          nombre
        )
      )
    `)
    .order('fecha_movimiento', { ascending: false });

  // Aplicar filtros a ambas queries
  if (id_producto) {
    query = query.eq('id_producto', id_producto);
    countQuery = countQuery.eq('id_producto', id_producto);
  }

  if (tipo_movimiento) {
    query = query.eq('tipo_movimiento', tipo_movimiento);
    countQuery = countQuery.eq('tipo_movimiento', tipo_movimiento);
  }

  if (fecha_desde) {
    query = query.gte('fecha_movimiento', fecha_desde);
    countQuery = countQuery.gte('fecha_movimiento', fecha_desde);
  }

  if (fecha_hasta) {
    query = query.lte('fecha_movimiento', fecha_hasta);
    countQuery = countQuery.lte('fecha_movimiento', fecha_hasta);
  }

  // Aplicar paginación
  query = query.range(offset, offset + limit - 1);

  // Ejecutar ambas queries
  const [{ data, error }, { count, error: countError }] = await Promise.all([
    query,
    countQuery
  ]);

  if (error) {
    throw error;
  }

  if (countError) {
    throw countError;
  }

  const totalPages = Math.ceil(count / limit);

  return {
    datos: data || [],
    paginacion: {
      page,
      limit,
      total: count,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

/**
 * Obtiene un movimiento por ID
 * @param {string} id - UUID del movimiento
 * @returns {Promise<Object>} Movimiento encontrado
 */
async function obtenerPorId(id) {
  const { data, error } = await supabase
    .from('movimientos_inventario')
    .select(`
      *,
      productos:id_producto (
        id_producto,
        nombre,
        cantidad_stock,
        unidad_medida,
        categorias:id_categoria (
          id_categoria,
          nombre
        )
      )
    `)
    .eq('id_movimiento', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ErrorNoEncontrado('Movimiento no encontrado');
    }
    throw error;
  }

  return data;
}

/**
 * Obtiene el historial de movimientos de un producto
 * @param {string} id_producto - UUID del producto
 * @param {number} limite - Cantidad de resultados (default: 100)
 * @returns {Promise<Array>} Historial de movimientos
 */
async function obtenerHistorialProducto(id_producto, limite = 100) {
  const { data, error } = await supabase
    .from('movimientos_inventario')
    .select('*')
    .eq('id_producto', id_producto)
    .order('fecha_movimiento', { ascending: false })
    .limit(limite);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Obtiene estadísticas de movimientos de un producto
 * @param {string} id_producto - UUID del producto
 * @returns {Promise<Object>} Estadísticas
 */
async function obtenerEstadisticasProducto(id_producto) {
  // Total de entradas
  const { data: entradas, error: errorEntradas } = await supabase
    .from('movimientos_inventario')
    .select('cantidad')
    .eq('id_producto', id_producto)
    .eq('tipo_movimiento', 'ENTRADA');

  if (errorEntradas) {
    throw errorEntradas;
  }

  // Total de salidas
  const { data: salidas, error: errorSalidas } = await supabase
    .from('movimientos_inventario')
    .select('cantidad')
    .eq('id_producto', id_producto)
    .eq('tipo_movimiento', 'SALIDA');

  if (errorSalidas) {
    throw errorSalidas;
  }

  const totalEntradas = entradas.reduce((sum, mov) => sum + mov.cantidad, 0);
  const totalSalidas = salidas.reduce((sum, mov) => sum + mov.cantidad, 0);

  return {
    total_entradas: totalEntradas,
    total_salidas: totalSalidas,
    movimientos_neto: totalEntradas - totalSalidas,
    cantidad_movimientos_entrada: entradas.length,
    cantidad_movimientos_salida: salidas.length
  };
}

/**
 * Obtiene el reporte de movimientos por fecha
 * @param {Date} fecha_desde - Fecha inicio
 * @param {Date} fecha_hasta - Fecha fin
 * @returns {Promise<Object>} Reporte consolidado
 */
async function obtenerReportePorFecha(fecha_desde, fecha_hasta) {
  const { data, error } = await supabase
    .from('movimientos_inventario')
    .select(`
      *,
      productos:id_producto (
        nombre,
        unidad_medida
      )
    `)
    .gte('fecha_movimiento', fecha_desde)
    .lte('fecha_movimiento', fecha_hasta)
    .order('fecha_movimiento', { ascending: false });

  if (error) {
    throw error;
  }

  // Calcular totales
  const entradas = data.filter(m => m.tipo_movimiento === 'ENTRADA');
  const salidas = data.filter(m => m.tipo_movimiento === 'SALIDA');

  const totalEntradas = entradas.reduce((sum, m) => sum + m.cantidad, 0);
  const totalSalidas = salidas.reduce((sum, m) => sum + m.cantidad, 0);

  return {
    movimientos: data || [],
    periodo: {
      fecha_desde,
      fecha_hasta
    },
    resumen: {
      total_movimientos: data.length,
      total_entradas: entradas.length,
      total_salidas: salidas.length,
      cantidad_entrada: totalEntradas,
      cantidad_salida: totalSalidas,
      diferencia: totalEntradas - totalSalidas
    }
  };
}

/**
 * Obtiene el kardex de un producto (historial detallado con stock)
 * @param {string} id_producto - UUID del producto
 * @param {Date} fecha_desde - Fecha inicio (opcional)
 * @param {Date} fecha_hasta - Fecha fin (opcional)
 * @returns {Promise<Object>} Kardex del producto
 */
async function obtenerKardex(id_producto, fecha_desde = null, fecha_hasta = null) {
  // Obtener información del producto
  const { data: producto, error: errorProducto } = await supabase
    .from('productos')
    .select(`
      id_producto,
      nombre,
      cantidad_stock,
      unidad_medida,
      categorias:id_categoria (
        nombre
      )
    `)
    .eq('id_producto', id_producto)
    .single();

  if (errorProducto) {
    if (errorProducto.code === 'PGRST116') {
      throw new ErrorNoEncontrado('Producto no encontrado');
    }
    throw errorProducto;
  }

  // Obtener movimientos
  let query = supabase
    .from('movimientos_inventario')
    .select('*')
    .eq('id_producto', id_producto)
    .order('fecha_movimiento', { ascending: true });

  if (fecha_desde) {
    query = query.gte('fecha_movimiento', fecha_desde);
  }

  if (fecha_hasta) {
    query = query.lte('fecha_movimiento', fecha_hasta);
  }

  const { data: movimientos, error: errorMovimientos } = await query;

  if (errorMovimientos) {
    throw errorMovimientos;
  }

  // Calcular stock inicial (antes del primer movimiento del rango)
  let stockInicial = 0;
  if (fecha_desde && movimientos.length > 0) {
    // Calcular stock hasta la fecha_desde
    const { data: movimientosAnteriores } = await supabase
      .from('movimientos_inventario')
      .select('tipo_movimiento, cantidad')
      .eq('id_producto', id_producto)
      .lt('fecha_movimiento', fecha_desde);

    if (movimientosAnteriores) {
      stockInicial = movimientosAnteriores.reduce((stock, mov) => {
        return stock + (mov.tipo_movimiento === 'ENTRADA' ? mov.cantidad : -mov.cantidad);
      }, 0);
    }
  }

  // Construir kardex con stock acumulado
  let stockActual = stockInicial;
  const kardex = movimientos.map(movimiento => {
    const cantidad = movimiento.tipo_movimiento === 'ENTRADA' 
      ? movimiento.cantidad 
      : -movimiento.cantidad;
    
    const stockAnterior = stockActual;
    stockActual += cantidad;

    return {
      ...movimiento,
      stock_anterior: stockAnterior,
      stock_actual: stockActual
    };
  });

  return {
    producto,
    stock_inicial: stockInicial,
    stock_final: producto.cantidad_stock,
    kardex
  };
}

/**
 * Cuenta la cantidad de movimientos de un producto
 * @param {string} id_producto - UUID del producto
 * @returns {Promise<number>} Cantidad de movimientos
 */
async function contarMovimientos(id_producto) {
  const { count, error } = await supabase
    .from('movimientos_inventario')
    .select('*', { count: 'exact', head: true })
    .eq('id_producto', id_producto);

  if (error) {
    throw error;
  }

  return count || 0;
}

module.exports = {
  crear,
  obtenerTodos,
  obtenerPorId,
  obtenerHistorialProducto,
  obtenerEstadisticasProducto,
  obtenerReportePorFecha,
  obtenerKardex,
  contarMovimientos
};
