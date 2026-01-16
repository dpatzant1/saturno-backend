/**
 * Repository de Usuarios
 * Maneja todas las operaciones de base de datos relacionadas con usuarios
 */

const { supabase } = require('../config/database');
const { ErrorBaseDatos, ErrorNoEncontrado } = require('../utils/errores');

/**
 * Obtener todos los usuarios con información de rol
 * @returns {Promise<Array>} Lista de usuarios (sin password)
 */
const obtenerTodos = async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        id_usuario,
        id_rol,
        nombre,
        estado,
        fecha_creacion,
        roles!id_rol (
          id_rol,
          nombre
        )
      `)
      .order('fecha_creacion', { ascending: false });

    if (error) {
      console.error('Error al obtener usuarios:', error);
      throw new ErrorBaseDatos('Error al obtener usuarios', error);
    }

    // Procesar datos para aplanar la estructura del rol
    const usuariosProcesados = (data || []).map(usuario => {
      const { roles, ...usuarioSinRoles } = usuario;
      return {
        ...usuarioSinRoles,
        rol: roles || null
      };
    });

    return usuariosProcesados;
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al obtener usuarios', error);
  }
};

/**
 * Obtener usuario por ID (sin password)
 * @param {string} idUsuario - UUID del usuario
 * @returns {Promise<Object>} Datos del usuario
 */
const obtenerPorId = async (idUsuario) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        id_usuario,
        id_rol,
        nombre,
        estado,
        fecha_creacion,
        roles!id_rol (
          id_rol,
          nombre
        )
      `)
      .eq('id_usuario', idUsuario)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ErrorNoEncontrado('Usuario no encontrado');
      }
      throw new ErrorBaseDatos('Error al obtener usuario', error);
    }

    // Procesar datos para aplanar la estructura del rol
    const { roles, ...usuarioSinRoles } = data;
    const usuarioProcesado = {
      ...usuarioSinRoles,
      rol: roles || null
    };

    return usuarioProcesado;
  } catch (error) {
    if (error instanceof ErrorNoEncontrado || error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al obtener usuario', error);
  }
};

/**
 * Obtener usuario por nombre (incluye password - solo para login)
 * @param {string} nombre - Nombre del usuario
 * @returns {Promise<Object|null>} Datos del usuario con password o null
 */
const obtenerPorNombre = async (nombre) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        id_usuario,
        id_rol,
        nombre,
        password,
        estado,
        fecha_creacion,
        roles!id_rol (
          id_rol,
          nombre
        )
      `)
      .eq('nombre', nombre)
      .eq('estado', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new ErrorBaseDatos('Error al buscar usuario por nombre', error);
    }

    // Procesar datos para aplanar la estructura del rol
    const { roles, ...usuarioSinRoles } = data;
    const usuarioProcesado = {
      ...usuarioSinRoles,
      rol: roles || null
    };

    return usuarioProcesado;
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al buscar usuario por nombre', error);
  }
};

/**
 * Crear un nuevo usuario
 * @param {Object} datosUsuario - { id_rol, nombre, password }
 * @returns {Promise<Object>} Usuario creado (sin password)
 */
const crear = async (datosUsuario) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([datosUsuario])
      .select(`
        id_usuario,
        id_rol,
        nombre,
        estado,
        fecha_creacion,
        roles (
          id_rol,
          nombre
        )
      `)
      .single();

    if (error) {
      throw new ErrorBaseDatos('Error al crear usuario', error);
    }

    // Procesar datos para aplanar la estructura del rol
    const { roles, ...usuarioSinRoles } = data;
    const usuarioProcesado = {
      ...usuarioSinRoles,
      rol: roles || null
    };

    return usuarioProcesado;
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al crear usuario', error);
  }
};

/**
 * Actualizar usuario (nombre y/o rol)
 * @param {string} idUsuario - UUID del usuario
 * @param {Object} datosActualizar - { nombre?, id_rol? }
 * @returns {Promise<Object>} Usuario actualizado (sin password)
 */
const actualizar = async (idUsuario, datosActualizar) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .update(datosActualizar)
      .eq('id_usuario', idUsuario)
      .select(`
        id_usuario,
        id_rol,
        nombre,
        estado,
        fecha_creacion,
        roles (
          id_rol,
          nombre
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ErrorNoEncontrado('Usuario no encontrado');
      }
      throw new ErrorBaseDatos('Error al actualizar usuario', error);
    }

    // Procesar datos para aplanar la estructura del rol
    const { roles, ...usuarioSinRoles } = data;
    const usuarioProcesado = {
      ...usuarioSinRoles,
      rol: roles || null
    };

    return usuarioProcesado;
  } catch (error) {
    if (error instanceof ErrorNoEncontrado || error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al actualizar usuario', error);
  }
};

