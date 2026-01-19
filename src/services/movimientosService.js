/**
 * Servicio de Movimientos de Inventario
 * Gestiona la lógica de negocio para movimientos de stock con validaciones críticas
 */

const movimientosRepository = require('../repositories/movimientosRepository');
const productosRepository = require('../repositories/productosRepository');
const { 
  ErrorValidacion, 
  ErrorConflicto,
  ErrorNoEncontrado 
} = require('../utils/errores');

/**
 * Tipos de movimiento permitidos
 */
const TIPOS_MOVIMIENTO = {
  ENTRADA: 'ENTRADA',
  SALIDA: 'SALIDA'
};

/**
 * Motivos comunes de movimientos
 */
const MOTIVOS = {
  COMPRA: 'Compra',
  VENTA: 'Venta',
  AJUSTE_POSITIVO: 'Ajuste Positivo',
  AJUSTE_NEGATIVO: 'Ajuste Negativo',
  DEVOLUCION: 'Devolución',
  MERMA: 'Merma',
  INVENTARIO_INICIAL: 'Inventario Inicial',
  CORRECCION: 'Corrección',
  PRODUCCION: 'Producción',
  CONSUMO_INTERNO: 'Consumo Interno'
};

/**
 * Valida los datos de un movimiento
 * @param {Object} datos - Datos del movimiento a validar
 * @throws {ErrorValidacion} Si los datos son inválidos
 */
async function validarDatosMovimiento(datos) {
  const errores = [];

  // Validar producto
  if (!datos.id_producto) {
    errores.push('El ID del producto es requerido');
  } else {
    // Verificar que el producto existe y está activo
    const producto = await productosRepository.obtenerPorId(datos.id_producto);
    if (!producto) {
      errores.push('El producto especificado no existe');
    } else if (!producto.estado) {
      errores.push('No se pueden registrar movimientos de productos inactivos');
    } else if (producto.deleted_at) {
      errores.push('No se pueden registrar movimientos de productos eliminados');
    }
  }

  // Validar tipo de movimiento
  if (!datos.tipo_movimiento) {
    errores.push('El tipo de movimiento es requerido');
  } else if (!Object.values(TIPOS_MOVIMIENTO).includes(datos.tipo_movimiento)) {
    errores.push('Tipo de movimiento inválido. Debe ser ENTRADA o SALIDA');
  }

  // Validar cantidad
  if (datos.cantidad === undefined || datos.cantidad === null) {
    errores.push('La cantidad es requerida');
  } else if (!Number.isInteger(datos.cantidad)) {
    errores.push('La cantidad debe ser un número entero');
  } else if (datos.cantidad <= 0) {
    errores.push('La cantidad debe ser mayor a 0');
  }

  // Validar motivo
  if (!datos.motivo) {
    errores.push('El motivo es requerido');
  } else if (datos.motivo.length > 500) {
    errores.push('El motivo no puede exceder 500 caracteres');
  }

  // Validar referencia (opcional)
  if (datos.referencia && datos.referencia.length > 200) {
    errores.push('La referencia no puede exceder 200 caracteres');
  }

  if (errores.length > 0) {
    throw new ErrorValidacion('Datos de movimiento inválidos', errores);
  }
}

/**
 * Registra una entrada de productos al inventario
 * @param {Object} datos - Datos de la entrada
 * @param {string} datos.id_producto - UUID del producto
 * @param {number} datos.cantidad - Cantidad a ingresar
 * @param {string} datos.motivo - Motivo de la entrada
 * @param {string} datos.referencia - Referencia (opcional)
 * @returns {Promise<Object>} Movimiento registrado
 */
async function registrarEntrada(datos) {
  // Validar datos
  const datosMovimiento = {
    ...datos,
    tipo_movimiento: TIPOS_MOVIMIENTO.ENTRADA
  };

  await validarDatosMovimiento(datosMovimiento);

  // Registrar movimiento
  const movimiento = await movimientosRepository.crear(datosMovimiento);

  return movimiento;
}

