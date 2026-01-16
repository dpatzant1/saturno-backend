/**
 * Validaciones de Reglas de Negocio
 * Centraliza validaciones críticas de negocio que se usan en múltiples servicios
 */

const { ErrorValidacion } = require('./errores');

/**
 * Estados válidos de venta
 */
const ESTADOS_VENTA_VALIDOS = ['ACTIVA', 'ANULADA'];

/**
 * Estados válidos de crédito
 */
const ESTADOS_CREDITO_VALIDOS = ['ACTIVO', 'VENCIDO', 'PAGADO'];

/**
 * Tipos de cliente válidos
 */
const TIPOS_CLIENTE_VALIDOS = ['CONTADO', 'CREDITO'];

/**
 * Tipos de venta válidos
 */
const TIPOS_VENTA_VALIDOS = ['CONTADO', 'CREDITO'];

/**
 * Tipos de movimiento válidos
 */
const TIPOS_MOVIMIENTO_VALIDOS = ['ENTRADA', 'SALIDA', 'AJUSTE'];

/**
 * Valida que un estado de venta sea válido
 * @param {string} estado - Estado a validar
 * @throws {ErrorValidacion} Si el estado no es válido
 */
function validarEstadoVenta(estado) {
  if (!ESTADOS_VENTA_VALIDOS.includes(estado)) {
    throw new ErrorValidacion(
      `Estado de venta inválido. Valores permitidos: ${ESTADOS_VENTA_VALIDOS.join(', ')}`
    );
  }
}

/**
 * Valida que un estado de crédito sea válido
 * @param {string} estado - Estado a validar
 * @throws {ErrorValidacion} Si el estado no es válido
 */
function validarEstadoCredito(estado) {
  if (!ESTADOS_CREDITO_VALIDOS.includes(estado)) {
    throw new ErrorValidacion(
      `Estado de crédito inválido. Valores permitidos: ${ESTADOS_CREDITO_VALIDOS.join(', ')}`
    );
  }
}

/**
 * Valida que un tipo de cliente sea válido
 * @param {string} tipo - Tipo a validar
 * @throws {ErrorValidacion} Si el tipo no es válido
 */
function validarTipoCliente(tipo) {
  if (!TIPOS_CLIENTE_VALIDOS.includes(tipo)) {
    throw new ErrorValidacion(
      `Tipo de cliente inválido. Valores permitidos: ${TIPOS_CLIENTE_VALIDOS.join(', ')}`
    );
  }
}

/**
 * Valida que un tipo de venta sea válido
 * @param {string} tipo - Tipo a validar
 * @throws {ErrorValidacion} Si el tipo no es válido
 */
function validarTipoVenta(tipo) {
  if (!TIPOS_VENTA_VALIDOS.includes(tipo)) {
    throw new ErrorValidacion(
      `Tipo de venta inválido. Valores permitidos: ${TIPOS_VENTA_VALIDOS.join(', ')}`
    );
  }
}

/**
 * Valida que un tipo de movimiento sea válido
 * @param {string} tipo - Tipo a validar
 * @throws {ErrorValidacion} Si el tipo no es válido
 */
function validarTipoMovimiento(tipo) {
  if (!TIPOS_MOVIMIENTO_VALIDOS.includes(tipo)) {
    throw new ErrorValidacion(
      `Tipo de movimiento inválido. Valores permitidos: ${TIPOS_MOVIMIENTO_VALIDOS.join(', ')}`
    );
  }
}

/**
 * Valida que una cantidad sea positiva
 * @param {number} cantidad - Cantidad a validar
 * @param {string} nombreCampo - Nombre del campo para el mensaje de error
 * @throws {ErrorValidacion} Si la cantidad no es válida
 */
function validarCantidadPositiva(cantidad, nombreCampo = 'Cantidad') {
  if (typeof cantidad !== 'number' || isNaN(cantidad)) {
    throw new ErrorValidacion(`${nombreCampo} debe ser un número válido`);
  }
  if (cantidad <= 0) {
    throw new ErrorValidacion(`${nombreCampo} debe ser mayor a cero`);
  }
}

/**
 * Valida que un precio sea válido (positivo o cero)
 * @param {number} precio - Precio a validar
 * @param {string} nombreCampo - Nombre del campo para el mensaje de error
 * @throws {ErrorValidacion} Si el precio no es válido
 */
function validarPrecio(precio, nombreCampo = 'Precio') {
  if (typeof precio !== 'number' || isNaN(precio)) {
    throw new ErrorValidacion(`${nombreCampo} debe ser un número válido`);
  }
  if (precio < 0) {
    throw new ErrorValidacion(`${nombreCampo} no puede ser negativo`);
  }
}

/**
 * Valida que un monto sea válido y dentro de un rango
 * @param {number} monto - Monto a validar
 * @param {number} minimo - Monto mínimo permitido
 * @param {number} maximo - Monto máximo permitido
 * @param {string} nombreCampo - Nombre del campo para el mensaje
 * @throws {ErrorValidacion} Si el monto no está en el rango
 */
