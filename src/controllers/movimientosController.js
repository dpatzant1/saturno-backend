/**
 * Controlador de Movimientos de Inventario
 * Maneja las peticiones HTTP para la gestión de movimientos de stock
 */

const movimientosService = require('../services/movimientosService');
const { exito } = require('../utils/respuestas');

/**
 * POST /api/movimientos
 * Registra un movimiento de inventario (ENTRADA o SALIDA)
 * Actualiza automáticamente el stock del producto
 */
async function registrarMovimiento(req, res, next) {
  try {
    const datos = req.body;
    const movimiento = await movimientosService.registrarMovimiento(datos);

    exito({
      res,
      status: 201,
      mensaje: `Movimiento de ${datos.tipo_movimiento} registrado correctamente`,
      datos: movimiento
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/movimientos/entrada
 * Registra una entrada de productos al inventario
 */
async function registrarEntrada(req, res, next) {
  try {
    const datos = req.body;
    const movimiento = await movimientosService.registrarEntrada(datos);

    exito({
      res,
      status: 201,
      mensaje: 'Entrada de inventario registrada correctamente',
      datos: movimiento
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/movimientos/salida
 * Registra una salida de productos del inventario
 * Valida que haya stock suficiente
 */
async function registrarSalida(req, res, next) {
  try {
    const datos = req.body;
    const movimiento = await movimientosService.registrarSalida(datos);

    exito({
      res,
      status: 201,
      mensaje: 'Salida de inventario registrada correctamente',
      datos: movimiento
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/movimientos/ajuste
 * Ajusta el stock de un producto a una cantidad específica
 */
async function ajustarInventario(req, res, next) {
  try {
    const { id_producto, cantidad_objetivo, motivo, referencia } = req.body;
    
    const movimiento = await movimientosService.ajustarInventario(
      id_producto,
      cantidad_objetivo,
      motivo,
      referencia
    );

    exito({
      res,
      status: 201,
      mensaje: 'Inventario ajustado correctamente',
      datos: movimiento
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/movimientos
 * Obtiene todos los movimientos con filtros opcionales y paginación
 * Query params: id_producto, tipo_movimiento, fecha_desde, fecha_hasta, page, limit
 */
async function obtenerMovimientos(req, res, next) {
  try {
    const filtros = {
      id_producto: req.query.id_producto,
      tipo_movimiento: req.query.tipo_movimiento,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      page: req.query.page,
      limit: req.query.limit
    };

    const resultado = await movimientosService.obtenerMovimientos(filtros);

    exito({
      res,
      mensaje: 'Movimientos obtenidos correctamente',
      datos: resultado.datos,
      metadatos: { paginacion: resultado.paginacion }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/movimientos/:id
 * Obtiene un movimiento específico por ID
 */
async function obtenerMovimientoPorId(req, res, next) {
  try {
    const { id } = req.params;
    const movimiento = await movimientosService.obtenerMovimientoPorId(id);

    exito({
      res,
      mensaje: 'Movimiento obtenido correctamente',
      datos: movimiento
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/movimientos/producto/:id_producto/historial
 * Obtiene el historial de movimientos de un producto
 */
async function obtenerHistorialProducto(req, res, next) {
  try {
    const { id_producto } = req.params;
    const limite = req.query.limite ? parseInt(req.query.limite) : 100;

    const historial = await movimientosService.obtenerHistorialProducto(id_producto, limite);

    exito({
      res,
      mensaje: 'Historial obtenido correctamente',
      datos: historial,
      metadatos: {
        total: historial.length,
        limite
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/movimientos/producto/:id_producto/estadisticas
 * Obtiene estadísticas de movimientos de un producto
 */
async function obtenerEstadisticasProducto(req, res, next) {
  try {
    const { id_producto } = req.params;
    const estadisticas = await movimientosService.obtenerEstadisticasProducto(id_producto);

    exito({
      res,
      mensaje: 'Estadísticas obtenidas correctamente',
      datos: estadisticas
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/movimientos/producto/:id_producto/kardex
 * Obtiene el kardex (registro detallado) de un producto
 */
async function obtenerKardex(req, res, next) {
  try {
    const { id_producto } = req.params;
    const { fecha_desde, fecha_hasta } = req.query;

    const kardex = await movimientosService.obtenerKardex(
      id_producto,
      fecha_desde,
      fecha_hasta
    );

    exito({
      res,
      mensaje: 'Kardex obtenido correctamente',
      datos: kardex
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/movimientos/reporte
 * Obtiene reporte de movimientos por rango de fechas
 */
async function obtenerReportePorFecha(req, res, next) {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    const reporte = await movimientosService.obtenerReportePorFecha(
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

module.exports = {
  registrarMovimiento,
  registrarEntrada,
  registrarSalida,
  ajustarInventario,
  obtenerMovimientos,
  obtenerMovimientoPorId,
  obtenerHistorialProducto,
  obtenerEstadisticasProducto,
  obtenerKardex,
  obtenerReportePorFecha
};
