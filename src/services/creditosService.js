/**
 * Servicio de Créditos
 * Gestiona la lógica de negocio para créditos
 */

const creditosRepository = require('../repositories/creditosRepository');
const pagosRepository = require('../repositories/pagosRepository');
const clientesRepository = require('../repositories/clientesRepository');
const { supabase } = require('../config/database');
const { 
  ErrorValidacion, 
  ErrorConflicto,
  ErrorNoEncontrado 
} = require('../utils/errores');

/**
 * Estados de crédito permitidos
 */
const ESTADOS_CREDITO = {
  ACTIVO: 'ACTIVO',
  PAGADO: 'PAGADO',
  VENCIDO: 'VENCIDO'
};

/**
 * Crea un nuevo crédito
 */
async function crearCredito(datos) {
  // Validar cliente
  const cliente = await clientesRepository.obtenerPorId(datos.id_cliente);
  
  if (cliente.tipo_cliente !== 'CREDITO') {
    throw new ErrorConflicto('Solo los clientes de tipo CREDITO pueden tener créditos');
  }

  // Validar fechas
  const fechaInicio = new Date(datos.fecha_inicio);
  const fechaVencimiento = new Date(datos.fecha_vencimiento);

  if (fechaVencimiento <= fechaInicio) {
    throw new ErrorValidacion('La fecha de vencimiento debe ser posterior a la fecha de inicio');
  }

  // Validar monto
  if (!datos.monto_total || datos.monto_total <= 0) {
    throw new ErrorValidacion('El monto total debe ser mayor a 0');
  }

  // Verificar límite de crédito disponible
  const deudaActual = await creditosRepository.obtenerDeudaCliente(datos.id_cliente);
  const disponible = parseFloat(cliente.limite_credito || 0) - deudaActual;

  if (disponible < datos.monto_total) {
    throw new ErrorConflicto(
      `Crédito excede el límite disponible. ` +
      `Disponible: $${disponible.toFixed(2)}, ` +
      `Solicitado: $${datos.monto_total.toFixed(2)}`
    );
  }

  return await creditosRepository.crear({
    id_cliente: datos.id_cliente,
    monto_total: datos.monto_total,
    saldo_pendiente: datos.monto_total,
    fecha_inicio: datos.fecha_inicio,
    fecha_vencimiento: datos.fecha_vencimiento,
    estado: ESTADOS_CREDITO.ACTIVO
  });
}

/**
 * Obtiene un crédito por ID
 */
async function obtenerCreditoPorId(id_credito) {
  const credito = await creditosRepository.obtenerPorId(id_credito);
  const pagos = await pagosRepository.obtenerPorCredito(id_credito);

  // Calcular credito_disponible del cliente
  let credito_disponible = 0;
  if (credito.clientes) {
    const limiteCredito = parseFloat(credito.clientes.limite_credito || 0);
    
    // Sumar saldos pendientes de créditos ACTIVO y VENCIDO del cliente
    const { data: creditosCliente } = await supabase
      .from('creditos')
      .select('saldo_pendiente')
      .eq('id_cliente', credito.clientes.id_cliente)
      .in('estado', ['ACTIVO', 'VENCIDO']);
    
    const deudaTotal = (creditosCliente || []).reduce((sum, c) => {
      return sum + parseFloat(c.saldo_pendiente || 0);
    }, 0);
    
    credito_disponible = limiteCredito - deudaTotal;
    
    // Agregar credito_disponible a los datos del cliente
    credito.clientes.credito_disponible = credito_disponible;
  }

  return {
    ...credito,
    pagos,
    cantidad_pagos: pagos.length,
    total_pagado: pagos.reduce((sum, p) => sum + parseFloat(p.monto_pagado), 0)
  };
}

/**
 * Obtiene todos los créditos con filtros
 */
async function obtenerCreditos(filtros = {}) {
  return await creditosRepository.obtenerTodos(filtros);
}

/**
 * Obtiene créditos activos
 */
async function obtenerCreditosActivos(filtros = {}) {
  return await creditosRepository.obtenerTodos({
    ...filtros,
    estado: ESTADOS_CREDITO.ACTIVO
  });
}

/**
 * Obtiene créditos vencidos
 */
async function obtenerCreditosVencidos() {
  return await creditosRepository.obtenerVencidos();
}

/**
 * Obtiene créditos de un cliente específico
 */
async function obtenerCreditosPorCliente(id_cliente, filtros = {}) {
  // Verificar que el cliente existe
  await clientesRepository.obtenerPorId(id_cliente);

  const creditos = await creditosRepository.obtenerTodos({
    ...filtros,
    id_cliente
  });

  const deudaTotal = await creditosRepository.obtenerDeudaCliente(id_cliente);

  return {
    ...creditos,
    deuda_total: deudaTotal
  };
}

/**
 * Registra un pago a un crédito
 * TRANSACCIONAL: Crea el pago y actualiza el saldo del crédito
 */
