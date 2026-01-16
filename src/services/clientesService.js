/**
 * Servicio de Clientes
 * Gestiona la lógica de negocio para clientes con validaciones críticas
 */

const clientesRepository = require('../repositories/clientesRepository');
const { supabase } = require('../config/database');
const { 
  ErrorValidacion, 
  ErrorConflicto,
  ErrorNoEncontrado 
} = require('../utils/errores');

/**
 * Tipos de cliente permitidos
 */
const TIPOS_CLIENTE = {
  CONTADO: 'CONTADO',
  CREDITO: 'CREDITO'
};

/**
 * Valida el formato de un correo electrónico
 * @param {string} correo - Correo a validar
 * @returns {boolean} true si es válido
 */
function validarFormatoCorreo(correo) {
  if (!correo) return true; // Correo es opcional
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo);
}

/**
 * Valida el formato de un teléfono
 * @param {string} telefono - Teléfono a validar
 * @returns {boolean} true si es válido
 */
function validarFormatoTelefono(telefono) {
  if (!telefono) return true; // Teléfono es opcional
  // Permitir números, espacios, guiones y paréntesis
  const regex = /^[\d\s\-()]+$/;
  return regex.test(telefono) && telefono.replace(/\D/g, '').length >= 7;
}

/**
 * Valida los datos de un cliente
 * @param {Object} datos - Datos del cliente a validar
 * @param {boolean} esActualizacion - Si es una actualización
 * @throws {ErrorValidacion} Si los datos son inválidos
 */
async function validarDatosCliente(datos, esActualizacion = false) {
  const errores = [];

  // Validar nombre (requerido)
  if (!esActualizacion || datos.nombre !== undefined) {
    if (!datos.nombre || datos.nombre.trim() === '') {
      errores.push('El nombre es requerido');
    } else if (datos.nombre.length > 100) {
      errores.push('El nombre no puede exceder 100 caracteres');
    }
  }

  // Validar apellido (opcional)
  if (datos.apellido !== undefined && datos.apellido !== null) {
    if (datos.apellido.length > 100) {
      errores.push('El apellido no puede exceder 100 caracteres');
    }
  }

  // Validar teléfono (opcional)
  if (datos.telefono !== undefined && datos.telefono !== null) {
    if (datos.telefono && datos.telefono.length > 20) {
      errores.push('El teléfono no puede exceder 20 caracteres');
    }
    if (datos.telefono && !validarFormatoTelefono(datos.telefono)) {
      errores.push('El formato del teléfono no es válido');
    }
  }

  // Validar correo (opcional)
  if (datos.correo !== undefined && datos.correo !== null) {
    if (datos.correo && datos.correo.length > 150) {
      errores.push('El correo no puede exceder 150 caracteres');
    }
    if (datos.correo && !validarFormatoCorreo(datos.correo)) {
      errores.push('El formato del correo electrónico no es válido');
    }
    // Verificar que el correo no esté en uso
    if (datos.correo) {
      const correoExiste = await clientesRepository.existeCorreo(
        datos.correo,
        datos.id_cliente // Excluir el ID actual en actualizaciones
      );
      if (correoExiste) {
        errores.push('Ya existe un cliente con ese correo electrónico');
      }
    }
  }

  // Validar dirección (opcional)
  if (datos.direccion !== undefined && datos.direccion !== null) {
    if (typeof datos.direccion !== 'string') {
      errores.push('La dirección debe ser texto');
    }
  }

  // Validar tipo de cliente (requerido)
  if (!esActualizacion || datos.tipo_cliente !== undefined) {
    if (!datos.tipo_cliente) {
      errores.push('El tipo de cliente es requerido');
    } else if (!Object.values(TIPOS_CLIENTE).includes(datos.tipo_cliente)) {
      errores.push('El tipo de cliente debe ser CONTADO o CREDITO');
    }
  }

  // Validar límite de crédito
  if (datos.tipo_cliente === TIPOS_CLIENTE.CREDITO || datos.limite_credito !== undefined) {
    if (datos.tipo_cliente === TIPOS_CLIENTE.CREDITO) {
      if (datos.limite_credito === undefined || datos.limite_credito === null) {
        errores.push('El límite de crédito es requerido para clientes de tipo CREDITO');
      } else if (datos.limite_credito < 0) {
        errores.push('El límite de crédito no puede ser negativo');
      }
    } else if (datos.tipo_cliente === TIPOS_CLIENTE.CONTADO && datos.limite_credito) {
      errores.push('Los clientes de tipo CONTADO no deben tener límite de crédito');
    }
  }

  if (errores.length > 0) {
    throw new ErrorValidacion('Datos de cliente inválidos', errores);
  }
}

