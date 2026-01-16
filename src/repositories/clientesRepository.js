/**
 * Repository de Clientes
 * Gestiona el acceso a datos de clientes con sistema de papelera
 */

const { supabase } = require('../config/database');
const { ErrorNoEncontrado } = require('../utils/errores');

/**
 * Obtiene todos los clientes activos (no eliminados) con filtros y paginación
 * @param {Object} filtros - Filtros de búsqueda
 * @param {string} filtros.busqueda - Búsqueda por nombre, apellido, teléfono o correo
 * @param {string} filtros.tipo_cliente - Filtrar por tipo (CONTADO/CREDITO)
 * @param {boolean} filtros.soloActivos - Si true, solo clientes con estado=true
 * @param {number} filtros.page - Número de página (default: 1)
 * @param {number} filtros.limit - Registros por página (default: 10)
 * @returns {Promise<Object>} Objeto con datos paginados y metadatos
 */
async function obtenerTodos(filtros = {}) {
  const { busqueda, tipo_cliente, soloActivos = true } = filtros;
  const page = parseInt(filtros.page) || 1;
  const limit = parseInt(filtros.limit) || 10;
  const offset = (page - 1) * limit;

  // Query para contar total de registros
  let countQuery = supabase
    .from('clientes')
    .select('id_cliente', { count: 'exact', head: true })
    .is('deleted_at', null);

  // Query para obtener datos
  let query = supabase
    .from('clientes')
    .select('*')
    .is('deleted_at', null)
    .order('fecha_registro', { ascending: false });

  // Aplicar filtros a ambas queries
  // Filtrar solo activos
  if (soloActivos) {
    query = query.eq('estado', true);
    countQuery = countQuery.eq('estado', true);
  }

  // Búsqueda por texto
  if (busqueda) {
    const searchPattern = `nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%,correo.ilike.%${busqueda}%`;
    query = query.or(searchPattern);
    countQuery = countQuery.or(searchPattern);
  }

  // Filtrar por tipo de cliente
  if (tipo_cliente) {
    query = query.eq('tipo_cliente', tipo_cliente);
    countQuery = countQuery.eq('tipo_cliente', tipo_cliente);
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
 * Obtiene un cliente por ID
 * @param {string} id - UUID del cliente
 * @returns {Promise<Object>} Cliente encontrado
 */
async function obtenerPorId(id) {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id_cliente', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ErrorNoEncontrado('Cliente no encontrado');
    }
    throw error;
  }

  return data;
}

/**
 * Crea un nuevo cliente
 * @param {Object} cliente - Datos del cliente
 * @returns {Promise<Object>} Cliente creado
 */
async function crear(cliente) {
  const { data, error } = await supabase
    .from('clientes')
    .insert(cliente)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Actualiza un cliente existente
 * @param {string} id - UUID del cliente
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>} Cliente actualizado
 */
async function actualizar(id, datos) {
  const { data, error } = await supabase
    .from('clientes')
    .update(datos)
    .eq('id_cliente', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ErrorNoEncontrado('Cliente no encontrado');
    }
    throw error;
  }

  return data;
}

/**
 * Mueve un cliente a la papelera (soft delete)
 * @param {string} id - UUID del cliente
 * @returns {Promise<Object>} Cliente eliminado
 */
async function moverPapelera(id) {
  const { data, error } = await supabase
    .from('clientes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id_cliente', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ErrorNoEncontrado('Cliente no encontrado o ya está en papelera');
    }
    throw error;
  }

  return data;
}

/**
 * Obtiene clientes en papelera
 * @returns {Promise<Array>} Lista de clientes eliminados
 */
async function obtenerPapelera() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Restaura un cliente desde la papelera
 * @param {string} id - UUID del cliente
 * @returns {Promise<Object>} Cliente restaurado
 */
