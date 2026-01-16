/**
 * Servicio de Categorías
 * Contiene la lógica de negocio para la gestión de categorías
 * Incluye validaciones y reglas de negocio para papelera
 */

const categoriasRepository = require('../repositories/categoriasRepository');
const { ErrorValidacion, ErrorConflicto } = require('../utils/errores');

/**
 * Validar datos de categoría
 * @param {Object} datos - { nombre, descripcion? }
 * @param {string} [idCategoriaExcluir] - ID a excluir en validación de duplicados
 */
const validarDatosCategoria = async (datos, idCategoriaExcluir = null) => {
  const errores = [];

  // Validar nombre
  if (!datos.nombre || typeof datos.nombre !== 'string') {
    errores.push('El nombre es requerido');
  } else if (datos.nombre.trim().length === 0) {
    errores.push('El nombre no puede estar vacío');
  } else if (datos.nombre.length > 100) {
    errores.push('El nombre no puede exceder los 100 caracteres');
  } else {
    // Verificar nombre único
    const existe = await categoriasRepository.existePorNombre(datos.nombre, idCategoriaExcluir);
    if (existe) {
      errores.push('Ya existe una categoría con ese nombre');
    }
  }

  // Validar descripción (opcional)
  if (datos.descripcion !== undefined && datos.descripcion !== null) {
    if (typeof datos.descripcion !== 'string') {
      errores.push('La descripción debe ser texto');
    }
  }

  if (errores.length > 0) {
    throw new ErrorValidacion('Errores de validación', errores);
  }
};

/**
 * Obtener todas las categorías activas
 * @param {Object} filtros - { busqueda?, soloActivas? }
 * @returns {Promise<Array>} Lista de categorías
 */
const obtenerTodas = async (filtros = {}) => {
  return await categoriasRepository.obtenerTodas(filtros);
};

/**
 * Obtener categorías en papelera
 * @returns {Promise<Array>} Lista de categorías eliminadas
 */
const obtenerPapelera = async () => {
  return await categoriasRepository.obtenerPapelera();
};

/**
 * Obtener categoría por ID
 * @param {string} idCategoria - UUID de la categoría
 * @returns {Promise<Object>} Categoría encontrada
 */
const obtenerPorId = async (idCategoria) => {
  if (!idCategoria) {
    throw new ErrorValidacion('ID de categoría requerido');
  }

  return await categoriasRepository.obtenerPorId(idCategoria);
};

/**
 * Crear nueva categoría
 * @param {Object} datosCategoria - { nombre, descripcion? }
 * @returns {Promise<Object>} Categoría creada
 */
const crear = async (datosCategoria) => {
  // Validar datos
  await validarDatosCategoria(datosCategoria);

  // Crear categoría
  const categoria = await categoriasRepository.crear({
    nombre: datosCategoria.nombre.trim(),
    descripcion: datosCategoria.descripcion?.trim() || null
  });

  return categoria;
};

/**
 * Actualizar categoría
 * @param {string} idCategoria - UUID de la categoría
 * @param {Object} datosActualizar - { nombre?, descripcion? }
 * @returns {Promise<Object>} Categoría actualizada
 */
const actualizar = async (idCategoria, datosActualizar) => {
  if (!idCategoria) {
    throw new ErrorValidacion('ID de categoría requerido');
  }

  // Verificar que la categoría existe
  await categoriasRepository.obtenerPorId(idCategoria);

  // Validar datos a actualizar
  if (datosActualizar.nombre || datosActualizar.descripcion !== undefined) {
    await validarDatosCategoria(datosActualizar, idCategoria);
  }

  // Preparar datos a actualizar
  const datos = {};
  if (datosActualizar.nombre) {
    datos.nombre = datosActualizar.nombre.trim();
  }
  if (datosActualizar.descripcion !== undefined) {
    datos.descripcion = datosActualizar.descripcion?.trim() || null;
  }

  if (Object.keys(datos).length === 0) {
    throw new ErrorValidacion('No hay datos para actualizar');
  }

  return await categoriasRepository.actualizar(idCategoria, datos);
};

/**
 * Mover categoría a papelera (soft delete)
 * @param {string} idCategoria - UUID de la categoría
 * @returns {Promise<Object>} Categoría movida a papelera
 */
const moverPapelera = async (idCategoria) => {
  if (!idCategoria) {
    throw new ErrorValidacion('ID de categoría requerido');
  }

  // Verificar que la categoría existe
  await categoriasRepository.obtenerPorId(idCategoria);

  // Verificar que no tiene productos activos
  const tieneProductos = await categoriasRepository.tieneProductosActivos(idCategoria);
  if (tieneProductos) {
    throw new ErrorConflicto(
      'No se puede eliminar la categoría porque tiene productos activos asociados'
    );
  }

  return await categoriasRepository.moverPapelera(idCategoria);
};

/**
 * Restaurar categoría desde papelera
 * @param {string} idCategoria - UUID de la categoría
 * @returns {Promise<Object>} Categoría restaurada
 */
const restaurarDePapelera = async (idCategoria) => {
  if (!idCategoria) {
    throw new ErrorValidacion('ID de categoría requerido');
  }

  // Verificar que no exista otra categoría activa con el mismo nombre
  const categoriaEliminada = await categoriasRepository.obtenerPorId(idCategoria, true);
  
  const existe = await categoriasRepository.existePorNombre(categoriaEliminada.nombre);
  if (existe) {
    throw new ErrorConflicto(
      'Ya existe una categoría activa con ese nombre. Cambie el nombre antes de restaurar'
    );
  }

  return await categoriasRepository.restaurarDePapelera(idCategoria);
};

/**
 * Eliminar categoría permanentemente
 * @param {string} idCategoria - UUID de la categoría
 * @returns {Promise<void>}
 */
const eliminarPermanentemente = async (idCategoria) => {
  if (!idCategoria) {
    throw new ErrorValidacion('ID de categoría requerido');
  }

  // Verificar que la categoría existe (incluso en papelera)
  await categoriasRepository.obtenerPorId(idCategoria, true);

  // Verificar que no tiene productos (incluyendo inactivos y eliminados)
  const tieneProductos = await categoriasRepository.tieneProductos(idCategoria);
  if (tieneProductos) {
    throw new ErrorConflicto(
      'No se puede eliminar permanentemente la categoría porque tiene productos asociados (activos, inactivos o en papelera). ' +
      'Elimine o reasigne todos los productos de esta categoría primero.'
    );
  }

  await categoriasRepository.eliminarPermanentemente(idCategoria);
};

/**
 * Activar categoría
 * @param {string} idCategoria - UUID de la categoría
 * @returns {Promise<Object>} Categoría activada
 */
const activar = async (idCategoria) => {
  if (!idCategoria) {
    throw new ErrorValidacion('ID de categoría requerido');
  }

  return await categoriasRepository.cambiarEstado(idCategoria, true);
};

/**
 * Desactivar categoría
 * @param {string} idCategoria - UUID de la categoría
 * @returns {Promise<Object>} Categoría desactivada
 */
const desactivar = async (idCategoria) => {
  if (!idCategoria) {
    throw new ErrorValidacion('ID de categoría requerido');
  }

  return await categoriasRepository.cambiarEstado(idCategoria, false);
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