/**
 * Crea un nuevo cliente
 * @param {Object} datos - Datos del cliente
 * @returns {Promise<Object>} Cliente creado
 */
async function crear(datos) {
  // Validar datos
  await validarDatosCliente(datos, false);

  // Preparar datos para inserción
  const clienteNuevo = {
    nombre: datos.nombre.trim(),
    apellido: datos.apellido ? datos.apellido.trim() : null,
    telefono: datos.telefono || null,
    correo: datos.correo ? datos.correo.trim().toLowerCase() : null,
    direccion: datos.direccion || null,
    tipo_cliente: datos.tipo_cliente,
    limite_credito: datos.tipo_cliente === TIPOS_CLIENTE.CREDITO ? datos.limite_credito : null,
    estado: true
  };

  return await clientesRepository.crear(clienteNuevo);
}

/**
 * Actualiza un cliente existente
 * @param {string} id - UUID del cliente
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>} Cliente actualizado
 */
async function actualizar(id, datos) {
  // Verificar que el cliente existe
  const clienteExistente = await clientesRepository.obtenerPorId(id);
  if (!clienteExistente) {
    throw new ErrorNoEncontrado('Cliente no encontrado');
  }

  // Validar datos (incluyendo el ID para excluirlo en la verificación de correo)
  await validarDatosCliente({ ...datos, id_cliente: id }, true);

  // Preparar datos para actualización
  const datosActualizacion = {};

  if (datos.nombre !== undefined) {
    datosActualizacion.nombre = datos.nombre.trim();
  }
  if (datos.apellido !== undefined) {
    datosActualizacion.apellido = datos.apellido ? datos.apellido.trim() : null;
  }
  if (datos.telefono !== undefined) {
    datosActualizacion.telefono = datos.telefono || null;
  }
  if (datos.correo !== undefined) {
    datosActualizacion.correo = datos.correo ? datos.correo.trim().toLowerCase() : null;
  }
  if (datos.direccion !== undefined) {
    datosActualizacion.direccion = datos.direccion || null;
  }
  if (datos.tipo_cliente !== undefined) {
    datosActualizacion.tipo_cliente = datos.tipo_cliente;
    // Si cambia a CONTADO, eliminar límite de crédito
    if (datos.tipo_cliente === TIPOS_CLIENTE.CONTADO) {
      datosActualizacion.limite_credito = null;
    }
  }
  if (datos.limite_credito !== undefined) {
    datosActualizacion.limite_credito = datos.limite_credito;
  }

  return await clientesRepository.actualizar(id, datosActualizacion);
}

/**
 * Calcula el crédito disponible para un cliente
 * @param {string} idCliente - UUID del cliente
 * @param {number} limiteCredito - Límite de crédito total del cliente
 * @returns {Promise<number>} Crédito disponible
 */
async function calcularCreditoDisponible(idCliente, limiteCredito) {
  if (!limiteCredito || limiteCredito === 0) {
    return 0;
  }

  // Obtener suma de saldos pendientes de créditos ACTIVO y VENCIDO
  const { data, error } = await supabase
    .from('creditos')
    .select('saldo_pendiente')
    .eq('id_cliente', idCliente)
    .in('estado', ['ACTIVO', 'VENCIDO']);

  if (error) {
    console.error('Error al calcular crédito disponible:', error);
    return 0;
  }

  const deudaTotal = (data || []).reduce((sum, credito) => {
    return sum + (parseFloat(credito.saldo_pendiente) || 0);
  }, 0);

  const creditoDisponible = limiteCredito - deudaTotal;
  
  return Math.max(0, creditoDisponible); // No permitir valores negativos
}

/**
 * Obtiene todos los clientes con filtros
 * @param {Object} filtros - Filtros de búsqueda
 * @returns {Promise<Object>} Objeto con datos (clientes con crédito_disponible calculado) y paginacion
 */