function validarMontoEnRango(monto, minimo, maximo, nombreCampo = 'Monto') {
  validarPrecio(monto, nombreCampo);
  
  if (monto < minimo) {
    throw new ErrorValidacion(
      `${nombreCampo} debe ser al menos ${minimo.toFixed(2)}`
    );
  }
  if (monto > maximo) {
    throw new ErrorValidacion(
      `${nombreCampo} no puede exceder ${maximo.toFixed(2)}`
    );
  }
}

/**
 * Valida que una fecha sea válida
 * @param {string|Date} fecha - Fecha a validar
 * @param {string} nombreCampo - Nombre del campo para el mensaje
 * @throws {ErrorValidacion} Si la fecha no es válida
 */
function validarFecha(fecha, nombreCampo = 'Fecha') {
  const fechaObj = new Date(fecha);
  if (isNaN(fechaObj.getTime())) {
    throw new ErrorValidacion(`${nombreCampo} no es una fecha válida`);
  }
}

/**
 * Valida que una fecha no sea futura
 * @param {string|Date} fecha - Fecha a validar
 * @param {string} nombreCampo - Nombre del campo para el mensaje
 * @throws {ErrorValidacion} Si la fecha es futura
 */
function validarFechaNoFutura(fecha, nombreCampo = 'Fecha') {
  validarFecha(fecha, nombreCampo);
  const fechaObj = new Date(fecha);
  const ahora = new Date();
  
  if (fechaObj > ahora) {
    throw new ErrorValidacion(`${nombreCampo} no puede ser una fecha futura`);
  }
}

/**
 * Valida que un límite de crédito sea válido
 * @param {number} limite - Límite de crédito
 * @throws {ErrorValidacion} Si el límite no es válido
 */
function validarLimiteCredito(limite) {
  if (limite === null || limite === undefined) {
    return; // Límite es opcional para clientes CONTADO
  }
  
  validarPrecio(limite, 'Límite de crédito');
  
  if (limite > 0 && limite < 100) {
    throw new ErrorValidacion('El límite de crédito debe ser al menos 100.00 o cero');
  }
}

/**
 * Valida relación entre tipo de cliente y límite de crédito
 * @param {string} tipoCliente - Tipo de cliente
 * @param {number} limiteCredito - Límite de crédito
 * @throws {ErrorValidacion} Si la relación no es válida
 */
function validarClienteCredito(tipoCliente, limiteCredito) {
  validarTipoCliente(tipoCliente);
  
  if (tipoCliente === 'CREDITO') {
    if (!limiteCredito || limiteCredito <= 0) {
      throw new ErrorValidacion(
        'Los clientes de tipo CREDITO deben tener un límite de crédito mayor a cero'
      );
    }
  }
}

/**
 * Valida que el stock disponible sea suficiente
 * @param {number} stockDisponible - Stock actual
 * @param {number} cantidadRequerida - Cantidad requerida
 * @param {string} nombreProducto - Nombre del producto (para mensaje)
 * @throws {ErrorValidacion} Si no hay stock suficiente
 */
function validarStockDisponible(stockDisponible, cantidadRequerida, nombreProducto = 'Producto') {
  validarCantidadPositiva(cantidadRequerida, 'Cantidad requerida');
  
  if (stockDisponible < cantidadRequerida) {
    throw new ErrorValidacion(
      `Stock insuficiente para ${nombreProducto}. Disponible: ${stockDisponible}, Requerido: ${cantidadRequerida}`
    );
  }
}

/**
 * Valida que un array no esté vacío
 * @param {Array} array - Array a validar
 * @param {string} nombreCampo - Nombre del campo
 * @throws {ErrorValidacion} Si el array está vacío
 */
function validarArrayNoVacio(array, nombreCampo = 'Array') {
  if (!Array.isArray(array) || array.length === 0) {
    throw new ErrorValidacion(`${nombreCampo} debe contener al menos un elemento`);
  }
}

/**
 * Valida que los días de crédito sean válidos
 * @param {number} dias - Días de crédito
 * @throws {ErrorValidacion} Si los días no son válidos
 */
function validarDiasCredito(dias) {
  if (!Number.isInteger(dias) || dias <= 0) {
    throw new ErrorValidacion('Los días de crédito deben ser un número entero positivo');
  }
  if (dias > 365) {
    throw new ErrorValidacion('Los días de crédito no pueden exceder 365 días');
  }
}

module.exports = {
  // Constantes
  ESTADOS_VENTA_VALIDOS,
  ESTADOS_CREDITO_VALIDOS,
  TIPOS_CLIENTE_VALIDOS,
  TIPOS_VENTA_VALIDOS,
  TIPOS_MOVIMIENTO_VALIDOS,
  
  // Validaciones de estados y tipos
  validarEstadoVenta,
  validarEstadoCredito,
  validarTipoCliente,
  validarTipoVenta,
  validarTipoMovimiento,
  
  // Validaciones numéricas
  validarCantidadPositiva,
  validarPrecio,
  validarMontoEnRango,
  validarLimiteCredito,
  
  // Validaciones de fechas
  validarFecha,
  validarFechaNoFutura,
  validarDiasCredito,
  
  // Validaciones de negocio
  validarClienteCredito,
  validarStockDisponible,
  validarArrayNoVacio
};
