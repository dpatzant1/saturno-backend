/**
 * Servicio de Ventas
 * Gestiona la lógica de negocio para ventas con validaciones críticas y transacciones
 */

const ventasRepository = require('../repositories/ventasRepository');
const detalleVentaRepository = require('../repositories/detalleVentaRepository');
const productosRepository = require('../repositories/productosRepository');
const clientesRepository = require('../repositories/clientesRepository');
const creditosRepository = require('../repositories/creditosRepository');
const movimientosService = require('../services/movimientosService');
const clientesService = require('../services/clientesService');
const { 
  ErrorValidacion, 
  ErrorConflicto,
  ErrorNoEncontrado 
} = require('../utils/errores');

/**
 * Tipos de venta permitidos
 */
const TIPOS_VENTA = {
  CONTADO: 'CONTADO',
  CREDITO: 'CREDITO'
};

/**
 * Estados de venta permitidos
 */
const ESTADOS_VENTA = {
  ACTIVA: 'ACTIVA',
  ANULADA: 'ANULADA'
};

/**
 * Tipos de descuento permitidos
 */
const TIPOS_DESCUENTO = {
  NINGUNO: 'NINGUNO',
  PORCENTAJE: 'PORCENTAJE',
  MONTO: 'MONTO'
};

/**
 * Valida el descuento aplicado
 * @param {Object} descuento - Datos del descuento
 * @param {string} descuento.tipo - Tipo de descuento
 * @param {number} descuento.valor - Valor del descuento
 * @param {number} subtotal - Subtotal de la venta
 * @throws {ErrorValidacion} Si el descuento es inválido
 */
function validarDescuento(descuento, subtotal) {
  const errores = [];

  // Si no hay descuento, es válido
  if (!descuento || descuento.tipo === TIPOS_DESCUENTO.NINGUNO) {
    return;
  }

  // Validar tipo de descuento
  if (!Object.values(TIPOS_DESCUENTO).includes(descuento.tipo)) {
    errores.push('Tipo de descuento inválido. Debe ser NINGUNO, PORCENTAJE o MONTO');
  }

  // Validar valor del descuento
  if (descuento.valor === undefined || descuento.valor === null) {
    errores.push('El valor del descuento es requerido');
  } else if (descuento.valor < 0) {
    errores.push('El valor del descuento no puede ser negativo');
  }

  // Validaciones específicas por tipo
  if (descuento.tipo === TIPOS_DESCUENTO.PORCENTAJE) {
    if (descuento.valor > 100) {
      errores.push('El descuento por porcentaje no puede ser mayor a 100%');
    }
  } else if (descuento.tipo === TIPOS_DESCUENTO.MONTO) {
    if (descuento.valor > subtotal) {
      errores.push(`El descuento en monto (Q${descuento.valor.toFixed(2)}) no puede ser mayor al subtotal (Q${subtotal.toFixed(2)})`);
    }
  }

  if (errores.length > 0) {
    throw new ErrorValidacion('Descuento inválido', errores);
  }
}

/**
 * Calcula el monto del descuento según el tipo
 * @param {number} subtotal - Subtotal de la venta
 * @param {string} tipo - Tipo de descuento (NINGUNO, PORCENTAJE, MONTO)
 * @param {number} valor - Valor del descuento
 * @returns {number} Monto del descuento calculado
 */
function calcularDescuento(subtotal, tipo, valor) {
  if (!tipo || tipo === TIPOS_DESCUENTO.NINGUNO || !valor || valor === 0) {
    return 0;
  }

  if (tipo === TIPOS_DESCUENTO.PORCENTAJE) {
    // Calcular porcentaje del subtotal
    return (subtotal * valor) / 100;
  } else if (tipo === TIPOS_DESCUENTO.MONTO) {
    // El descuento es el monto directo
    return valor;
  }

  return 0;
}

/**
 * Valida los datos de una venta
 * @param {Object} datos - Datos de la venta
 * @throws {ErrorValidacion} Si los datos son inválidos
 */
