/**
 * Controlador de Categorías
 * Maneja las peticiones HTTP relacionadas con categorías
 */

const categoriasService = require('../services/categoriasService');
const { exito, creado, actualizado, eliminado } = require('../utils/respuestas');

/**
 * Obtener todas las categorías activas con paginación
 * GET /api/categorias
 * Query params: ?busqueda=texto&soloActivas=true&page=1&limit=10
 */
const obtenerTodas = async (req, res, next) => {
  try {
    const { busqueda, soloActivas, page, limit } = req.query;
    
    const filtros = {
      busqueda,
      soloActivas: soloActivas !== 'false', // Por defecto true
      page,
      limit
    };

    const resultado = await categoriasService.obtenerTodas(filtros);
    exito({ 
      res, 
      datos: resultado.datos, 
      mensaje: 'Categorías obtenidas exitosamente',
      metadatos: { paginacion: resultado.paginacion }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener categorías en papelera
 * GET /api/categorias/papelera
 */
const obtenerPapelera = async (req, res, next) => {
  try {
    const categorias = await categoriasService.obtenerPapelera();
    exito({ res, datos: categorias, mensaje: 'Categorías en papelera obtenidas exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener categoría por ID
 * GET /api/categorias/:id
 */
const obtenerPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const categoria = await categoriasService.obtenerPorId(id);
    exito({ res, datos: categoria, mensaje: 'Categoría obtenida exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear nueva categoría
 * POST /api/categorias
 * Body: { nombre, descripcion? }
 */
const crear = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    const categoria = await categoriasService.crear({ nombre, descripcion });
    creado({ res, datos: categoria, mensaje: 'Categoría creada exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar categoría
 * PUT /api/categorias/:id
 * Body: { nombre?, descripcion? }
 */
const actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    const categoria = await categoriasService.actualizar(id, { nombre, descripcion });
    actualizado({ res, datos: categoria, mensaje: 'Categoría actualizada exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Mover categoría a papelera (soft delete)
 * DELETE /api/categorias/:id
 */
const moverPapelera = async (req, res, next) => {
  try {
    const { id } = req.params;
    const categoria = await categoriasService.moverPapelera(id);
    eliminado({ res, datos: categoria, mensaje: 'Categoría movida a papelera exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Restaurar categoría desde papelera
 * PATCH /api/categorias/:id/restaurar
 */
const restaurarDePapelera = async (req, res, next) => {
  try {
    const { id } = req.params;
    const categoria = await categoriasService.restaurarDePapelera(id);
    actualizado({ res, datos: categoria, mensaje: 'Categoría restaurada exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar categoría permanentemente
 * DELETE /api/categorias/:id/permanente
 */
const eliminarPermanentemente = async (req, res, next) => {
  try {
    const { id } = req.params;
    await categoriasService.eliminarPermanentemente(id);
    eliminado({ res, mensaje: 'Categoría eliminada permanentemente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Activar categoría
 * PATCH /api/categorias/:id/activar
 */
const activar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const categoria = await categoriasService.activar(id);
    actualizado({ res, datos: categoria, mensaje: 'Categoría activada exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Desactivar categoría
 * PATCH /api/categorias/:id/desactivar
 */
const desactivar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const categoria = await categoriasService.desactivar(id);
    actualizado({ res, datos: categoria, mensaje: 'Categoría desactivada exitosamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerTodas,
  obtenerPapelera,
  obtenerPorId,
  crear,
  actualizar,
  moverPapelera,
  restaurarDePapelera,
  eliminarPermanentemente,
  activar,
  desactivar
};