/**
 * Registra una salida de productos del inventario
 * VALIDACIÓN CRÍTICA: Verifica que haya stock suficiente
 * @param {Object} datos - Datos de la salida
 * @param {string} datos.id_producto - UUID del producto
 * @param {number} datos.cantidad - Cantidad a retirar
 * @param {string} datos.motivo - Motivo de la salida
 * @param {string} datos.referencia - Referencia (opcional)
 * @returns {Promise<Object>} Movimiento registrado
 * @throws {ErrorConflicto} Si no hay stock suficiente
 */
async function registrarSalida(datos) {
  // Validar datos
  const datosMovimiento = {
    ...datos,
    tipo_movimiento: TIPOS_MOVIMIENTO.SALIDA
  };

  await validarDatosMovimiento(datosMovimiento);

  // VALIDACIÓN CRÍTICA: Verificar stock disponible
  const producto = await productosRepository.obtenerPorId(datos.id_producto);
  
  if (producto.cantidad_stock < datos.cantidad) {
    throw new ErrorConflicto(
      `Stock insuficiente. Stock disponible: ${producto.cantidad_stock} ${producto.unidad_medida}. ` +
      `Cantidad solicitada: ${datos.cantidad} ${producto.unidad_medida}`
    );
  }

  // Registrar movimiento (esto actualizará automáticamente el stock)
  const movimiento = await movimientosRepository.crear(datosMovimiento);

  return movimiento;
}

/**
 * Registra un movimiento genérico (entrada o salida)
 * Valida automáticamente el stock en caso de salidas
 * @param {Object} datos - Datos del movimiento
 * @returns {Promise<Object>} Movimiento registrado
 */
async function registrarMovimiento(datos) {
  // Determinar si es entrada o salida y usar la función correspondiente
  if (datos.tipo_movimiento === TIPOS_MOVIMIENTO.ENTRADA) {
    return await registrarEntrada(datos);
  } else if (datos.tipo_movimiento === TIPOS_MOVIMIENTO.SALIDA) {
    return await registrarSalida(datos);
  } else {
    throw new ErrorValidacion('Tipo de movimiento inválido');
  }
}

/**
 * Obtiene movimientos con filtros
 * @param {Object} filtros - Filtros de búsqueda
 * @returns {Promise<Object>} Movimientos y metadatos de paginación
 */
async function obtenerMovimientos(filtros = {}) {
  return await movimientosRepository.obtenerTodos(filtros);
}

/**
 * Obtiene un movimiento por ID
 * @param {string} id - UUID del movimiento
 * @returns {Promise<Object>} Movimiento encontrado
 */
async function obtenerMovimientoPorId(id) {
  return await movimientosRepository.obtenerPorId(id);
}

/**
 * Obtiene el historial completo de movimientos de un producto
 * @param {string} id_producto - UUID del producto
 * @param {number} limite - Cantidad de resultados
 * @returns {Promise<Array>} Historial de movimientos
 */
async function obtenerHistorialProducto(id_producto, limite = 100) {
  // Verificar que el producto existe
  const producto = await productosRepository.obtenerPorId(id_producto);
  if (!producto) {
    throw new ErrorNoEncontrado('Producto no encontrado');
  }

  return await movimientosRepository.obtenerHistorialProducto(id_producto, limite);
}

/**
 * Obtiene estadísticas de movimientos de un producto
 * @param {string} id_producto - UUID del producto
 * @returns {Promise<Object>} Estadísticas consolidadas
 */
async function obtenerEstadisticasProducto(id_producto) {
  // Verificar que el producto existe
  const producto = await productosRepository.obtenerPorId(id_producto);
  if (!producto) {
    throw new ErrorNoEncontrado('Producto no encontrado');
  }

  const estadisticas = await movimientosRepository.obtenerEstadisticasProducto(id_producto);

  return {
    producto: {
      id: producto.id_producto,
      nombre: producto.nombre,
      stock_actual: producto.cantidad_stock,
      unidad_medida: producto.unidad_medida
    },
    ...estadisticas
  };
}

