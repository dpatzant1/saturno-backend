/**
 * Servicio de Usuarios
 * Contiene la lógica de negocio para la gestión de usuarios
 */

const bcrypt = require('bcryptjs');
const usuariosRepository = require('../repositories/usuariosRepository');
const rolesRepository = require('../repositories/rolesRepository');
const { ErrorValidacion, ErrorNoEncontrado } = require('../utils/errores');

/**
 * Validar datos de usuario
 * @param {Object} datos - { nombre, password, id_rol }
 * @param {string} [idUsuarioExcluir] - ID a excluir en validación de duplicados
 */
const validarDatosUsuario = async (datos, idUsuarioExcluir = null) => {
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
    const existe = await usuariosRepository.existePorNombre(datos.nombre, idUsuarioExcluir);
    if (existe) {
      errores.push('Ya existe un usuario con ese nombre');
    }
  }

  // Validar rol si se proporciona
  if (datos.id_rol) {
    try {
      await rolesRepository.obtenerPorId(datos.id_rol);
    } catch (error) {
      errores.push('El rol especificado no existe');
    }
  }

  if (errores.length > 0) {
    throw new ErrorValidacion('Errores de validación', errores);
  }
};

/**
 * Validar contraseña
 * @param {string} password - Contraseña a validar
 */
const validarPassword = (password) => {
  const errores = [];

  if (!password || typeof password !== 'string') {
    errores.push('La contraseña es requerida');
  } else if (password.length < 6) {
    errores.push('La contraseña debe tener al menos 6 caracteres');
  } else if (password.length > 100) {
    errores.push('La contraseña no puede exceder los 100 caracteres');
  }

  if (errores.length > 0) {
    throw new ErrorValidacion('Errores de validación de contraseña', errores);
  }
};

/**
 * Hashear contraseña
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} Contraseña hasheada
 */
const hashearPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Obtener todos los usuarios
 * @returns {Promise<Array>} Lista de usuarios
 */
const obtenerTodos = async () => {
  return await usuariosRepository.obtenerTodos();
};

/**
 * Obtener usuario por ID
 * @param {string} idUsuario - UUID del usuario
 * @returns {Promise<Object>} Usuario encontrado
 */
const obtenerPorId = async (idUsuario) => {
  if (!idUsuario) {
    throw new ErrorValidacion('ID de usuario requerido');
  }

  return await usuariosRepository.obtenerPorId(idUsuario);
};

/**
 * Crear nuevo usuario
 * @param {Object} datosUsuario - { nombre, password, id_rol }
 * @returns {Promise<Object>} Usuario creado
 */
const crear = async (datosUsuario) => {
  // Validar datos
  await validarDatosUsuario(datosUsuario);

  // Validar que el rol exista y esté activo
  if (!datosUsuario.id_rol) {
    throw new ErrorValidacion('El rol es requerido');
  }

  const rol = await rolesRepository.obtenerPorId(datosUsuario.id_rol);
  if (!rol.estado) {
    throw new ErrorValidacion('El rol seleccionado no está activo');
  }

  // Validar contraseña
  validarPassword(datosUsuario.password);

  // Hashear contraseña
  const passwordHash = await hashearPassword(datosUsuario.password);

  // Crear usuario
  const usuario = await usuariosRepository.crear({
    nombre: datosUsuario.nombre.trim(),
    password: passwordHash,
    id_rol: datosUsuario.id_rol
  });

  return usuario;
};

/**
 * Actualizar usuario (nombre y/o rol)
 * @param {string} idUsuario - UUID del usuario
 * @param {Object} datosActualizar - { nombre?, id_rol? }
 * @returns {Promise<Object>} Usuario actualizado
 */
const actualizar = async (idUsuario, datosActualizar) => {
  if (!idUsuario) {
    throw new ErrorValidacion('ID de usuario requerido');
  }

  // Verificar que el usuario existe
  await usuariosRepository.obtenerPorId(idUsuario);

  // Validar datos a actualizar
  if (datosActualizar.nombre || datosActualizar.id_rol) {
    await validarDatosUsuario(datosActualizar, idUsuario);
  }

  // Si se actualiza el rol, validar que esté activo
  if (datosActualizar.id_rol) {
    const rol = await rolesRepository.obtenerPorId(datosActualizar.id_rol);
    if (!rol.estado) {
      throw new ErrorValidacion('El rol seleccionado no está activo');
    }
  }

  // Preparar datos a actualizar
  const datos = {};
  if (datosActualizar.nombre) {
    datos.nombre = datosActualizar.nombre.trim();
  }
  if (datosActualizar.id_rol) {
    datos.id_rol = datosActualizar.id_rol;
  }

  if (Object.keys(datos).length === 0) {
    throw new ErrorValidacion('No hay datos para actualizar');
  }

  return await usuariosRepository.actualizar(idUsuario, datos);
};

/**
 * Actualizar contraseña de usuario
 * @param {string} idUsuario - UUID del usuario
 * @param {string} nuevaPassword - Nueva contraseña en texto plano
 * @returns {Promise<Object>} Usuario actualizado
 */
const actualizarPassword = async (idUsuario, nuevaPassword) => {
  if (!idUsuario) {
    throw new ErrorValidacion('ID de usuario requerido');
  }

  // Verificar que el usuario existe
  await usuariosRepository.obtenerPorId(idUsuario);

  // Validar nueva contraseña
  validarPassword(nuevaPassword);

  // Hashear nueva contraseña
  const passwordHash = await hashearPassword(nuevaPassword);

  return await usuariosRepository.actualizarPassword(idUsuario, passwordHash);
};

/**
 * Eliminar usuario (soft delete - desactivar)
 * @param {string} idUsuario - UUID del usuario
 * @returns {Promise<Object>} Usuario desactivado
 */
const eliminar = async (idUsuario) => {
  if (!idUsuario) {
    throw new ErrorValidacion('ID de usuario requerido');
  }

  // Verificar que el usuario existe
  await usuariosRepository.obtenerPorId(idUsuario);

  return await usuariosRepository.cambiarEstado(idUsuario, false);
};

/**
 * Activar usuario
 * @param {string} idUsuario - UUID del usuario
 * @returns {Promise<Object>} Usuario activado
 */
const activar = async (idUsuario) => {
  if (!idUsuario) {
    throw new ErrorValidacion('ID de usuario requerido');
  }

  return await usuariosRepository.cambiarEstado(idUsuario, true);
};

/**
 * Obtener usuarios por rol
 * @param {string} idRol - UUID del rol
 * @returns {Promise<Array>} Lista de usuarios del rol
 */
const obtenerPorRol = async (idRol) => {
  if (!idRol) {
    throw new ErrorValidacion('ID de rol requerido');
  }

  // Verificar que el rol existe
  await rolesRepository.obtenerPorId(idRol);

  return await usuariosRepository.obtenerPorRol(idRol);
};

module.exports = {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  actualizarPassword,
  eliminar,
  activar,
  obtenerPorRol,
  hashearPassword, // Exportar para uso en autenticación
  validarPassword  // Exportar para uso en autenticación
};