/**
 * Actualizar contraseña de usuario
 * @param {string} idUsuario - UUID del usuario
 * @param {string} passwordHash - Contraseña hasheada
 * @returns {Promise<Object>} Usuario actualizado (sin password)
 */
const actualizarPassword = async (idUsuario, passwordHash) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ password: passwordHash })
      .eq('id_usuario', idUsuario)
      .select(`
        id_usuario,
        id_rol,
        nombre,
        estado,
        fecha_creacion
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ErrorNoEncontrado('Usuario no encontrado');
      }
      throw new ErrorBaseDatos('Error al actualizar contraseña', error);
    }

    return data;
  } catch (error) {
    if (error instanceof ErrorNoEncontrado || error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al actualizar contraseña', error);
  }
};

/**
 * Cambiar estado del usuario (activar/desactivar - soft delete)
 * @param {string} idUsuario - UUID del usuario
 * @param {boolean} estado - true = activo, false = inactivo
 * @returns {Promise<Object>} Usuario actualizado
 */
const cambiarEstado = async (idUsuario, estado) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ estado })
      .eq('id_usuario', idUsuario)
      .select(`
        id_usuario,
        id_rol,
        nombre,
        estado,
        fecha_creacion
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ErrorNoEncontrado('Usuario no encontrado');
      }
      throw new ErrorBaseDatos('Error al cambiar estado del usuario', error);
    }

    return data;
  } catch (error) {
    if (error instanceof ErrorNoEncontrado || error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al cambiar estado del usuario', error);
  }
};

/**
 * Verificar si existe un usuario con el nombre dado
 * @param {string} nombre - Nombre del usuario
 * @param {string} [idUsuarioExcluir] - UUID del usuario a excluir de la búsqueda (para updates)
 * @returns {Promise<boolean>} true si existe, false si no
 */
const existePorNombre = async (nombre, idUsuarioExcluir = null) => {
  try {
    let query = supabase
      .from('usuarios')
      .select('id_usuario', { count: 'exact', head: true })
      .eq('nombre', nombre);

    if (idUsuarioExcluir) {
      query = query.neq('id_usuario', idUsuarioExcluir);
    }

    const { count, error } = await query;

    if (error) {
      throw new ErrorBaseDatos('Error al verificar existencia de usuario', error);
    }

    return count > 0;
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al verificar existencia de usuario', error);
  }
};

/**
 * Obtener usuarios por rol
 * @param {string} idRol - UUID del rol
 * @returns {Promise<Array>} Lista de usuarios del rol
 */
const obtenerPorRol = async (idRol) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        id_usuario,
        id_rol,
        nombre,
        estado,
        fecha_creacion,
        roles (
          id_rol,
          nombre
        )
      `)
      .eq('id_rol', idRol)
      .eq('estado', true)
      .order('nombre', { ascending: true });

    if (error) {
      throw new ErrorBaseDatos('Error al obtener usuarios por rol', error);
    }

    // Procesar datos para aplanar la estructura del rol
    const usuariosProcesados = (data || []).map(usuario => {
      const { roles, ...usuarioSinRoles } = usuario;
      return {
        ...usuarioSinRoles,
        rol: roles || null
      };
    });

    return usuariosProcesados;
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al obtener usuarios por rol', error);
  }
};

module.exports = {
  obtenerTodos,
  obtenerPorId,
  obtenerPorNombre,
  crear,
  actualizar,
  actualizarPassword,
  cambiarEstado,
  existePorNombre,
  obtenerPorRol
};