/**
 * Obtiene reporte de movimientos por rango de fechas
 * @param {Date|string} fecha_desde - Fecha inicio
 * @param {Date|string} fecha_hasta - Fecha fin
 * @returns {Promise<Object>} Reporte consolidado
 */
async function obtenerReportePorFecha(fecha_desde, fecha_hasta) {
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

  return await movimientosRepository.obtenerReportePorFecha(desde, hasta);
}

/**
 * Obtiene el kardex (registro de inventario) de un producto
 * @param {string} id_producto - UUID del producto
 * @param {Date|string} fecha_desde - Fecha inicio (opcional)
 * @param {Date|string} fecha_hasta - Fecha fin (opcional)
 * @returns {Promise<Object>} Kardex del producto
 */
async function obtenerKardex(id_producto, fecha_desde = null, fecha_hasta = null) {
  // Convertir fechas si se proporcionan
  let desde = null;
  let hasta = null;

  if (fecha_desde) {
    desde = new Date(fecha_desde);
    if (isNaN(desde.getTime())) {
      throw new ErrorValidacion('Formato de fecha_desde inválido');
    }
  }

  if (fecha_hasta) {
    hasta = new Date(fecha_hasta);
    if (isNaN(hasta.getTime())) {
      throw new ErrorValidacion('Formato de fecha_hasta inválido');
    }
  }

  if (desde && hasta && desde > hasta) {
    throw new ErrorValidacion('La fecha desde no puede ser posterior a la fecha hasta');
  }

  return await movimientosRepository.obtenerKardex(id_producto, desde, hasta);
}

/**
 * Ajusta el inventario de un producto
 * Registra un movimiento de ENTRADA o SALIDA según sea necesario
 * @param {string} id_producto - UUID del producto
 * @param {number} cantidad_objetivo - Cantidad deseada en stock
 * @param {string} motivo - Motivo del ajuste
 * @param {string} referencia - Referencia (opcional)
 * @returns {Promise<Object>} Movimiento registrado
 */
async function ajustarInventario(id_producto, cantidad_objetivo, motivo, referencia = null) {
  // Validar cantidad objetivo
  if (!Number.isInteger(cantidad_objetivo) || cantidad_objetivo < 0) {
    throw new ErrorValidacion('La cantidad objetivo debe ser un número entero no negativo');
  }

  // Obtener producto actual
  const producto = await productosRepository.obtenerPorId(id_producto);
  if (!producto) {
    throw new ErrorNoEncontrado('Producto no encontrado');
  }

  const stockActual = producto.cantidad_stock;
  const diferencia = cantidad_objetivo - stockActual;

  // Si no hay diferencia, no hacer nada
  if (diferencia === 0) {
    throw new ErrorValidacion(
      `El producto ya tiene ${cantidad_objetivo} ${producto.unidad_medida} en stock. No se requiere ajuste.`
    );
  }

  // Determinar tipo de movimiento y cantidad
  const tipo_movimiento = diferencia > 0 ? TIPOS_MOVIMIENTO.ENTRADA : TIPOS_MOVIMIENTO.SALIDA;
  const cantidad = Math.abs(diferencia);

  const motivoCompleto = motivo || (diferencia > 0 ? MOTIVOS.AJUSTE_POSITIVO : MOTIVOS.AJUSTE_NEGATIVO);

  // Registrar movimiento
  return await registrarMovimiento({
    id_producto,
    tipo_movimiento,
    cantidad,
    motivo: motivoCompleto,
    referencia: referencia || `Ajuste de inventario: ${stockActual} → ${cantidad_objetivo}`
  });
}

module.exports = {
  // Constantes
  TIPOS_MOVIMIENTO,
  MOTIVOS,
  
  // Funciones principales
  registrarEntrada,
  registrarSalida,
  registrarMovimiento,
  ajustarInventario,
  
  // Consultas
  obtenerMovimientos,
  obtenerMovimientoPorId,
  obtenerHistorialProducto,
  obtenerEstadisticasProducto,
  obtenerReportePorFecha,
  obtenerKardex
};