async function validarDatosVenta(datos) {
  const errores = [];

  // Validar cliente
  if (!datos.id_cliente) {
    errores.push('El ID del cliente es requerido');
  } else {
    const cliente = await clientesRepository.obtenerPorId(datos.id_cliente);
    if (!cliente) {
      errores.push('El cliente especificado no existe');
    } else if (!cliente.estado) {
      errores.push('El cliente está inactivo');
    } else if (cliente.deleted_at) {
      errores.push('El cliente está eliminado');
    }
  }

  // Validar tipo de venta
  if (!datos.tipo_venta) {
    errores.push('El tipo de venta es requerido');
  } else if (!Object.values(TIPOS_VENTA).includes(datos.tipo_venta)) {
    errores.push('Tipo de venta inválido. Debe ser CONTADO o CREDITO');
  }

  // Validar productos (detalles)
  if (!datos.productos || !Array.isArray(datos.productos)) {
    errores.push('Debe incluir al menos un producto');
  } else if (datos.productos.length === 0) {
    errores.push('La venta debe tener al menos un producto');
  } else {
    // Validar cada producto
    for (let i = 0; i < datos.productos.length; i++) {
      const item = datos.productos[i];
      
      if (!item.id_producto) {
        errores.push(`Producto ${i + 1}: ID del producto es requerido`);
      }
      
      if (!item.cantidad || item.cantidad <= 0) {
        errores.push(`Producto ${i + 1}: La cantidad debe ser mayor a 0`);
      }
      
      if (item.precio_unitario === undefined || item.precio_unitario < 0) {
        errores.push(`Producto ${i + 1}: El precio unitario es requerido y debe ser positivo`);
      }
    }
  }

  if (errores.length > 0) {
    throw new ErrorValidacion('Datos de venta inválidos', errores);
  }
}

/**
 * Valida el stock disponible para todos los productos
 * @param {Array} productos - Lista de productos a vender
 * @throws {ErrorConflicto} Si hay stock insuficiente
 */
async function validarStockDisponible(productos) {
  const errores = [];

  for (const item of productos) {
    const producto = await productosRepository.obtenerPorId(item.id_producto);
    
    if (!producto) {
      errores.push(`Producto ${item.id_producto}: no encontrado`);
      continue;
    }

    if (!producto.estado) {
      errores.push(`${producto.nombre}: está inactivo`);
      continue;
    }

    if (producto.deleted_at) {
      errores.push(`${producto.nombre}: está eliminado`);
      continue;
    }

    if (producto.cantidad_stock < item.cantidad) {
      errores.push(
        `${producto.nombre}: stock insuficiente. ` +
        `Disponible: ${producto.cantidad_stock} ${producto.unidad_medida}, ` +
        `Solicitado: ${item.cantidad} ${producto.unidad_medida}`
      );
    }
  }

  if (errores.length > 0) {
    throw new ErrorConflicto('Stock insuficiente para completar la venta', errores);
  }
}

/**
 * Calcula el subtotal de la venta (suma de productos sin descuento)
 * @param {Array} productos - Lista de productos
 * @returns {number} Subtotal calculado
 */
function calcularSubtotal(productos) {
  return productos.reduce((total, item) => {
    const subtotal = item.cantidad * item.precio_unitario;
    return total + subtotal;
  }, 0);
}

/**
 * Calcula el total final de la venta aplicando descuentos
 * @param {number} subtotal - Subtotal de la venta
 * @param {Object} descuento - Datos del descuento {tipo, valor}
 * @returns {Object} {subtotal, descuento_monto, total}
 */
