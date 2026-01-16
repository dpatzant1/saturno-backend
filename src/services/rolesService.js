/**
 * Servicio de Roles
 * Contiene la lógica de negocio para la gestión de roles
 */

const rolesRepository = require('../repositories/rolesRepository');
const { ErrorNoEncontrado, ErrorValidacion, lanzarSi } = require('../utils/errores');

/**
 * Obtener todos los roles
 * @returns {Promise<Array>} Lista de roles
 */
const obtenerTodos = async () => {
  return await rolesRepository.obtenerTodos();
};

/**
 * Obtener un rol por ID
 * @param {String} idRol - UUID del rol
 * @returns {Promise<Object>} Rol encontrado
 */
const obtenerPorId = async (idRol) => {
  const rol = await rolesRepository.obtenerPorId(idRol);
  
  if (!rol) {
    throw new ErrorNoEncontrado('Rol');
  }
  
  return rol;
};

/**
 * Obtener un rol por nombre
 * @param {String} nombre - Nombre del rol
 * @returns {Promise<Object>} Rol encontrado
 */
const obtenerPorNombre = async (nombre) => {
  const rol = await rolesRepository.obtenerPorNombre(nombre);
  
  if (!rol) {
    throw new ErrorNoEncontrado('Rol');
  }
  
  return rol;
};

/**
 * Crear un nuevo rol
 * @param {Object} datosRol - { nombre, descripcion? }
 * @returns {Promise<Object>} Rol creado
 */
const crear = async (datosRol) => {
  // Validar que el nombre no esté vacío
  lanzarSi(!datosRol.nombre || datosRol.nombre.trim() === '', 
    'El nombre del rol es requerido', 400);
  
  // Validar longitud del nombre
  lanzarSi(datosRol.nombre.length > 50, 
    'El nombre del rol no puede exceder 50 caracteres', 400);
  
  // Verificar que no exista un rol con el mismo nombre
  const existe = await rolesRepository.existePorNombre(datosRol.nombre);
  lanzarSi(existe, 'Ya existe un rol con ese nombre', 409);
  
  // Crear el rol
  return await rolesRepository.crear({
    nombre: datosRol.nombre.trim().toUpperCase(),
    descripcion: datosRol.descripcion?.trim() || null
  });
};

/**
 * Actualizar un rol existente
 * @param {String} idRol - UUID del rol
 * @param {Object} datosRol - Datos a actualizar
 * @returns {Promise<Object>} Rol actualizado
 */
const actualizar = async (idRol, datosRol) => {
  // Verificar que el rol existe
  await obtenerPorId(idRol);
  
  // Si se está actualizando el nombre, validar
  if (datosRol.nombre) {
    lanzarSi(datosRol.nombre.trim() === '', 
      'El nombre del rol no puede estar vacío', 400);
    
    lanzarSi(datosRol.nombre.length > 50, 
      'El nombre del rol no puede exceder 50 caracteres', 400);
    
    // Verificar que no exista otro rol con el mismo nombre
    const rolExistente = await rolesRepository.obtenerPorNombre(datosRol.nombre);
    if (rolExistente && rolExistente.id_rol !== idRol) {
      throw new ErrorValidacion('Ya existe otro rol con ese nombre');
    }
    
    datosRol.nombre = datosRol.nombre.trim().toUpperCase();
  }
  
  // Limpiar descripción si se proporciona
  if (datosRol.descripcion !== undefined) {
    datosRol.descripcion = datosRol.descripcion?.trim() || null;
  }
  
  return await rolesRepository.actualizar(idRol, datosRol);
};

/**
 * Desactivar un rol
 * @param {String} idRol - UUID del rol
 * @returns {Promise<Object>} Rol desactivado
 */
const desactivar = async (idRol) => {
  // Verificar que el rol existe
  await obtenerPorId(idRol);
  
  // TODO: Validar que no haya usuarios activos con este rol
  // (se implementará cuando tengamos el módulo de usuarios)
  
  return await rolesRepository.cambiarEstado(idRol, false);
};

/**
 * Activar un rol
 * @param {String} idRol - UUID del rol
 * @returns {Promise<Object>} Rol activado
 */
const activar = async (idRol) => {
  return await rolesRepository.cambiarEstado(idRol, true);
};

/**
 * Verificar si un rol existe por nombre
 * @param {String} nombre - Nombre del rol
 * @returns {Promise<Boolean>} true si existe
 */
const existePorNombre = async (nombre) => {
  return await rolesRepository.existePorNombre(nombre);
};

module.exports = {
  obtenerTodos,
  obtenerPorId,
  obtenerPorNombre,
  crear,
  actualizar,
  desactivar,
  activar,
  existePorNombre
};
