/**
 * Repository de Ventas
 * Gestiona el acceso a datos de ventas
 */

const { supabase } = require('../config/database');
const { ErrorNoEncontrado } = require('../utils/errores');
const { obtenerFechaGuatemala, formatearISO } = require('../utils/fechas');

/**
 * Crea una nueva venta (solo encabezado)
 * @param {Object} venta - Datos de la venta
 * @param {string} venta.id_cliente - UUID del cliente
 * @param {string} venta.id_usuario - UUID del usuario que registra
 * @param {string} venta.tipo_venta - CONTADO o CREDITO
 * @param {number} venta.subtotal - Subtotal antes del descuento
 * @param {string} venta.descuento_tipo - Tipo de descuento (NINGUNO, PORCENTAJE, MONTO)
 * @param {number} venta.descuento_valor - Valor del descuento
 * @param {number} venta.descuento_monto - Monto del descuento calculado
 * @param {number} venta.total - Total después del descuento
 * @returns {Promise<Object>} Venta creada
 */
async function crear(venta) {
  // Obtener la fecha actual en zona horaria de Guatemala
  const fechaVenta = formatearISO(obtenerFechaGuatemala());

  const { data, error } = await supabase
    .from('ventas')
    .insert({
      id_cliente: venta.id_cliente,
      id_usuario: venta.id_usuario,
      tipo_venta: venta.tipo_venta,
      subtotal: venta.subtotal,
      descuento_tipo: venta.descuento_tipo || 'NINGUNO',
      descuento_valor: venta.descuento_valor || 0,
      descuento_monto: venta.descuento_monto || 0,
      total: venta.total,
      estado: 'ACTIVA',
      fecha_venta: fechaVenta
    })
    .select(`
      *,
      clientes:id_cliente (
        id_cliente,
        nombre,
        apellido,
        tipo_cliente
      ),
      usuarios:id_usuario (
        id_usuario,
        nombre
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Obtiene todas las ventas con filtros y paginación
 * @param {Object} filtros - Filtros de búsqueda
 * @param {string} filtros.id_cliente - Filtrar por cliente
 * @param {string} filtros.id_usuario - Filtrar por usuario/vendedor
 * @param {string} filtros.tipo_venta - Filtrar por tipo (CONTADO/CREDITO)
 * @param {string} filtros.estado - Filtrar por estado (ACTIVA/ANULADA)
 * @param {Date} filtros.fecha_desde - Fecha inicio
 * @param {Date} filtros.fecha_hasta - Fecha fin
 * @param {number} filtros.page - Número de página (default: 1)
 * @param {number} filtros.limit - Registros por página (default: 10)
 * @returns {Promise<Object>} Objeto con datos paginados y metadatos
 */
async function obtenerTodos(filtros = {}) {
  const {
    id_cliente,
    id_usuario,
    tipo_venta,
    estado,
    fecha_desde,
    fecha_hasta,
    busqueda
  } = filtros;

  const page = parseInt(filtros.page) || 1;
  const limit = parseInt(filtros.limit) || 10;
  const offset = (page - 1) * limit;

  // Query para contar total de registros
  let countQuery = supabase
    .from('ventas')
    .select('id_venta', { count: 'exact', head: true });

  // Query para obtener datos
  let query = supabase
    .from('ventas')
    .select(`
      *,
      clientes:id_cliente (
        id_cliente,
        nombre,
        apellido,
        tipo_cliente
      ),
      usuarios:id_usuario (
        id_usuario,
        nombre
      )
    `)
    .order('fecha_venta', { ascending: false });

  // Aplicar filtros a ambas queries
  if (id_cliente) {
    query = query.eq('id_cliente', id_cliente);
    countQuery = countQuery.eq('id_cliente', id_cliente);
  }

  if (id_usuario) {
    query = query.eq('id_usuario', id_usuario);
    countQuery = countQuery.eq('id_usuario', id_usuario);
  }

  if (tipo_venta) {
    query = query.eq('tipo_venta', tipo_venta);
    countQuery = countQuery.eq('tipo_venta', tipo_venta);
  }

  if (estado) {
    query = query.eq('estado', estado);
    countQuery = countQuery.eq('estado', estado);
  }

  if (fecha_desde) {
    query = query.gte('fecha_venta', fecha_desde);
    countQuery = countQuery.gte('fecha_venta', fecha_desde);
  }

  if (fecha_hasta) {
    query = query.lte('fecha_venta', fecha_hasta);
    countQuery = countQuery.lte('fecha_venta', fecha_hasta);
  }

  // Aplicar paginación
  query = query.range(offset, offset + limit - 1);

  // Ejecutar queries
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

  // Si hay búsqueda, filtrar por nombre de cliente en memoria (Supabase no permite filtrar joins)
  let datosFiltrados = data || [];
  if (busqueda && busqueda.trim() !== '') {
    const terminoBusqueda = busqueda.toLowerCase().trim();
    datosFiltrados = datosFiltrados.filter(venta => {
      const nombreCliente = `${venta.clientes?.nombre || ''} ${venta.clientes?.apellido || ''}`.toLowerCase();
      return nombreCliente.includes(terminoBusqueda);
    });
  }

  const totalPages = Math.ceil(count / limit);

  return {
    datos: datosFiltrados,
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
 * Obtiene una venta por ID con sus detalles
 * @param {string} id - UUID de la venta
 * @returns {Promise<Object>} Venta encontrada
 */
async function obtenerPorId(id) {
  const { data, error } = await supabase
    .from('ventas')
    .select(`
      *,
      clientes:id_cliente (
        id_cliente,
        nombre,
        apellido,
        tipo_cliente,
        telefono,
        correo
      ),
      usuarios:id_usuario (
        id_usuario,
        nombre
      )
    `)
    .eq('id_venta', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ErrorNoEncontrado('Venta no encontrada');
    }
    throw error;
  }

  return data;
}

/**
 * Anula una venta (cambia estado a ANULADA)
 * @param {string} id - UUID de la venta
 * @returns {Promise<Object>} Venta anulada
 */
async function anular(id) {
  const { data, error } = await supabase
    .from('ventas')
    .update({ estado: 'ANULADA' })
    .eq('id_venta', id)
    .eq('estado', 'ACTIVA') // Solo anular si está activa
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ErrorNoEncontrado('Venta no encontrada o ya está anulada');
    }
    throw error;
  }

  return data;
}

/**
 * Obtiene el total de ventas por cliente
 * @param {string} id_cliente - UUID del cliente
 * @returns {Promise<Object>} Estadísticas de ventas del cliente
 */
async function obtenerTotalesPorCliente(id_cliente) {
  const { data, error } = await supabase
    .from('ventas')
    .select('total, tipo_venta, estado')
    .eq('id_cliente', id_cliente);

  if (error) {
    throw error;
  }

  const ventas = data || [];
  const ventasActivas = ventas.filter(v => v.estado === 'ACTIVA');

  return {
    total_ventas: ventas.length,
    ventas_activas: ventasActivas.length,
    ventas_anuladas: ventas.filter(v => v.estado === 'ANULADA').length,
    monto_total: ventasActivas.reduce((sum, v) => sum + parseFloat(v.total), 0),
    ventas_contado: ventasActivas.filter(v => v.tipo_venta === 'CONTADO').length,
    ventas_credito: ventasActivas.filter(v => v.tipo_venta === 'CREDITO').length
  };
}

/**
 * Obtiene el total de ventas por usuario/vendedor
 * @param {string} id_usuario - UUID del usuario
 * @returns {Promise<Object>} Estadísticas de ventas del vendedor
 */
async function obtenerTotalesPorUsuario(id_usuario) {
  const { data, error } = await supabase
    .from('ventas')
    .select('total, tipo_venta, estado')
    .eq('id_usuario', id_usuario);

  if (error) {
    throw error;
  }

  const ventas = data || [];
  const ventasActivas = ventas.filter(v => v.estado === 'ACTIVA');

  return {
    total_ventas: ventas.length,
    ventas_activas: ventasActivas.length,
    ventas_anuladas: ventas.filter(v => v.estado === 'ANULADA').length,
    monto_total: ventasActivas.reduce((sum, v) => sum + parseFloat(v.total), 0),
    ventas_contado: ventasActivas.filter(v => v.tipo_venta === 'CONTADO').length,
    ventas_credito: ventasActivas.filter(v => v.tipo_venta === 'CREDITO').length
  };
}

/**
 * Obtiene dashboard de ventas del día
 * @returns {Promise<Object>} Estadísticas del día
 */
async function obtenerDashboardDia() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  const { data, error } = await supabase
    .from('ventas')
    .select('total, tipo_venta, estado')
    .gte('fecha_venta', hoy.toISOString())
    .lt('fecha_venta', manana.toISOString());

  if (error) {
    throw error;
  }

  const ventas = data || [];
  const ventasActivas = ventas.filter(v => v.estado === 'ACTIVA');

  return {
    fecha: hoy.toISOString().split('T')[0],
    total_ventas: ventas.length,
    ventas_activas: ventasActivas.length,
    ventas_anuladas: ventas.filter(v => v.estado === 'ANULADA').length,
    monto_total: ventasActivas.reduce((sum, v) => sum + parseFloat(v.total), 0),
    ventas_contado: ventasActivas.filter(v => v.tipo_venta === 'CONTADO').length,
    ventas_credito: ventasActivas.filter(v => v.tipo_venta === 'CREDITO').length,
    monto_contado: ventasActivas
      .filter(v => v.tipo_venta === 'CONTADO')
      .reduce((sum, v) => sum + parseFloat(v.total), 0),
    monto_credito: ventasActivas
      .filter(v => v.tipo_venta === 'CREDITO')
      .reduce((sum, v) => sum + parseFloat(v.total), 0)
  };
}

/**
 * Obtiene reporte de ventas por período
 * @param {Date} fecha_desde - Fecha inicio
 * @param {Date} fecha_hasta - Fecha fin
 * @returns {Promise<Object>} Reporte consolidado
 */
async function obtenerReportePorPeriodo(fecha_desde, fecha_hasta) {
  const { data, error } = await supabase
    .from('ventas')
    .select(`
      *,
      clientes:id_cliente (
        nombre,
        apellido
      ),
      usuarios:id_usuario (
        nombre
      )
    `)
    .gte('fecha_venta', fecha_desde)
    .lte('fecha_venta', fecha_hasta)
    .order('fecha_venta', { ascending: false });

  if (error) {
    throw error;
  }

  const ventas = data || [];
  const ventasActivas = ventas.filter(v => v.estado === 'ACTIVA');

  return {
    ventas,
    periodo: {
      fecha_desde,
      fecha_hasta
    },
    resumen: {
      total_ventas: ventas.length,
      ventas_activas: ventasActivas.length,
      ventas_anuladas: ventas.filter(v => v.estado === 'ANULADA').length,
      monto_total: ventasActivas.reduce((sum, v) => sum + parseFloat(v.total), 0),
      ventas_contado: ventasActivas.filter(v => v.tipo_venta === 'CONTADO').length,
      ventas_credito: ventasActivas.filter(v => v.tipo_venta === 'CREDITO').length,
      monto_contado: ventasActivas
        .filter(v => v.tipo_venta === 'CONTADO')
        .reduce((sum, v) => sum + parseFloat(v.total), 0),
      monto_credito: ventasActivas
        .filter(v => v.tipo_venta === 'CREDITO')
        .reduce((sum, v) => sum + parseFloat(v.total), 0)
    }
  };
}

module.exports = {
  crear,
  obtenerTodos,
  obtenerPorId,
  anular,
  obtenerTotalesPorCliente,
  obtenerTotalesPorUsuario,
  obtenerDashboardDia,
  obtenerReportePorPeriodo
};
