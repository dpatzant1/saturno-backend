/**
 * Controlador de Ventas
 * Maneja las peticiones HTTP para la gestión de ventas
 */

const ventasService = require('../services/ventasService');
const detalleVentaRepository = require('../repositories/detalleVentaRepository');
const { exito } = require('../utils/respuestas');

/**
 * POST /api/ventas/contado
 * Crea una venta al CONTADO
 * Valida stock, crea venta, detalles y genera movimientos automáticamente
 */
async function crearVentaContado(req, res, next) {
  try {
    const datos = {
      ...req.body,
      id_usuario: req.usuario.id_usuario // Del token JWT
    };

    const venta = await ventasService.crearVentaContado(datos);

    exito({
      res,
      status: 201,
      mensaje: 'Venta al contado creada correctamente',
      datos: venta
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/ventas/credito
 * Crea una venta a CRÉDITO
 * Valida límite de crédito, stock, crea venta, detalles, movimientos y registro de crédito
 */
async function crearVentaCredito(req, res, next) {
  try {
    const datos = {
      ...req.body,
      id_usuario: req.usuario.id_usuario // Del token JWT
    };

    const venta = await ventasService.crearVentaCredito(datos);

    exito({
      res,
      status: 201,
      mensaje: 'Venta a crédito creada correctamente',
      datos: venta
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/ventas
 * Obtiene todas las ventas con filtros opcionales y paginación
 * Query params: id_cliente, id_usuario, tipo_venta, estado, fecha_desde, fecha_hasta, page, limit
 */
async function obtenerVentas(req, res, next) {
  try {
    const filtros = {
      id_cliente: req.query.id_cliente,
      id_usuario: req.query.id_usuario,
      tipo_venta: req.query.tipo_venta,
      estado: req.query.estado,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      busqueda: req.query.busqueda,
      page: req.query.page,
      limit: req.query.limit
    };

    const resultado = await ventasService.obtenerVentas(filtros);

    exito({
      res,
      mensaje: 'Ventas obtenidas correctamente',
      datos: resultado.datos,
      metadatos: { paginacion: resultado.paginacion }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/ventas/:id
 * Obtiene una venta específica por ID con todos sus detalles
 */
async function obtenerVentaPorId(req, res, next) {
  try {
    const { id } = req.params;
    const venta = await ventasService.obtenerVentaPorId(id);

    exito({
      res,
      mensaje: 'Venta obtenida correctamente',
      datos: venta
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/ventas/:id/anular
 * Anula una venta y reversa el stock
 */
async function anularVenta(req, res, next) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const resultado = await ventasService.anularVenta(id, motivo);

    exito({
      res,
      mensaje: 'Venta anulada correctamente',
      datos: resultado
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/ventas/cliente/:id_cliente
 * Obtiene ventas de un cliente específico
 */
async function obtenerVentasPorCliente(req, res, next) {
  try {
    const { id_cliente } = req.params;
    const resultado = await ventasService.obtenerVentasPorCliente(id_cliente);

    exito({
      res,
      mensaje: 'Ventas del cliente obtenidas correctamente',
      datos: resultado
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/ventas/usuario/:id_usuario
 * Obtiene ventas de un usuario/vendedor específico
 */
async function obtenerVentasPorUsuario(req, res, next) {
  try {
    const { id_usuario } = req.params;
    const resultado = await ventasService.obtenerVentasPorUsuario(id_usuario);

    exito({
      res,
      mensaje: 'Ventas del vendedor obtenidas correctamente',
      datos: resultado
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/ventas/dashboard/dia
 * Obtiene dashboard de ventas del día actual
 */
async function obtenerDashboardDia(req, res, next) {
  try {
    const dashboard = await ventasService.obtenerDashboardDia();

    exito({
      res,
      mensaje: 'Dashboard del día obtenido correctamente',
      datos: dashboard
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/ventas/reporte
 * Obtiene reporte de ventas por período
 * Query params: fecha_desde, fecha_hasta (requeridos)
 */
async function obtenerReportePorPeriodo(req, res, next) {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    const reporte = await ventasService.obtenerReportePorPeriodo(
      fecha_desde,
      fecha_hasta
    );

    exito({
      res,
      mensaje: 'Reporte generado correctamente',
      datos: reporte
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/ventas/productos/mas-vendidos
 * Obtiene los productos más vendidos en un período
 */
async function obtenerProductosMasVendidos(req, res, next) {
  try {
    const { fecha_desde, fecha_hasta, limite } = req.query;

    const productos = await detalleVentaRepository.obtenerProductosMasVendidos(
      fecha_desde || null,
      fecha_hasta || null,
      limite ? parseInt(limite) : 10
    );

    exito({
      res,
      mensaje: 'Productos más vendidos obtenidos correctamente',
      datos: productos
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  crearVentaContado,
  crearVentaCredito,
  obtenerVentas,
  obtenerVentaPorId,
  anularVenta,
  obtenerVentasPorCliente,
  obtenerVentasPorUsuario,
  obtenerDashboardDia,
  obtenerReportePorPeriodo,
  obtenerProductosMasVendidos
};