async function obtenerClientes(filtros = {}) {
  const resultado = await clientesRepository.obtenerTodos(filtros);
  
  // Calcular crédito disponible para cada cliente tipo CREDITO
  const clientesConCredito = await Promise.all(
    resultado.datos.map(async (cliente) => {
      if (cliente.tipo_cliente === 'CREDITO' && cliente.limite_credito) {
        const creditoDisponible = await calcularCreditoDisponible(
          cliente.id_cliente,
          parseFloat(cliente.limite_credito)
        );
        return {
          ...cliente,
          credito_disponible: creditoDisponible
        };
      }
      return {
        ...cliente,
        credito_disponible: 0
      };
    })
  );
  
  return {
    datos: clientesConCredito,
    paginacion: resultado.paginacion
  };
}

/**
 * Obtiene un cliente por ID
 * @param {string} id - UUID del cliente
 * @returns {Promise<Object>} Cliente encontrado con crédito_disponible
 */
async function obtenerClientePorId(id) {
  const cliente = await clientesRepository.obtenerPorId(id);
  
  // Calcular crédito disponible si es tipo CREDITO
  if (cliente.tipo_cliente === 'CREDITO' && cliente.limite_credito) {
    const creditoDisponible = await calcularCreditoDisponible(
      cliente.id_cliente,
      parseFloat(cliente.limite_credito)
    );
    return {
      ...cliente,
      credito_disponible: creditoDisponible
    };
  }
  
  return {
    ...cliente,
    credito_disponible: 0
  };
}

/**
 * Mueve un cliente a la papelera
 * VALIDACIONES CRÍTICAS:
 * - No permite eliminar si tiene créditos activos o vencidos (debe poder cobrarles)
 * Permite eliminar clientes de contado o clientes de crédito sin deudas pendientes
 * @param {string} id - UUID del cliente
 * @returns {Promise<Object>} Cliente eliminado
 */
async function moverPapelera(id) {
  // Verificar que el cliente existe
  const cliente = await clientesRepository.obtenerPorId(id);
  if (!cliente) {
    throw new ErrorNoEncontrado('Cliente no encontrado');
  }

  // VALIDACIÓN CRÍTICA: Verificar créditos activos o vencidos
  const tieneCreditosActivos = await clientesRepository.tieneCreditosActivos(id);
  if (tieneCreditosActivos) {
    throw new ErrorConflicto(
      'No se puede eliminar el cliente porque tiene créditos activos o vencidos pendientes de pago. ' +
      'Debe cobrar todos los créditos antes de eliminarlo.'
    );
  }

  // Si pasa las validaciones, mover a papelera (soft delete)
  return await clientesRepository.moverPapelera(id);
}

/**
 * Obtiene clientes en papelera
 * @returns {Promise<Array>} Lista de clientes eliminados
 */
async function obtenerPapelera() {
  return await clientesRepository.obtenerPapelera();
}

/**
 * Restaura un cliente desde la papelera
 * @param {string} id - UUID del cliente
 * @returns {Promise<Object>} Cliente restaurado
 */
async function restaurarDePapelera(id) {
  return await clientesRepository.restaurarDePapelera(id);
}

/**
 * Elimina permanentemente un cliente
 * ADVERTENCIA: Esta acción es irreversible
 * Solo debe usarse si el cliente no tiene ninguna relación
 * @param {string} id - UUID del cliente
 * @returns {Promise<Object>} Cliente eliminado
 */
async function eliminarPermanentemente(id) {
  // Verificar que no tenga ventas
  const cantidadVentas = await clientesRepository.contarVentas(id);
  if (cantidadVentas > 0) {
    throw new ErrorConflicto(
      `No se puede eliminar permanentemente el cliente porque tiene ${cantidadVentas} venta(s) registrada(s). ` +
      'La eliminación permanente afectaría la integridad del historial y la auditoría.'
    );
  }

  // Verificar que no tenga créditos (ni activos ni históricos)
  const creditos = await clientesRepository.obtenerCreditosCliente(id);
  if (creditos.length > 0) {
    throw new ErrorConflicto(
      `No se puede eliminar permanentemente el cliente porque tiene ${creditos.length} crédito(s) registrado(s). ` +
      'La eliminación permanente afectaría la integridad del historial financiero.'
    );
  }

  return await clientesRepository.eliminarPermanentemente(id);
}

/**
 * Activa un cliente
 * @param {string} id - UUID del cliente
 * @returns {Promise<Object>} Cliente activado
 */
async function activar(id) {
  return await clientesRepository.activar(id);
}

/**
 * Desactiva un cliente
 * @param {string} id - UUID del cliente
 * @returns {Promise<Object>} Cliente desactivado
 */
