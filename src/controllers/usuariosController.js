/**
 * Controlador de Usuarios
 * Maneja las peticiones HTTP relacionadas con usuarios
 */

const usuariosService = require('../services/usuariosService');
const rolesRepository = require('../repositories/rolesRepository');
const { exito, creado, actualizado, eliminado } = require('../utils/respuestas');

/**
 * Obtener todos los usuarios
 * GET /api/usuarios
 */
const obtenerTodos = async (req, res, next) => {
  try {
    const usuarios = await usuariosService.obtenerTodos();
    exito({ res, datos: usuarios, mensaje: 'Usuarios obtenidos exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener usuario por ID
 * GET /api/usuarios/:id
 */
const obtenerPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario = await usuariosService.obtenerPorId(id);
    exito({ res, datos: usuario, mensaje: 'Usuario obtenido exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear nuevo usuario
 * POST /api/usuarios
 * Body: { nombre, password, id_rol }
 */
const crear = async (req, res, next) => {
  try {
    const { nombre, password, id_rol } = req.body;
    const usuario = await usuariosService.crear({ nombre, password, id_rol });
    creado({ res, datos: usuario, mensaje: 'Usuario creado exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar usuario
 * PUT /api/usuarios/:id
 * Body: { nombre?, id_rol? }
 */
const actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, id_rol } = req.body;
    const usuario = await usuariosService.actualizar(id, { nombre, id_rol });
    actualizado({ res, datos: usuario, mensaje: 'Usuario actualizado exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar contraseña
 * PATCH /api/usuarios/:id/password
 * Body: { password }
 */
const actualizarPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const usuario = await usuariosService.actualizarPassword(id, password);
    actualizado({ res, datos: usuario, mensaje: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar usuario (soft delete)
 * DELETE /api/usuarios/:id
 */
const eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario = await usuariosService.eliminar(id);
    eliminado({ res, datos: usuario, mensaje: 'Usuario desactivado exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Activar usuario
 * PATCH /api/usuarios/:id/activar
 */
const activar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario = await usuariosService.activar(id);
    actualizado({ res, datos: usuario, mensaje: 'Usuario activado exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener usuarios por rol
 * GET /api/usuarios/rol/:idRol
 */
const obtenerPorRol = async (req, res, next) => {
  try {
    const { idRol } = req.params;
    const usuarios = await usuariosService.obtenerPorRol(idRol);
    exito({ res, datos: usuarios, mensaje: 'Usuarios obtenidos exitosamente' });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener todos los roles disponibles
 * GET /api/usuarios/roles
 */
const obtenerRoles = async (req, res, next) => {
  try {
    const roles = await rolesRepository.obtenerTodos();
    exito({ res, datos: roles, mensaje: 'Roles obtenidos exitosamente' });
  } catch (error) {
    next(error);
  }
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
  obtenerRoles
};
