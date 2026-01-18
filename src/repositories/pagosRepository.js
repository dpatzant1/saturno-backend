/**
 * Repository de Pagos de Crédito
 * Maneja las operaciones de acceso a datos para pagos de crédito
 */

const { supabase } = require('../config/database');
const { ErrorBaseDatos, ErrorNoEncontrado } = require('../utils/errores');
const { obtenerFechaGuatemala, formatearISO } = require('../utils/fechas');

/**
 * Registra un nuevo pago de crédito
 */
async function crear(pago) {
  try {
    // Obtener la fecha actual en zona horaria de Guatemala
    const fechaPago = formatearISO(obtenerFechaGuatemala());

    const { data, error } = await supabase
      .from('pagos_credito')
      .insert([{
        id_credito: pago.id_credito,
        monto_pagado: pago.monto_pagado,
        metodo_pago: pago.metodo_pago || null,
        observaciones: pago.observaciones || null,
        saldo_despues_pago: pago.saldo_despues_pago,
        id_usuario: pago.id_usuario,
        fecha_pago: fechaPago
      }])
      .select(`
        *,
        creditos:id_credito (
          id_credito,
          monto_total,
          saldo_pendiente,
          estado,
          clientes:id_cliente (
            id_cliente,
            nombre,
            apellido
          )
        ),
        usuarios:id_usuario (
          id_usuario,
          nombre
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new ErrorBaseDatos(`Error al registrar pago: ${error.message}`);
  }
}

/**
 * Obtiene un pago por ID
 */
async function obtenerPorId(id_pago) {
  try {
    const { data, error } = await supabase
      .from('pagos_credito')
      .select(`
        *,
        creditos:id_credito (
          id_credito,
          monto_total,
          saldo_pendiente,
          fecha_inicio,
          fecha_vencimiento,
          estado,
          clientes:id_cliente (
            id_cliente,
            nombre,
            apellido,
            tipo_cliente
          )
        )
      `)
      .eq('id_pago', id_pago)
      .single();

    if (error || !data) {
      throw new ErrorNoEncontrado('Pago no encontrado');
    }

    return data;
  } catch (error) {
    if (error instanceof ErrorNoEncontrado) throw error;
    throw new ErrorBaseDatos(`Error al obtener pago: ${error.message}`);
  }
}

/**
 * Obtiene todos los pagos de un crédito específico
 */
async function obtenerPorCredito(id_credito) {
  try {
    const { data, error } = await supabase
      .from('pagos_credito')
      .select(`
        *,
        usuarios:id_usuario (
          id_usuario,
          nombre
        )
      `)
      .eq('id_credito', id_credito)
      .order('fecha_pago', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new ErrorBaseDatos(`Error al obtener pagos del crédito: ${error.message}`);
  }
}

/**
 * Obtiene todos los pagos con filtros
 */
async function obtenerTodos(filtros = {}) {
  try {
    let query = supabase
      .from('pagos_credito')
      .select(`
        *,
        creditos:id_credito (
          id_credito,
          monto_total,
          saldo_pendiente,
          estado,
          clientes:id_cliente (
            id_cliente,
            nombre,
            apellido
          )
        )
      `, { count: 'exact' });

    // Filtro por crédito
    if (filtros.id_credito) {
      query = query.eq('id_credito', filtros.id_credito);
    }

    // Filtro por fecha
    if (filtros.fecha_desde) {
      query = query.gte('fecha_pago', filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      query = query.lte('fecha_pago', filtros.fecha_hasta);
    }

    // Filtro por método de pago
    if (filtros.metodo_pago) {
      query = query.eq('metodo_pago', filtros.metodo_pago);
    }

    // Ordenar por fecha descendente
    query = query.order('fecha_pago', { ascending: false });

    // Paginación
    const limite = filtros.limite || 50;
    const offset = filtros.offset || 0;
    query = query.range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      pagos: data || [],
      total: count || 0,
      limite,
      offset
    };
  } catch (error) {
    throw new ErrorBaseDatos(`Error al obtener pagos: ${error.message}`);
  }
}

/**
 * Calcula el total de pagos realizados a un crédito
 */
async function obtenerTotalPagado(id_credito) {
  try {
    const { data, error } = await supabase
      .from('pagos_credito')
      .select('monto_pagado')
      .eq('id_credito', id_credito);

    if (error) throw error;

    const totalPagado = (data || []).reduce((sum, pago) => {
      return sum + parseFloat(pago.monto_pagado || 0);
    }, 0);

    return totalPagado;
  } catch (error) {
    throw new ErrorBaseDatos(`Error al calcular total pagado: ${error.message}`);
  }
}

/**
 * Obtiene el historial completo de pagos de un cliente
 */
async function obtenerHistorialPorCliente(id_cliente, filtros = {}) {
  try {
    let query = supabase
      .from('pagos_credito')
      .select(`
        *,
        creditos!inner (
          id_credito,
          monto_total,
          fecha_inicio,
          fecha_vencimiento,
          id_cliente
        )
      `)
      .eq('creditos.id_cliente', id_cliente);

    // Filtro por fecha
    if (filtros.fecha_desde) {
      query = query.gte('fecha_pago', filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      query = query.lte('fecha_pago', filtros.fecha_hasta);
    }

    query = query.order('fecha_pago', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new ErrorBaseDatos(`Error al obtener historial de pagos del cliente: ${error.message}`);
  }
}

module.exports = {
  crear,
  obtenerPorId,
  obtenerPorCredito,
  obtenerTodos,
  obtenerTotalPagado,
  obtenerHistorialPorCliente
};