async function registrarPago(datos) {
  // Validar datos
  if (!datos.id_credito) {
    throw new ErrorValidacion('El ID del crédito es requerido');
  }

  if (!datos.monto_pagado || datos.monto_pagado <= 0) {
    throw new ErrorValidacion('El monto pagado debe ser mayor a 0');
  }

  // Obtener crédito
  const credito = await creditosRepository.obtenerPorId(datos.id_credito);

  // Validar que el crédito esté activo
  if (credito.estado === ESTADOS_CREDITO.PAGADO) {
    throw new ErrorConflicto('El crédito ya está completamente pagado');
  }

  // Validar que el pago no exceda el saldo pendiente
  if (datos.monto_pagado > parseFloat(credito.saldo_pendiente)) {
    throw new ErrorValidacion(
      `El monto pagado ($${datos.monto_pagado.toFixed(2)}) ` +
      `excede el saldo pendiente ($${credito.saldo_pendiente})`
    );
  }

  try {
    // 1. Calcular nuevo saldo
    const nuevoSaldo = parseFloat(credito.saldo_pendiente) - datos.monto_pagado;

    // 2. Registrar el pago con saldo después del pago
    const pago = await pagosRepository.crear({
      id_credito: datos.id_credito,
      monto_pagado: datos.monto_pagado,
      metodo_pago: datos.metodo_pago,
      observaciones: datos.observaciones,
      saldo_despues_pago: nuevoSaldo,
      id_usuario: datos.id_usuario
    });

    // 3. Actualizar saldo del crédito (cambia automáticamente a PAGADO si saldo = 0)
    const creditoActualizado = await creditosRepository.actualizarSaldo(
      datos.id_credito,
      nuevoSaldo
    );

    return {
      pago,
      credito: creditoActualizado,
      saldo_anterior: credito.saldo_pendiente,
      saldo_nuevo: nuevoSaldo,
      credito_liquidado: nuevoSaldo === 0
    };

  } catch (error) {
    throw error;
  }
}

/**
 * Obtiene dashboard de cobranza
 */
async function obtenerDashboardCobranza() {
  try {
    // Obtener todos los créditos activos y vencidos
    const creditosActivos = await creditosRepository.obtenerTodos({
      estado: ESTADOS_CREDITO.ACTIVO
    });

    const creditosVencidos = await creditosRepository.obtenerVencidos();

    // Calcular totales
    const totalActivos = creditosActivos.creditos.reduce(
      (sum, c) => sum + parseFloat(c.saldo_pendiente || 0),
      0
    );

    const totalVencidos = creditosVencidos.reduce(
      (sum, c) => sum + parseFloat(c.saldo_pendiente || 0),
      0
    );

    return {
      creditos_activos: {
        cantidad: creditosActivos.total,
        monto_total: totalActivos
      },
      creditos_vencidos: {
        cantidad: creditosVencidos.length,
        monto_total: totalVencidos
      },
      cartera_total: totalActivos + totalVencidos,
      tasa_vencimiento: creditosActivos.total > 0 
        ? ((creditosVencidos.length / creditosActivos.total) * 100).toFixed(2) + '%'
        : '0%'
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Obtiene reporte de cartera vencida
 */
async function obtenerReporteCarteraVencida() {
  const creditosVencidos = await creditosRepository.obtenerVencidos();

  const totalVencido = creditosVencidos.reduce(
    (sum, c) => sum + parseFloat(c.saldo_pendiente || 0),
    0
  );

  return {
    creditos: creditosVencidos,
    total_creditos: creditosVencidos.length,
    monto_total_vencido: totalVencido
  };
}

/**
 * Obtiene créditos próximos a vencer (dentro de los próximos N días)
 */
async function obtenerCreditosProximosAVencer(dias = 7) {
  const hoy = new Date();
  const fechaLimite = new Date();
  fechaLimite.setDate(hoy.getDate() + dias);

  const { creditos } = await creditosRepository.obtenerTodos({
    estado: ESTADOS_CREDITO.ACTIVO
  });

  // Filtrar créditos que vencen dentro del plazo
  const proximosAVencer = creditos.filter(credito => {
    const fechaVenc = new Date(credito.fecha_vencimiento);
    return fechaVenc > hoy && fechaVenc <= fechaLimite;
  });

  return {
    creditos: proximosAVencer,
    total: proximosAVencer.length,
    dias_alerta: dias
  };
}

module.exports = {
  // Constantes
  ESTADOS_CREDITO,
  
  // CRUD
  crearCredito,
  obtenerCreditoPorId,
  obtenerCreditos,
  
  // Consultas específicas
  obtenerCreditosActivos,
  obtenerCreditosVencidos,
  obtenerCreditosPorCliente,
  
  // Pagos
  registrarPago,
  
  // Reportes
  obtenerDashboardCobranza,
  obtenerReporteCarteraVencida,
  obtenerCreditosProximosAVencer
};
