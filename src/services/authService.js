/**
 * Servicio de Autenticación
 * Maneja login, generación de tokens JWT y renovación de tokens
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const usuariosRepository = require('../repositories/usuariosRepository');
const { ErrorValidacion, ErrorNoAutorizado } = require('../utils/errores');
const jwtConfig = require('../config/jwt');

/**
 * Generar Access Token
 * Token de corta duración para autenticar requests
 * @param {Object} payload - { id_usuario, nombre, id_rol, rol_nombre }
 * @returns {string} Access token
 */
const generarAccessToken = (payload) => {
  return jwt.sign(
    {
      id_usuario: payload.id_usuario,
      nombre: payload.nombre,
      id_rol: payload.id_rol,
      rol_nombre: payload.rol_nombre,
      tipo: 'access'
    },
    jwtConfig.accessToken.secret,
    {
      expiresIn: jwtConfig.accessToken.expiresIn,
      ...jwtConfig.signOptions
    }
  );
};

/**
 * Generar Refresh Token
 * Token de larga duración para renovar access tokens
 * @param {Object} payload - { id_usuario }
 * @returns {string} Refresh token
 */
const generarRefreshToken = (payload) => {
  return jwt.sign(
    {
      id_usuario: payload.id_usuario,
      tipo: 'refresh'
    },
    jwtConfig.refreshToken.secret,
    {
      expiresIn: jwtConfig.refreshToken.expiresIn,
      ...jwtConfig.signOptions
    }
  );
};

/**
 * Verificar Access Token
 * @param {string} token - Access token a verificar
 * @returns {Object} Payload decodificado
 */
const verificarAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, jwtConfig.accessToken.secret, {
      ...jwtConfig.verifyOptions
    });

    if (decoded.tipo !== 'access') {
      throw new ErrorNoAutorizado('Token inválido');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ErrorNoAutorizado('Token expirado');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new ErrorNoAutorizado('Token inválido');
    }
    throw error;
  }
};

/**
 * Verificar Refresh Token
 * @param {string} token - Refresh token a verificar
 * @returns {Object} Payload decodificado
 */
const verificarRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, jwtConfig.refreshToken.secret, {
      ...jwtConfig.verifyOptions
    });

    if (decoded.tipo !== 'refresh') {
      throw new ErrorNoAutorizado('Token inválido');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ErrorNoAutorizado('Refresh token expirado. Por favor, inicie sesión nuevamente');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new ErrorNoAutorizado('Refresh token inválido');
    }
    throw error;
  }
};

/**
 * Login de usuario
 * Verifica credenciales y genera tokens
 * @param {Object} credenciales - { nombre, password }
 * @returns {Promise<Object>} { usuario, accessToken, refreshToken }
 */
const login = async ({ nombre, password }) => {
  // Validar entrada
  if (!nombre || !password) {
    throw new ErrorValidacion('Nombre y contraseña son requeridos');
  }

  // Buscar usuario por nombre (incluye password y rol)
  const usuario = await usuariosRepository.obtenerPorNombre(nombre);

  if (!usuario) {
    throw new ErrorNoAutorizado('Credenciales inválidas');
  }

  // Verificar que el usuario esté activo
  if (!usuario.estado) {
    throw new ErrorNoAutorizado('Usuario inactivo. Contacte al administrador');
  }

  // Verificar contraseña
  const passwordValida = await bcrypt.compare(password, usuario.password);

  if (!passwordValida) {
    throw new ErrorNoAutorizado('Credenciales inválidas');
  }

  // Preparar payload para tokens
  const payload = {
    id_usuario: usuario.id_usuario,
    nombre: usuario.nombre,
    id_rol: usuario.id_rol,
    rol_nombre: usuario.rol.nombre
  };

  // Generar tokens
  const accessToken = generarAccessToken(payload);
  const refreshToken = generarRefreshToken({ id_usuario: usuario.id_usuario });

  // Retornar datos del usuario (sin password) y tokens
  return {
    usuario: {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      id_rol: usuario.id_rol,
      rol: {
        id_rol: usuario.rol.id_rol,
        nombre: usuario.rol.nombre
      },
      estado: usuario.estado,
      fecha_creacion: usuario.fecha_creacion
    },
    accessToken,
    refreshToken
  };
};

/**
 * Renovar Access Token usando Refresh Token
 * @param {string} refreshToken - Refresh token válido
 * @returns {Promise<Object>} { accessToken, refreshToken }
 */
const renovarToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new ErrorValidacion('Refresh token requerido');
  }

  // Verificar refresh token
  const decoded = verificarRefreshToken(refreshToken);

  // Obtener datos actualizados del usuario
  const usuario = await usuariosRepository.obtenerPorId(decoded.id_usuario);

  // Verificar que el usuario siga activo
  if (!usuario.estado) {
    throw new ErrorNoAutorizado('Usuario inactivo. Contacte al administrador');
  }

  // Generar nuevo access token con datos actualizados
  const payload = {
    id_usuario: usuario.id_usuario,
    nombre: usuario.nombre,
    id_rol: usuario.id_rol,
    rol_nombre: usuario.rol.nombre
  };

  const nuevoAccessToken = generarAccessToken(payload);
  
  // Generar nuevo refresh token (rotación de tokens - mejor seguridad)
  const nuevoRefreshToken = generarRefreshToken({ id_usuario: usuario.id_usuario });

  return {
    accessToken: nuevoAccessToken,
    refreshToken: nuevoRefreshToken
  };
};

/**
 * Logout (invalidar tokens)
 * Nota: En esta implementación, el cliente debe eliminar los tokens.
 * Para mayor seguridad, se podría implementar una lista negra de tokens en Redis o BD.
 * @returns {Object} Mensaje de confirmación
 */
const logout = () => {
  // En una implementación con lista negra, aquí se agregarían los tokens a la blacklist
  return {
    mensaje: 'Sesión cerrada exitosamente. Por favor, elimine los tokens del cliente.'
  };
};

module.exports = {
  login,
  renovarToken,
  logout,
  generarAccessToken,
  generarRefreshToken,
  verificarAccessToken,
  verificarRefreshToken
};