async function restaurarDePapelera(id) {
  const { data, error } = await supabase
    .from('clientes')
    .update({ deleted_at: null })
    .eq('id_cliente', id)
    .not('deleted_at', 'is', null)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ErrorNoEncontrado('Cliente no encontrado en papelera');
    }
    throw error;
  }

  return data;
}

/**
 * Elimina permanentemente un cliente
 * @param {string} id - UUID del cliente
 * @returns {Promise<Object>} Cliente eliminado
 */
async function eliminarPermanentemente(id) {
  const { data, error } = await supabase
    .from('clientes')
    .delete()
    .eq('id_cliente', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ErrorNoEncontrado('Cliente no encontrado');
    }
    throw error;
  }

  return data;
}

/**
 * Activa un cliente
 * @param {string} id - UUID del cliente
 * @returns {Promise<Object>} Cliente activado
 */
async function activar(id) {
  return await actualizar(id, { estado: true });
}

/**
 * Desactiva un cliente
 * @param {string} id - UUID del cliente
 * @returns {Promise<Object>} Cliente desactivado
 */
async function desactivar(id) {
  return await actualizar(id, { estado: false });
}

/**
 * Verifica si un cliente tiene créditos activos
 * @param {string} id_cliente - UUID del cliente
 * @returns {Promise<boolean>} true si tiene créditos activos
 */
async function tieneCreditosActivos(id_cliente) {
  const { data, error } = await supabase
    .from('creditos')
    .select('id_credito')
    .eq('id_cliente', id_cliente)
    .in('estado', ['ACTIVO', 'VENCIDO'])
    .limit(1);

  if (error) {
    throw error;
  }

  return data && data.length > 0;
}

/**
 * Verifica si un cliente tiene ventas recientes (últimos 30 días)
 * @param {string} id_cliente - UUID del cliente
 * @returns {Promise<boolean>} true si tiene ventas recientes
 */
async function tieneVentasRecientes(id_cliente) {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - 30);

  const { data, error } = await supabase
    .from('ventas')
    .select('id_venta')
    .eq('id_cliente', id_cliente)
    .gte('fecha_venta', fechaLimite.toISOString())
    .limit(1);

  if (error) {
    // Si la tabla ventas no existe aún, retornar false
    if (error.code === '42P01') {
      return false;
    }
    throw error;
  }

  return data && data.length > 0;
}

/**
 * Cuenta la cantidad de ventas de un cliente
 * @param {string} id_cliente - UUID del cliente
 * @returns {Promise<number>} Cantidad de ventas
 */
async function contarVentas(id_cliente) {
  const { count, error } = await supabase
    .from('ventas')
    .select('*', { count: 'exact', head: true })
    .eq('id_cliente', id_cliente);

  if (error) {
    // Si la tabla ventas no existe aún, retornar 0
    if (error.code === '42P01') {
      return 0;
    }
    throw error;
  }

  return count || 0;
}

/**
 * Obtiene clientes por tipo
 * @param {string} tipo - CONTADO o CREDITO
 * @returns {Promise<Array>} Lista de clientes del tipo especificado
 */
