/**
 * Controlador de Productos
 * Maneja las peticiones HTTP relacionadas con productos
 */

const productosService = require('../services/productosService');
const { exito, creado, actualizado, eliminado } = require('../utils/respuestas');

/**
 * Obtener todos los productos activos
 * GET /api/productos
 * Query params: ?busqueda=texto&id_categoria=uuid&stock_minimo=true&soloActivos=true&page=1&limit=10
 */
const obtenerTodos = async (req, res, next) => {
  try {
    const { busqueda, id_categoria, stock_minimo, soloActivos, page, limit } = req.query;
    
    const filtros = {
      busqueda,
      id_categoria,
      stock_minimo: stock_minimo === 'true',
      soloActivos: soloActivos !== 'false',
      page,
      limit
    };

    const resultado = await productosService.obtenerTodos(filtros);
    exito({ 
      res, 
      datos: resultado.datos, 
      mensaje: 'Productos obtenidos exitosamente',
      metadatos: { paginacion: resultado.paginacion }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener lista simple de productos activos (sin paginación)
 * GET /api/productos/lista-simple
 * Retorna solo: id, nombre, precio_venta, cantidad_stock, unidad_medida
 * Útil para selectores y dropdowns en el frontend
 */
const obtenerListaSimple = async (req, res, next) => {
  try {
    const productos = await productosService.obtenerListaSimple();
    exito({ res, datos: productos, mensaje: 'Lista de productos obtenida exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener productos en papelera
 * GET /api/productos/papelera
 */
const obtenerPapelera = async (req, res, next) => {
  try {
    const productos = await productosService.obtenerPapelera();
    exito({ res, datos: productos, mensaje: 'Productos en papelera obtenidos exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener productos con stock bajo
 * GET /api/productos/stock-bajo
 */
const obtenerStockBajo = async (req, res, next) => {
  try {
    const productos = await productosService.obtenerStockBajo();
    exito({ res, datos: productos, mensaje: 'Productos con stock bajo obtenidos exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener producto por ID
 * GET /api/productos/:id
 */
const obtenerPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const producto = await productosService.obtenerPorId(id);
    exito({ res, datos: producto, mensaje: 'Producto obtenido exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear nuevo producto
 * POST /api/productos
 * Body: { id_categoria, nombre, descripcion?, precio_venta, unidad_medida, cantidad_stock?, stock_minimo? }
 */
const crear = async (req, res, next) => {
  try {
    const { id_categoria, nombre, descripcion, precio_venta, unidad_medida, cantidad_stock, stock_minimo } = req.body;
    
    const producto = await productosService.crear({
      id_categoria,
      nombre,
      descripcion,
      precio_venta,
      unidad_medida,
      cantidad_stock,
      stock_minimo
    });
    
    creado({ res, datos: producto, mensaje: 'Producto creado exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar producto
 * PUT /api/productos/:id
 * Body: { id_categoria?, nombre?, descripcion?, precio_venta?, unidad_medida?, cantidad_stock?, stock_minimo? }
 */
const actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id_categoria, nombre, descripcion, precio_venta, unidad_medida, cantidad_stock, stock_minimo } = req.body;
    
    const producto = await productosService.actualizar(id, {
      id_categoria,
      nombre,
      descripcion,
      precio_venta,
      unidad_medida,
      cantidad_stock,
      stock_minimo
    });
    
    actualizado({ res, datos: producto, mensaje: 'Producto actualizado exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Mover producto a papelera (soft delete)
 * DELETE /api/productos/:id
 */
const moverPapelera = async (req, res, next) => {
  try {
    const { id } = req.params;
    await productosService.moverPapelera(id);
    eliminado({ res, mensaje: 'Producto movido a papelera exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Restaurar producto desde papelera
 * PATCH /api/productos/:id/restaurar
 */
const restaurarDePapelera = async (req, res, next) => {
  try {
    const { id } = req.params;
    const producto = await productosService.restaurarDePapelera(id);
    actualizado({ res, datos: producto, mensaje: 'Producto restaurado exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar producto permanentemente
 * DELETE /api/productos/:id/permanente
 */
const eliminarPermanentemente = async (req, res, next) => {
  try {
    const { id } = req.params;
    await productosService.eliminarPermanentemente(id);
    eliminado({ res, mensaje: 'Producto eliminado permanentemente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Activar producto
 * PATCH /api/productos/:id/activar
 */
const activar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const producto = await productosService.activar(id);
    actualizado({ res, datos: producto, mensaje: 'Producto activado exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Desactivar producto
 * PATCH /api/productos/:id/desactivar
 */
const desactivar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const producto = await productosService.desactivar(id);
    actualizado({ res, datos: producto, mensaje: 'Producto desactivado exitosamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerTodos,
  obtenerListaSimple,
  obtenerPapelera,
  obtenerStockBajo,
  obtenerPorId,
  crear,
  actualizar,
  moverPapelera,
  restaurarDePapelera,
  eliminarPermanentemente,
  activar,
  desactivar
};
