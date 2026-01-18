/**
 * Repository de Créditos
 * Maneja las operaciones de acceso a datos para créditos
 */

const { supabase } = require('../config/database');
const { ErrorBaseDatos, ErrorNoEncontrado } = require('../utils/errores');
const { obtenerFechaGuatemala, formatearISO } = require('../utils/fechas');

/**
 * Crea un nuevo registro de crédito
 */
async function crear(credito) {
  try {
    // Si no se proporciona fecha_inicio, usar la fecha actual de Guatemala
    const fechaInicio = credito.fecha_inicio || formatearISO(obtenerFechaGuatemala());
    
    const { data, error } = await supabase
      .from('creditos')
      .insert([{
        id_venta: credito.id_venta, // Relación con la venta
        id_cliente: credito.id_cliente,
        monto_total: credito.monto_total,
        saldo_pendiente: credito.saldo_pendiente || credito.monto_total,
        fecha_inicio: fechaInicio,
        fecha_vencimiento: credito.fecha_vencimiento,
        dias_credito: credito.dias_credito,
        estado: credito.estado || 'ACTIVO'
      }])
      .select(`
        *,
        clientes:id_cliente (
          id_cliente,
          nombre,
          apellido,
          tipo_cliente,
          limite_credito,
          telefono,
          correo
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new ErrorBaseDatos(`Error al crear crédito: ${error.message}`);
  }
}

/**
 * Obtiene un crédito por ID
 */
async function obtenerPorId(id_credito) {
  try {
    const { data, error } = await supabase
      .from('creditos')
      .select(`
        *,
        clientes:id_cliente (
          id_cliente,
          nombre,
          apellido,
          tipo_cliente,
          limite_credito,
          telefono,
          correo
        )
      `)
      .eq('id_credito', id_credito)
      .single();

    if (error || !data) {
      throw new ErrorNoEncontrado('Crédito no encontrado');
    }

    return data;
  } catch (error) {
    if (error instanceof ErrorNoEncontrado) throw error;
    throw new ErrorBaseDatos(`Error al obtener crédito: ${error.message}`);
  }
}

/**
 * Obtiene todos los créditos con filtros opcionales y paginación
 * @param {Object} filtros - Filtros de búsqueda
 * @param {string} filtros.id_cliente - Filtrar por cliente
 * @param {string} filtros.estado - Filtrar por estado (ACTIVO/VENCIDO/PAGADO)
 * @param {Date} filtros.fecha_desde - Fecha inicio
 * @param {Date} filtros.fecha_hasta - Fecha fin
 * @param {number} filtros.page - Número de página (default: 1)
 * @param {number} filtros.limit - Registros por página (default: 10)
 * @returns {Promise<Object>} Objeto con datos paginados y metadatos
 */
async function obtenerTodos(filtros = {}) {
  try {
    const page = parseInt(filtros.page) || 1;
    const limit = parseInt(filtros.limit) || 10;
    const offset = (page - 1) * limit;

    // Query para contar total de registros
    let countQuery = supabase
      .from('creditos')
      .select('id_credito', { count: 'exact', head: true });

    // Query para obtener datos
    let query = supabase
      .from('creditos')
      .select(`
        *,
        clientes:id_cliente (
          id_cliente,
          nombre,
          apellido,
          tipo_cliente,
          limite_credito
        )
      `);

    // Aplicar filtros a ambas queries
    if (filtros.id_cliente) {
      query = query.eq('id_cliente', filtros.id_cliente);
      countQuery = countQuery.eq('id_cliente', filtros.id_cliente);
    }

    if (filtros.estado) {
      query = query.eq('estado', filtros.estado);
      countQuery = countQuery.eq('estado', filtros.estado);
    }

    if (filtros.fecha_desde) {
      query = query.gte('fecha_inicio', filtros.fecha_desde);
      countQuery = countQuery.gte('fecha_inicio', filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      query = query.lte('fecha_inicio', filtros.fecha_hasta);
      countQuery = countQuery.lte('fecha_inicio', filtros.fecha_hasta);
    }

    // Ordenar y paginar
    query = query
      .order('fecha_inicio', { ascending: false })
      .range(offset, offset + limit - 1);

    // Ejecutar ambas queries
    const [{ data, error }, { count, error: countError }] = await Promise.all([
      query,
      countQuery
    ]);

    if (error) throw error;

    if (countError) throw countError;

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
  } catch (error) {
    throw new ErrorBaseDatos(`Error al obtener créditos: ${error.message}`);
  }
}

/**
 * Actualiza el saldo pendiente de un crédito
 */
async function actualizarSaldo(id_credito, nuevoSaldo) {
  try {
    // Determinar el estado según el saldo
    let estado = 'ACTIVO';
    if (nuevoSaldo <= 0) {
      estado = 'PAGADO';
    }

    const { data, error } = await supabase
      .from('creditos')
      .update({
        saldo_pendiente: nuevoSaldo,
        estado: estado
      })
      .eq('id_credito', id_credito)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new ErrorBaseDatos(`Error al actualizar saldo del crédito: ${error.message}`);
  }
}

/**
 * Obtiene créditos vencidos (fecha_vencimiento < hoy y estado ACTIVO)
 */
async function obtenerVencidos() {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('creditos')
      .select(`
        *,
        clientes:id_cliente (
          id_cliente,
          nombre,
          apellido,
          telefono,
          correo,
          tipo_cliente,
          limite_credito
        )
      `)
      .eq('estado', 'ACTIVO')
      .lt('fecha_vencimiento', hoy)
      .order('fecha_vencimiento', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new ErrorBaseDatos(`Error al obtener créditos vencidos: ${error.message}`);
  }
}

/**
 * Obtiene el total de deuda de un cliente
 */
async function obtenerDeudaCliente(id_cliente) {
  try {
    const { data, error } = await supabase
      .from('creditos')
      .select('saldo_pendiente')
      .eq('id_cliente', id_cliente)
      .in('estado', ['ACTIVO', 'VENCIDO']);

    if (error) throw error;

    const deudaTotal = (data || []).reduce((sum, credito) => {
      return sum + parseFloat(credito.saldo_pendiente || 0);
    }, 0);

    return deudaTotal;
  } catch (error) {
    throw new ErrorBaseDatos(`Error al calcular deuda del cliente: ${error.message}`);
  }
}

/**
 * Obtiene un crédito por ID de venta
 */
async function obtenerPorVenta(id_venta) {
  try {
    const { data, error } = await supabase
      .from('creditos')
      .select(`
        *,
        clientes:id_cliente (
          id_cliente,
          nombre,
          apellido,
          tipo_cliente,
          limite_credito,
          telefono,
          correo
        )
      `)
      .eq('id_venta', id_venta)
      .single();

    if (error || !data) {
      throw new ErrorNoEncontrado('Crédito asociado a la venta no encontrado');
    }

    return data;
  } catch (error) {
    if (error instanceof ErrorNoEncontrado) throw error;
    throw new ErrorBaseDatos(`Error al obtener crédito por venta: ${error.message}`);
  }
}

/**
 * Anula un crédito (cambia estado a ANULADO)
 */
async function anular(id_credito) {
  try {
    const { data, error } = await supabase
      .from('creditos')
      .update({
        estado: 'ANULADO',
        saldo_pendiente: 0 // Al anular, el saldo pendiente se pone en 0
      })
      .eq('id_credito', id_credito)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new ErrorBaseDatos(`Error al anular crédito: ${error.message}`);
  }
}

module.exports = {
  crear,
  obtenerPorId,
  obtenerTodos,
  actualizarSaldo,
  obtenerVencidos,
  obtenerDeudaCliente,
  obtenerPorVenta,
  anular
};
