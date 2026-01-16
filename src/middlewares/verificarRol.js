/**
 * Middleware de Autorización - Verificar Roles
 * Valida que el usuario tenga los permisos necesarios según su rol
 */

const { ErrorProhibido } = require('../utils/errores');

/**
 * Middleware para verificar que el usuario tenga uno de los roles permitidos
 * Debe usarse después del middleware verificarToken
 * @param {...string} rolesPermitidos - Lista de roles que tienen acceso
 * @returns {Function} Middleware de Express
 * 
 * @example
 * // Solo ADMINISTRADOR
 * router.delete('/usuarios/:id', verificarToken, verificarRol('ADMINISTRADOR'), usuariosController.eliminar);
 * 
 * // ADMINISTRADOR o VENDEDOR
 * router.get('/productos', verificarToken, verificarRol('ADMINISTRADOR', 'VENDEDOR'), productosController.obtenerTodos);
 */
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    try {
      // Verificar que existe req.usuario (debe pasar primero por verificarToken)
      if (!req.usuario || !req.usuario.rol_nombre) {
        throw new ErrorProhibido('No se pudo verificar el rol del usuario');
      }

      const rolUsuario = req.usuario.rol_nombre;

      // Verificar si el rol del usuario está en la lista de roles permitidos
      if (!rolesPermitidos.includes(rolUsuario)) {
        throw new ErrorProhibido(
          `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware específico: Solo ADMINISTRADOR
 */
const soloAdministrador = verificarRol('ADMINISTRADOR');

/**
 * Middleware específico: ADMINISTRADOR o VENDEDOR
 */
const administradorOVendedor = verificarRol('ADMINISTRADOR', 'VENDEDOR');

module.exports = {
  verificarRol,
  soloAdministrador,
  administradorOVendedor
};