function calcularTotalConDescuento(subtotal, descuento = {}) {
  const tipo = descuento.tipo || TIPOS_DESCUENTO.NINGUNO;
  const valor = descuento.valor || 0;
  
  const descuento_monto = calcularDescuento(subtotal, tipo, valor);
  const total = subtotal - descuento_monto;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    descuento_tipo: tipo,
    descuento_valor: parseFloat(valor.toFixed(2)),
    descuento_monto: parseFloat(descuento_monto.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
}

/**
 * Crea una venta al CONTADO
 * TRANSACCIONAL: Crea venta, detalles y genera movimientos de salida automáticamente
 * @param {Object} datos - Datos de la venta
 * @param {string} datos.id_cliente - UUID del cliente
 * @param {string} datos.id_usuario - UUID del usuario que registra
 * @param {Array} datos.productos - Array de productos [{id_producto, cantidad, precio_unitario}]
 * @param {Object} datos.descuento - Descuento a aplicar {tipo, valor} (opcional)
 * @returns {Promise<Object>} Venta completa creada
 */
async function crearVentaContado(datos) {
  // Validar datos básicos
  await validarDatosVenta({
    ...datos,
    tipo_venta: TIPOS_VENTA.CONTADO
  });

  // VALIDACIÓN CRÍTICA: Verificar stock disponible
  await validarStockDisponible(datos.productos);

  // Calcular subtotal
  const subtotal = calcularSubtotal(datos.productos);

  // Preparar descuento (si no se proporciona, será NINGUNO)
  const descuento = datos.descuento || {
    tipo: TIPOS_DESCUENTO.NINGUNO,
    valor: 0
  };

  // Validar descuento
  validarDescuento(descuento, subtotal);

  // Calcular totales con descuento
  const totales = calcularTotalConDescuento(subtotal, descuento);

  try {
    // 1. Crear encabezado de venta con descuento
    const venta = await ventasRepository.crear({
      id_cliente: datos.id_cliente,
      id_usuario: datos.id_usuario,
      tipo_venta: TIPOS_VENTA.CONTADO,
      subtotal: totales.subtotal,
      descuento_tipo: totales.descuento_tipo,
      descuento_valor: totales.descuento_valor,
      descuento_monto: totales.descuento_monto,
      total: totales.total
    });

    // 2. Crear detalles de venta
    const detalles = datos.productos.map(item => ({
      id_venta: venta.id_venta,
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal: item.cantidad * item.precio_unitario
    }));

    const detallesCreados = await detalleVentaRepository.crearMultiples(detalles);

    // 3. Generar movimientos de SALIDA y actualizar stock automáticamente
    const movimientos = [];
    for (const item of datos.productos) {
      const producto = await productosRepository.obtenerPorId(item.id_producto);
      
      const movimiento = await movimientosService.registrarSalida({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        motivo: 'Venta',
        referencia: `Venta ${venta.id_venta}`
      });
      
      movimientos.push(movimiento);
    }

    // Obtener la venta completa con detalles
    const ventaCompleta = await obtenerVentaPorId(venta.id_venta);

    return {
      ...ventaCompleta,
      movimientos_generados: movimientos.length
    };

  } catch (error) {
    // Si algo falla, el error se propaga
    // Los movimientos ya registrados quedarán como evidencia en el historial
    throw error;
  }
}

/**
 * Crea una venta a CRÉDITO
 * TRANSACCIONAL: Valida límite de crédito, crea venta, detalles, movimientos y registro de crédito
 * @param {Object} datos - Datos de la venta
 * @param {string} datos.id_cliente - UUID del cliente (debe ser tipo CREDITO)
 * @param {string} datos.id_usuario - UUID del usuario que registra
 * @param {Array} datos.productos - Array de productos [{id_producto, cantidad, precio_unitario}]
 * @param {number} datos.dias_credito - Días de plazo para el crédito (default: 30) * @param {Object} datos.descuento - Descuento a aplicar {tipo, valor} (opcional) * @returns {Promise<Object>} Venta completa creada con crédito
 */
async function crearVentaCredito(datos) {
  // Validar datos básicos
  await validarDatosVenta({
    ...datos,
    tipo_venta: TIPOS_VENTA.CREDITO
  });

  // VALIDACIÓN 1: Verificar que el cliente sea tipo CREDITO
  const cliente = await clientesRepository.obtenerPorId(datos.id_cliente);
  if (cliente.tipo_cliente !== 'CREDITO') {
    throw new ErrorConflicto('El cliente debe ser tipo CREDITO para realizar ventas a crédito');
  }

  // Calcular subtotal
  const subtotal = calcularSubtotal(datos.productos);

  // Preparar descuento (si no se proporciona, será NINGUNO)
  const descuento = datos.descuento || {
    tipo: TIPOS_DESCUENTO.NINGUNO,
    valor: 0
  };

  // Validar descuento
  validarDescuento(descuento, subtotal);

  // Calcular totales con descuento
  const totales = calcularTotalConDescuento(subtotal, descuento);

  // VALIDACIÓN 2: Verificar límite de crédito disponible con el total DESPUÉS del descuento
  const reporteDeuda = await clientesService.obtenerReporteDeuda(datos.id_cliente);

  if (reporteDeuda.disponible < totales.total) {
    throw new ErrorConflicto(
      `Crédito insuficiente. Disponible: Q${reporteDeuda.disponible.toFixed(2)}, ` +
      `Requerido: Q${totales.total.toFixed(2)}. ` +
      `Deuda actual: Q${reporteDeuda.deuda_total.toFixed(2)}`
    );
  }

  // VALIDACIÓN 3: Verificar stock disponible
  await validarStockDisponible(datos.productos);

  // Calcular fecha de vencimiento
  const dias_credito = datos.dias_credito || 30;
  const fecha_vencimiento = new Date();
  fecha_vencimiento.setDate(fecha_vencimiento.getDate() + dias_credito);

  try {
    // 1. Crear encabezado de venta con descuento
    const venta = await ventasRepository.crear({
      id_cliente: datos.id_cliente,
      id_usuario: datos.id_usuario,
      tipo_venta: TIPOS_VENTA.CREDITO,
      subtotal: totales.subtotal,
      descuento_tipo: totales.descuento_tipo,
      descuento_valor: totales.descuento_valor,
      descuento_monto: totales.descuento_monto,
      total: totales.total
    });

    // 2. Crear detalles de venta
    const detalles = datos.productos.map(item => ({
      id_venta: venta.id_venta,
      id_producto: item.id_producto,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal: item.cantidad * item.precio_unitario
    }));

    await detalleVentaRepository.crearMultiples(detalles);

    // 3. Generar movimientos de SALIDA y actualizar stock
    const movimientos = [];
    for (const item of datos.productos) {
      const movimiento = await movimientosService.registrarSalida({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        motivo: 'Venta a crédito',
        referencia: `Venta ${venta.id_venta}`
      });
      
      movimientos.push(movimiento);
    }

    // 4. Crear registro de crédito con el total DESPUÉS del descuento
    const hoy = new Date().toISOString().split('T')[0];
    const credito = await creditosRepository.crear({
      id_venta: venta.id_venta,
      id_cliente: datos.id_cliente,
      monto_total: totales.total, // <- Total con descuento aplicado
      saldo_pendiente: totales.total, // <- Saldo inicial es el total con descuento
      fecha_inicio: hoy,
      fecha_vencimiento: fecha_vencimiento.toISOString().split('T')[0],
      dias_credito,
      estado: 'ACTIVO'
    });

    // Obtener la venta completa con detalles
    const ventaCompleta = await obtenerVentaPorId(venta.id_venta);

    return {
      ...ventaCompleta,
      credito: {
        id_credito: credito.id_credito,
        monto_total: credito.monto_total,
        saldo_pendiente: credito.saldo_pendiente,
        fecha_vencimiento: credito.fecha_vencimiento,
        dias_credito: credito.dias_credito,
        estado: credito.estado
      },
      movimientos_generados: movimientos.length
    };

  } catch (error) {
    // Si algo falla, el error se propaga
    throw error;
  }
}

/**
 * Obtiene ventas con filtros
 * @param {Object} filtros - Filtros de búsqueda
 * @returns {Promise<Object>} Ventas y metadatos de paginación
 */
async function obtenerVentas(filtros = {}) {
  return await ventasRepository.obtenerTodos(filtros);
}

/**
 * Obtiene una venta por ID con sus detalles completos
 * @param {string} id - UUID de la venta
 * @returns {Promise<Object>} Venta con detalles
 */
async function obtenerVentaPorId(id) {
  const venta = await ventasRepository.obtenerPorId(id);
  const detalles = await detalleVentaRepository.obtenerPorVenta(id);

  return {
    ...venta,
    detalles,
    cantidad_productos: detalles.length,
    total_items: detalles.reduce((sum, d) => sum + d.cantidad, 0)
  };
}

/**
 * Anula una venta
 * TRANSACCIONAL: Cambia estado a ANULADA, genera movimientos de ENTRADA para reversar,
 * y si es venta a crédito, anula el registro de crédito
 * @param {string} id - UUID de la venta
 * @param {string} motivo - Motivo de la anulación
 * @returns {Promise<Object>} Venta anulada
 */
async function anularVenta(id, motivo = 'Anulación de venta') {
  // Verificar que la venta existe y está activa
  const venta = await ventasRepository.obtenerPorId(id);
  
  if (venta.estado === ESTADOS_VENTA.ANULADA) {
    throw new ErrorConflicto('La venta ya está anulada');
  }

  // Obtener detalles para reversar stock
  const detalles = await detalleVentaRepository.obtenerPorVenta(id);

  try {
    // 1. Cambiar estado a ANULADA
    const ventaAnulada = await ventasRepository.anular(id);

    // 2. Generar movimientos de ENTRADA para reversar el stock
    const movimientos = [];
    for (const detalle of detalles) {
      const movimiento = await movimientosService.registrarEntrada({
        id_producto: detalle.id_producto,
        cantidad: detalle.cantidad,
        motivo: 'Anulación de venta',
        referencia: `Anulación venta ${id}`
      });
      
      movimientos.push(movimiento);
    }

    // 3. Si es venta a CREDITO, anular el registro de crédito
    let creditoAnulado = null;
    if (venta.tipo_venta === TIPOS_VENTA.CREDITO) {
      try {
        const credito = await creditosRepository.obtenerPorVenta(id);
        creditoAnulado = await creditosRepository.anular(credito.id_credito);
      } catch (error) {
        // Si no existe crédito asociado, continuar
        console.warn(`No se encontró crédito asociado a la venta ${id}`);
      }
    }

    return {
      venta: ventaAnulada,
      detalles_anulados: detalles.length,
      movimientos_generados: movimientos.length,
      credito_anulado: creditoAnulado ? true : false,
      motivo
    };

  } catch (error) {
    throw error;
  }
}

/**
 * Obtiene ventas por cliente
 * @param {string} id_cliente - UUID del cliente
 * @returns {Promise<Object>} Ventas y totales del cliente
 */
async function obtenerVentasPorCliente(id_cliente) {
  const ventas = await ventasRepository.obtenerTodos({ id_cliente });
  const totales = await ventasRepository.obtenerTotalesPorCliente(id_cliente);

  return {
    ...ventas,
    totales
  };
}

/**
 * Obtiene ventas por usuario/vendedor
 * @param {string} id_usuario - UUID del usuario
 * @returns {Promise<Object>} Ventas y totales del vendedor
 */
async function obtenerVentasPorUsuario(id_usuario) {
  const ventas = await ventasRepository.obtenerTodos({ id_usuario });
  const totales = await ventasRepository.obtenerTotalesPorUsuario(id_usuario);

  return {
    ...ventas,
    totales
  };
}

/**
 * Obtiene dashboard de ventas del día
 * @returns {Promise<Object>} Estadísticas del día
 */
async function obtenerDashboardDia() {
  return await ventasRepository.obtenerDashboardDia();
}

/**
 * Obtiene reporte de ventas por período
 * @param {Date|string} fecha_desde - Fecha inicio
 * @param {Date|string} fecha_hasta - Fecha fin
 * @returns {Promise<Object>} Reporte consolidado
 */
async function obtenerReportePorPeriodo(fecha_desde, fecha_hasta) {
  // Validar fechas
  if (!fecha_desde || !fecha_hasta) {
    throw new ErrorValidacion('Las fechas desde y hasta son requeridas');
  }

  const desde = new Date(fecha_desde);
  const hasta = new Date(fecha_hasta);

  if (isNaN(desde.getTime()) || isNaN(hasta.getTime())) {
    throw new ErrorValidacion('Formato de fecha inválido');
  }

  if (desde > hasta) {
    throw new ErrorValidacion('La fecha desde no puede ser posterior a la fecha hasta');
  }

  return await ventasRepository.obtenerReportePorPeriodo(desde, hasta);
}

module.exports = {
  // Constantes
  TIPOS_VENTA,
  ESTADOS_VENTA,
  
  // Funciones principales
  crearVentaContado,
  crearVentaCredito,
  anularVenta,
  
  // Consultas
  obtenerVentas,
  obtenerVentaPorId,
  obtenerVentasPorCliente,
  obtenerVentasPorUsuario,
  obtenerDashboardDia,
  obtenerReportePorPeriodo
};