async function obtenerPorTipo(tipo) {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('tipo_cliente', tipo)
    .is('deleted_at', null)
    .eq('estado', true)
    .order('nombre', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Obtiene el historial de créditos de un cliente
 * @param {string} id_cliente - UUID del cliente
 * @returns {Promise<Array>} Lista de créditos
 */
async function obtenerCreditosCliente(id_cliente) {
  const { data, error } = await supabase
    .from('creditos')
    .select('*')
    .eq('id_cliente', id_cliente)
    .order('fecha_inicio', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Obtiene el historial de ventas/compras de un cliente
 * @param {string} id_cliente - UUID del cliente
 * @param {number} limite - Cantidad de resultados (default: 50)
 * @returns {Promise<Array>} Lista de ventas
 */
async function obtenerVentasCliente(id_cliente, limite = 50) {
  const { data, error } = await supabase
    .from('ventas')
    .select(`
      *,
      usuarios:id_usuario (
        id_usuario,
        nombre,
        apellido
      )
    `)
    .eq('id_cliente', id_cliente)
    .order('fecha_venta', { ascending: false })
    .limit(limite);

  if (error) {
    // Si la tabla ventas no existe aún, retornar array vacío
    if (error.code === '42P01') {
      return [];
    }
    throw error;
  }

  return data || [];
}

/**
 * Calcula la deuda total de un cliente (créditos activos y vencidos)
 * @param {string} id_cliente - UUID del cliente
 * @returns {Promise<Object>} Reporte de deuda
 */
async function obtenerDeudaCliente(id_cliente) {
  // Obtener cliente
  const { data: cliente, error: errorCliente } = await supabase
    .from('clientes')
    .select('id_cliente, nombre, apellido, tipo_cliente, limite_credito')
    .eq('id_cliente', id_cliente)
    .is('deleted_at', null)
    .single();

  if (errorCliente) {
    throw errorCliente;
  }

  // Si es cliente de contado, no tiene deuda
  if (cliente.tipo_cliente === 'CONTADO') {
    return {
      cliente,
      creditos: [],
      total_creditos: 0,
      deuda_total: 0,
      deuda_activa: 0,
      deuda_vencida: 0,
      credito_disponible: 0,
      porcentaje_utilizado: 0
    };
  }

  // Obtener créditos activos y vencidos
  const { data: creditos, error: errorCreditos } = await supabase
    .from('creditos')
    .select('*')
    .eq('id_cliente', id_cliente)
    .in('estado', ['ACTIVO', 'VENCIDO'])
    .order('fecha_vencimiento', { ascending: true });

  if (errorCreditos) {
    throw errorCreditos;
  }

  // Calcular totales
  const creditosActivos = creditos?.filter(c => c.estado === 'ACTIVO') || [];
  const creditosVencidos = creditos?.filter(c => c.estado === 'VENCIDO') || [];

  const deudaActiva = creditosActivos.reduce((sum, c) => sum + parseFloat(c.saldo_pendiente || 0), 0);
  const deudaVencida = creditosVencidos.reduce((sum, c) => sum + parseFloat(c.saldo_pendiente || 0), 0);
  const deudaTotal = deudaActiva + deudaVencida;

  const limiteCredito = parseFloat(cliente.limite_credito || 0);
  const creditoDisponible = Math.max(0, limiteCredito - deudaTotal);
  const porcentajeUtilizado = limiteCredito > 0 ? (deudaTotal / limiteCredito) * 100 : 0;

  return {
    cliente,
    creditos: creditos || [],
    total_creditos: creditos?.length || 0,
    deuda_total: deudaTotal,
    deuda_activa: deudaActiva,
    deuda_vencida: deudaVencida,
    credito_disponible: creditoDisponible,
    limite_credito: limiteCredito,
    porcentaje_utilizado: Math.round(porcentajeUtilizado * 100) / 100,
    en_mora: deudaVencida > 0
  };
}

/**
 * Verifica si existe un cliente con el mismo correo
 * @param {string} correo - Correo a verificar
 * @param {string} excluirId - ID del cliente a excluir (para actualizaciones)
 * @returns {Promise<boolean>} true si existe
 */
async function existeCorreo(correo, excluirId = null) {
  if (!correo) return false;

  let query = supabase
    .from('clientes')
    .select('id_cliente')
    .eq('correo', correo)
    .is('deleted_at', null)
    .limit(1);

  if (excluirId) {
    query = query.neq('id_cliente', excluirId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data && data.length > 0;
}

module.exports = {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  moverPapelera,
  obtenerPapelera,
  restaurarDePapelera,
  eliminarPermanentemente,
  activar,
  desactivar,
  tieneCreditosActivos,
  tieneVentasRecientes,
  contarVentas,
  obtenerPorTipo,
  obtenerCreditosCliente,
  obtenerVentasCliente,
  obtenerDeudaCliente,
  existeCorreo
};