async function desactivar(id) {
  return await clientesRepository.desactivar(id);
}

/**
 * Obtiene clientes por tipo
 * @param {string} tipo - CONTADO o CREDITO
 * @returns {Promise<Array>} Lista de clientes
 */
async function obtenerClientesPorTipo(tipo) {
  if (!Object.values(TIPOS_CLIENTE).includes(tipo)) {
    throw new ErrorValidacion('Tipo de cliente inválido. Debe ser CONTADO o CREDITO');
  }

  return await clientesRepository.obtenerPorTipo(tipo);
}

/**
 * Obtiene el historial completo de créditos de un cliente
 * @param {string} id_cliente - UUID del cliente
 * @returns {Promise<Object>} Cliente con sus créditos
 */
async function obtenerHistorialCreditos(id_cliente) {
  const cliente = await clientesRepository.obtenerPorId(id_cliente);
  if (!cliente) {
    throw new ErrorNoEncontrado('Cliente no encontrado');
  }

  const creditos = await clientesRepository.obtenerCreditosCliente(id_cliente);

  return {
    cliente,
    creditos,
    total_creditos: creditos.length,
    creditos_activos: creditos.filter(c => c.estado === 'ACTIVO').length,
    creditos_vencidos: creditos.filter(c => c.estado === 'VENCIDO').length,
    creditos_pagados: creditos.filter(c => c.estado === 'PAGADO').length
  };
}

/**
 * Obtiene el historial de compras/ventas de un cliente
 * @param {string} id_cliente - UUID del cliente
 * @param {number} limite - Cantidad de resultados
 * @returns {Promise<Object>} Cliente con historial de compras
 */
async function obtenerHistorialCompras(id_cliente, limite = 50) {
  const cliente = await clientesRepository.obtenerPorId(id_cliente);
  if (!cliente) {
    throw new ErrorNoEncontrado('Cliente no encontrado');
  }

  const ventas = await clientesRepository.obtenerVentasCliente(id_cliente, limite);

  // Calcular totales
  const totalCompras = ventas.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
  const cantidadCompras = ventas.length;

  return {
    cliente,
    compras: ventas,
    total_compras: cantidadCompras,
    monto_total_compras: totalCompras,
    promedio_compra: cantidadCompras > 0 ? totalCompras / cantidadCompras : 0
  };
}

/**
 * Obtiene el reporte de deuda de un cliente
 * Incluye créditos activos, vencidos y disponibilidad de crédito
 * @param {string} id_cliente - UUID del cliente
 * @returns {Promise<Object>} Reporte completo de deuda
 */
async function obtenerReporteDeuda(id_cliente) {
  const reporte = await clientesRepository.obtenerDeudaCliente(id_cliente);

  // Validar que el cliente existe
  if (!reporte.cliente) {
    throw new ErrorNoEncontrado('Cliente no encontrado');
  }

  // Si es cliente de contado, retornar mensaje
  if (reporte.cliente.tipo_cliente === 'CONTADO') {
    return {
      ...reporte,
      mensaje: 'El cliente es de tipo CONTADO. No maneja créditos.'
    };
  }

  // Validar estado de crédito
  let estado_credito = 'DISPONIBLE';
  let alerta = null;

  if (reporte.en_mora) {
    estado_credito = 'EN MORA';
    alerta = 'El cliente tiene créditos vencidos. Revisar antes de otorgar más crédito.';
  } else if (reporte.porcentaje_utilizado >= 100) {
    estado_credito = 'LIMITE_ALCANZADO';
    alerta = 'El cliente ha alcanzado su límite de crédito. No se puede otorgar más crédito.';
  } else if (reporte.porcentaje_utilizado >= 80) {
    estado_credito = 'PROXIMO_LIMITE';
    alerta = 'El cliente está cerca de su límite de crédito.';
  }

  return {
    ...reporte,
    estado_credito,
    alerta
  };
}

module.exports = {
  // Constantes
  TIPOS_CLIENTE,
  
  // Funciones CRUD
  crear,
  actualizar,
  obtenerClientes,
  obtenerClientePorId,
  
  // Papelera
  moverPapelera,
  obtenerPapelera,
  restaurarDePapelera,
  eliminarPermanentemente,
  
  // Estado
  activar,
  desactivar,
  
  // Consultas especiales
  obtenerClientesPorTipo,
  obtenerHistorialCreditos,
  obtenerHistorialCompras,
  obtenerReporteDeuda
};
