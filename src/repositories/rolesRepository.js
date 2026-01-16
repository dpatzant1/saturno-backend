/**
 * Repository de Roles
 * Maneja todas las operaciones de acceso a datos de la tabla 'roles'
 */

const { supabase } = require('../config/database');
const { ErrorBaseDatos, lanzarSiNoExiste } = require('../utils/errores');

/**
 * Obtener todos los roles activos
 * @returns {Promise<Array>} Lista de roles
 */
const obtenerTodos = async () => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('estado', true)
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener roles:', error);
    throw new ErrorBaseDatos('Error al obtener los roles');
  }
};

/**
 * Obtener un rol por ID
 * @param {String} idRol - UUID del rol
 * @returns {Promise<Object>} Rol encontrado
 */
const obtenerPorId = async (idRol) => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id_rol', idRol)
      .eq('estado', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener rol por ID:', error);
    throw new ErrorBaseDatos('Error al obtener el rol');
  }
};

/**
 * Obtener un rol por nombre
 * @param {String} nombre - Nombre del rol
 * @returns {Promise<Object>} Rol encontrado
 */
const obtenerPorNombre = async (nombre) => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .ilike('nombre', nombre)
      .eq('estado', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener rol por nombre:', error);
    throw new ErrorBaseDatos('Error al obtener el rol');
  }
};

/**
 * Crear un nuevo rol
 * @param {Object} datosRol - { nombre, descripcion }
 * @returns {Promise<Object>} Rol creado
 */
const crear = async (datosRol) => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .insert({
        nombre: datosRol.nombre,
        descripcion: datosRol.descripcion || null,
        estado: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al crear rol:', error);
    
    // Error de duplicado (nombre único)
    if (error.code === '23505') {
      throw new ErrorBaseDatos('Ya existe un rol con ese nombre');
    }
    
    throw new ErrorBaseDatos('Error al crear el rol');
  }
};

/**
 * Actualizar un rol existente
 * @param {String} idRol - UUID del rol
 * @param {Object} datosRol - Datos a actualizar
 * @returns {Promise<Object>} Rol actualizado
 */
const actualizar = async (idRol, datosRol) => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .update({
        ...(datosRol.nombre && { nombre: datosRol.nombre }),
        ...(datosRol.descripcion !== undefined && { descripcion: datosRol.descripcion })
      })
      .eq('id_rol', idRol)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    
    if (error.code === '23505') {
      throw new ErrorBaseDatos('Ya existe un rol con ese nombre');
    }
    
    throw new ErrorBaseDatos('Error al actualizar el rol');
  }
};

/**
 * Cambiar estado de un rol (activar/desactivar)
 * @param {String} idRol - UUID del rol
 * @param {Boolean} estado - true para activar, false para desactivar
 * @returns {Promise<Object>} Rol actualizado
 */
const cambiarEstado = async (idRol, estado) => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .update({ estado })
      .eq('id_rol', idRol)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al cambiar estado del rol:', error);
    throw new ErrorBaseDatos('Error al cambiar el estado del rol');
  }
};

/**
 * Verificar si existe un rol por nombre
 * @param {String} nombre - Nombre del rol
 * @returns {Promise<Boolean>} true si existe, false si no
 */
const existePorNombre = async (nombre) => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('id_rol')
      .ilike('nombre', nombre)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Error al verificar existencia de rol:', error);
    throw new ErrorBaseDatos('Error al verificar el rol');
  }
};

module.exports = {
  obtenerTodos,
  obtenerPorId,
  obtenerPorNombre,
  crear,
  actualizar,
  cambiarEstado,
  existePorNombre
};
