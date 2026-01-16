/**
 * Middleware de Autenticación - Verificar Token JWT
 * Valida que el usuario esté autenticado mediante Access Token
 */

const authService = require('../services/authService');
const { ErrorNoAutorizado } = require('../utils/errores');

/**
 * Middleware para verificar que el usuario esté autenticado
 * Verifica el Access Token en el header Authorization
 * Agrega los datos del usuario decodificados a req.usuario
 */
const verificarToken = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new ErrorNoAutorizado('No se proporcionó token de autenticación');
    }

    // Verificar formato: "Bearer <token>"
    const partes = authHeader.split(' ');

    if (partes.length !== 2 || partes[0] !== 'Bearer') {
      throw new ErrorNoAutorizado('Formato de token inválido. Use: Bearer <token>');
    }

    const token = partes[1];

    // Verificar y decodificar token
    const decoded = authService.verificarAccessToken(token);

    // Agregar datos del usuario a la request para uso posterior
    req.usuario = {
      id_usuario: decoded.id_usuario,
      nombre: decoded.nombre,
      id_rol: decoded.id_rol,
      rol_nombre: decoded.rol_nombre
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = verificarToken;
