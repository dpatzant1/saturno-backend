/**
 * Controlador de Créditos
 * Maneja las peticiones HTTP para la gestión de créditos y pagos
 */

const creditosService = require('../services/creditosService');
const pagosRepository = require('../repositories/pagosRepository');
const { exito } = require('../utils/respuestas');

/**
 * POST /api/creditos
 * Crea un nuevo crédito
 */
async function crearCredito(req, res, next) {
  try {
    const credito = await creditosService.crearCredito(req.body);

    exito({
      res,
      status: 201,
      mensaje: 'Crédito creado correctamente',
      datos: credito
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/creditos
 * Obtiene todos los créditos con filtros opcionales y paginación
 * Query params: id_cliente, estado, fecha_desde, fecha_hasta, page, limit
 */
async function obtenerCreditos(req, res, next) {
  try {
    const filtros = {
      id_cliente: req.query.id_cliente,
      estado: req.query.estado,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      page: req.query.page,
      limit: req.query.limit
    };

    const resultado = await creditosService.obtenerCreditos(filtros);

    exito({
      res,
      mensaje: 'Créditos obtenidos correctamente',
      datos: resultado.datos,
      metadatos: { paginacion: resultado.paginacion }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/creditos/:id
 * Obtiene un crédito por ID con historial de pagos
 */
async function obtenerCreditoPorId(req, res, next) {
  try {
    const { id } = req.params;
    const credito = await creditosService.obtenerCreditoPorId(id);

    exito({
      res,
      mensaje: 'Crédito obtenido correctamente',
      datos: credito
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/creditos/activos
 * Obtiene créditos activos
 */
async function obtenerCreditosActivos(req, res, next) {
  try {
    const filtros = {
      limite: req.query.limite ? parseInt(req.query.limite) : 50,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    const resultado = await creditosService.obtenerCreditosActivos(filtros);

    exito({
      res,
      mensaje: 'Créditos activos obtenidos correctamente',
      datos: resultado.creditos,
      metadatos: {
        total: resultado.total,
        limite: resultado.limite,
        offset: resultado.offset
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/creditos/vencidos
 * Obtiene créditos vencidos
 */
async function obtenerCreditosVencidos(req, res, next) {
  try {
    const creditos = await creditosService.obtenerCreditosVencidos();

    exito({
      res,
      mensaje: 'Créditos vencidos obtenidos correctamente',
      datos: creditos
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/creditos/cliente/:id_cliente
 * Obtiene créditos de un cliente específico
 */
async function obtenerCreditosPorCliente(req, res, next) {
  try {
    const { id_cliente } = req.params;
    const filtros = {
      limite: req.query.limite ? parseInt(req.query.limite) : 50,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    const resultado = await creditosService.obtenerCreditosPorCliente(id_cliente, filtros);

    exito({
      res,
      mensaje: 'Créditos del cliente obtenidos correctamente',
      datos: resultado
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/creditos/:id/pagar
 * Registra un pago a un crédito
 */
async function registrarPago(req, res, next) {
  try {
    const { id } = req.params;
    const datos = {
      ...req.body,
      id_credito: id,
      id_usuario: req.usuario.id_usuario // Agregar ID del usuario autenticado
    };

    const resultado = await creditosService.registrarPago(datos);

    exito({
      res,
      status: 201,
      mensaje: resultado.credito_liquidado 
        ? 'Pago registrado correctamente. Crédito liquidado'
        : 'Pago registrado correctamente',
      datos: resultado
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/creditos/dashboard/cobranza
 * Obtiene dashboard de cobranza
 */
async function obtenerDashboardCobranza(req, res, next) {
  try {
    const dashboard = await creditosService.obtenerDashboardCobranza();

    exito({
      res,
      mensaje: 'Dashboard de cobranza obtenido correctamente',
      datos: dashboard
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/creditos/reportes/cartera-vencida
 * Obtiene reporte de cartera vencida
 */
async function obtenerReporteCarteraVencida(req, res, next) {
  try {
    const reporte = await creditosService.obtenerReporteCarteraVencida();

    exito({
      res,
      mensaje: 'Reporte de cartera vencida generado correctamente',
      datos: reporte
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/creditos/alertas/proximos-vencer
 * Obtiene créditos próximos a vencer
 */
async function obtenerCreditosProximosAVencer(req, res, next) {
  try {
    const dias = req.query.dias ? parseInt(req.query.dias) : 7;
    const resultado = await creditosService.obtenerCreditosProximosAVencer(dias);

    exito({
      res,
      mensaje: 'Créditos próximos a vencer obtenidos correctamente',
      datos: resultado
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/creditos/:id/pagos
 * Obtiene historial de pagos de un crédito
 */
async function obtenerPagosDeCredito(req, res, next) {
  try {
    const { id } = req.params;
    const pagos = await pagosRepository.obtenerPorCredito(id);

    const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.monto_pagado), 0);

    exito({
      res,
      mensaje: 'Historial de pagos obtenido correctamente',
      datos: {
        pagos,
        total_pagos: pagos.length,
        total_pagado: totalPagado
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  crearCredito,
  obtenerCreditos,
  obtenerCreditoPorId,
  obtenerCreditosActivos,
  obtenerCreditosVencidos,
  obtenerCreditosPorCliente,
  registrarPago,
  obtenerDashboardCobranza,
  obtenerReporteCarteraVencida,
  obtenerCreditosProximosAVencer,
  obtenerPagosDeCredito
};
