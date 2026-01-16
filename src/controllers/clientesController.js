/**
 * Controlador de Clientes
 * Maneja las peticiones HTTP para la gestión de clientes
 */

const clientesService = require('../services/clientesService');
const { exito, creado } = require('../utils/respuestas');

/**
 * GET /api/clientes
 * Obtiene todos los clientes activos con filtros opcionales y paginación
 * Query params: busqueda, tipo_cliente, soloActivos, page, limit
 */
async function obtenerClientes(req, res, next) {
  try {
    const filtros = {
      busqueda: req.query.busqueda,
      tipo_cliente: req.query.tipo_cliente,
      soloActivos: req.query.soloActivos !== 'false', // Por defecto true
      page: req.query.page,
      limit: req.query.limit
    };

    const resultado = await clientesService.obtenerClientes(filtros);

    return exito({ 
      res, 
      datos: resultado.datos, 
      mensaje: 'Clientes obtenidos correctamente',
      metadatos: { paginacion: resultado.paginacion }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/clientes/papelera
 * Obtiene clientes en papelera
 */
async function obtenerPapelera(req, res, next) {
  try {
    const clientes = await clientesService.obtenerPapelera();

    return exito({ res, datos: clientes, mensaje: 'Clientes en papelera obtenidos correctamente' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/clientes/tipo/:tipo
 * Obtiene clientes por tipo (CONTADO o CREDITO)
 */
async function obtenerPorTipo(req, res, next) {
  try {
    const { tipo } = req.params;
    const clientes = await clientesService.obtenerClientesPorTipo(tipo.toUpperCase());

    return exito({ res, datos: clientes, mensaje: `Clientes de tipo ${tipo} obtenidos correctamente` });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/clientes/:id
 * Obtiene un cliente por ID
 */
async function obtenerClientePorId(req, res, next) {
  try {
    const { id } = req.params;
    const cliente = await clientesService.obtenerClientePorId(id);

    return exito({ res, datos: cliente, mensaje: 'Cliente obtenido correctamente' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/clientes/:id/creditos
 * Obtiene el historial de créditos de un cliente
 */
async function obtenerHistorialCreditos(req, res, next) {
  try {
    const { id } = req.params;
    const historial = await clientesService.obtenerHistorialCreditos(id);

    return exito({ res, datos: historial, mensaje: 'Historial de créditos obtenido correctamente' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/clientes
 * Crea un nuevo cliente
 */
async function crear(req, res, next) {
  try {
    const datos = req.body;
    const cliente = await clientesService.crear(datos);

    return creado({ res, datos: cliente, mensaje: 'Cliente creado correctamente' });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/clientes/:id
 * Actualiza un cliente existente
 */
async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const datos = req.body;
    const cliente = await clientesService.actualizar(id, datos);

    return exito({ res, datos: cliente, mensaje: 'Cliente actualizado correctamente' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/clientes/:id/activar
 * Activa un cliente
 */
async function activar(req, res, next) {
  try {
    const { id } = req.params;
    const cliente = await clientesService.activar(id);

    return exito({ res, datos: cliente, mensaje: 'Cliente activado correctamente' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/clientes/:id/desactivar
 * Desactiva un cliente
 */
async function desactivar(req, res, next) {
  try {
    const { id } = req.params;
    const cliente = await clientesService.desactivar(id);

    return exito({ res, datos: cliente, mensaje: 'Cliente desactivado correctamente' });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/clientes/:id
 * Mueve un cliente a la papelera (soft delete)
 * Valida que no tenga créditos activos ni ventas recientes
 */
async function moverPapelera(req, res, next) {
  try {
    const { id } = req.params;
    const cliente = await clientesService.moverPapelera(id);

    return exito({ res, datos: cliente, mensaje: 'Cliente movido a papelera correctamente' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/clientes/:id/restaurar
 * Restaura un cliente desde la papelera
 */
async function restaurarDePapelera(req, res, next) {
  try {
    const { id } = req.params;
    const cliente = await clientesService.restaurarDePapelera(id);

    return exito({ res, datos: cliente, mensaje: 'Cliente restaurado correctamente' });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/clientes/:id/permanente
 * Elimina permanentemente un cliente
 * Solo permite si no tiene ventas ni créditos
 */
async function eliminarPermanentemente(req, res, next) {
  try {
    const { id } = req.params;
    const cliente = await clientesService.eliminarPermanentemente(id);

    return exito({ res, datos: cliente, mensaje: 'Cliente eliminado permanentemente' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/clientes/:id/compras
 * Obtiene el historial de compras/ventas de un cliente
 */
async function obtenerHistorialCompras(req, res, next) {
  try {
    const { id } = req.params;
    const limite = req.query.limite ? parseInt(req.query.limite) : 50;

    const historial = await clientesService.obtenerHistorialCompras(id, limite);

    return exito({ res, datos: historial, mensaje: 'Historial de compras obtenido correctamente' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/clientes/:id/deuda
 * Obtiene el reporte de deuda de un cliente
 * Incluye créditos activos, vencidos y disponibilidad
 */
async function obtenerReporteDeuda(req, res, next) {
  try {
    const { id } = req.params;
    const reporte = await clientesService.obtenerReporteDeuda(id);

    return exito({ res, datos: reporte, mensaje: 'Reporte de deuda obtenido correctamente' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  obtenerClientes,
  obtenerPapelera,
  obtenerPorTipo,
  obtenerClientePorId,
  obtenerHistorialCreditos,
  obtenerHistorialCompras,
  obtenerReporteDeuda,
  crear,
  actualizar,
  activar,
  desactivar,
  moverPapelera,
  restaurarDePapelera,
  eliminarPermanentemente
};
