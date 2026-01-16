/**
 * Middleware de Autorización por Recurso
 * Verifica que el usuario tenga permiso para acceder a recursos específicos
 */

const { ErrorProhibido, ErrorNoEncontrado } = require('../utils/errores');

/**
 * Middleware para verificar que un VENDEDOR solo pueda acceder a su propio perfil
 * Los ADMINISTRADORES tienen acceso completo
 * 
 * @example
 * router.get('/usuarios/:id', verificarToken, soloPerfilPropio, usuariosController.obtenerPorId);
 */
const soloPerfilPropio = (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario;

    // ADMINISTRADOR puede acceder a cualquier perfil
    if (usuario.rol_nombre === 'ADMINISTRADOR') {
      return next();
    }

    // VENDEDOR solo puede acceder a su propio perfil
    if (usuario.rol_nombre === 'VENDEDOR') {
      if (usuario.id_usuario !== id) {
        throw new ErrorProhibido('Solo puedes acceder a tu propio perfil');
      }
      return next();
    }

    throw new ErrorProhibido('No tienes permisos para realizar esta acción');
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para verificar que un VENDEDOR solo pueda ver sus propias ventas
 * Los ADMINISTRADORES pueden ver todas las ventas
 * Aplica filtro automático por id_usuario si es VENDEDOR
 */
const soloVentasPropias = (req, res, next) => {
  try {
    const usuario = req.usuario;

    // ADMINISTRADOR puede ver todas las ventas
    if (usuario.rol_nombre === 'ADMINISTRADOR') {
      return next();
    }

    // VENDEDOR: agregar filtro automático por su id_usuario
    if (usuario.rol_nombre === 'VENDEDOR') {
      // Si está consultando ventas con filtros, agregar id_usuario
      req.filtroVendedor = {
        id_usuario: usuario.id_usuario
      };
      return next();
    }

    throw new ErrorProhibido('No tienes permisos para realizar esta acción');
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para verificar propiedad de una venta específica
 * VENDEDOR solo puede acceder a sus propias ventas
 * ADMINISTRADOR tiene acceso total
 * 
 * @param {Function} obtenerVentaFn - Función async que recibe id y retorna la venta
 */
const verificarPropiedadVenta = (obtenerVentaFn) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      const usuario = req.usuario;

      // ADMINISTRADOR tiene acceso total
      if (usuario.rol_nombre === 'ADMINISTRADOR') {
        return next();
      }

      // VENDEDOR: verificar que la venta le pertenezca
      if (usuario.rol_nombre === 'VENDEDOR') {
        const venta = await obtenerVentaFn(id);
        
        if (!venta) {
          throw new ErrorNoEncontrado('Venta no encontrada');
        }

        if (venta.id_usuario !== usuario.id_usuario) {
          throw new ErrorProhibido('No tienes permiso para acceder a esta venta');
        }

        return next();
      }

      throw new ErrorProhibido('No tienes permisos para realizar esta acción');
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar propiedad de un crédito
 * VENDEDOR solo puede ver créditos de ventas que hizo
 * ADMINISTRADOR tiene acceso total
 * 
 * @param {Function} obtenerCreditoFn - Función async que recibe id y retorna el crédito con venta
 */
const verificarPropiedadCredito = (obtenerCreditoFn) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      const usuario = req.usuario;

      // ADMINISTRADOR tiene acceso total
      if (usuario.rol_nombre === 'ADMINISTRADOR') {
        return next();
      }

      // VENDEDOR: verificar que el crédito corresponda a su venta
      if (usuario.rol_nombre === 'VENDEDOR') {
        const credito = await obtenerCreditoFn(id);
        
        if (!credito) {
          throw new ErrorNoEncontrado('Crédito no encontrado');
        }

        // El crédito debe tener la venta asociada para verificar propiedad
        if (credito.venta && credito.venta.id_usuario !== usuario.id_usuario) {
          throw new ErrorProhibido('No tienes permiso para acceder a este crédito');
        }

        return next();
      }

      throw new ErrorProhibido('No tienes permisos para realizar esta acción');
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para restringir consultas de reportes por usuario
 * VENDEDOR solo puede ver sus propios reportes
 * ADMINISTRADOR puede filtrar por cualquier vendedor
 */
const reportesPorVendedor = (req, res, next) => {
  try {
    const usuario = req.usuario;
    const { id_usuario: idUsuarioFiltro } = req.query;

    // ADMINISTRADOR puede consultar reportes de cualquier vendedor
    if (usuario.rol_nombre === 'ADMINISTRADOR') {
      return next();
    }

    // VENDEDOR solo puede ver sus propios reportes
    if (usuario.rol_nombre === 'VENDEDOR') {
      // Si intenta filtrar por otro usuario, denegar acceso
      if (idUsuarioFiltro && idUsuarioFiltro !== usuario.id_usuario) {
        throw new ErrorProhibido('Solo puedes consultar tus propios reportes');
      }
      
      // Forzar filtro por su propio id_usuario
      req.query.id_usuario = usuario.id_usuario;
      return next();
    }

    throw new ErrorProhibido('No tienes permisos para realizar esta acción');
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para verificar que solo ADMINISTRADOR pueda anular ventas
 * Combinado con validación de que la venta no esté ya anulada
 * 
 * @param {Function} obtenerVentaFn - Función async que recibe id y retorna la venta
 */
const soloAdminPuedeAnular = (obtenerVentaFn) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      const usuario = req.usuario;

      // Solo ADMINISTRADOR puede anular ventas
      if (usuario.rol_nombre !== 'ADMINISTRADOR') {
        throw new ErrorProhibido('Solo los administradores pueden anular ventas');
      }

      // Verificar que la venta exista y no esté anulada
      const venta = await obtenerVentaFn(id);
      
      if (!venta) {
        throw new ErrorNoEncontrado('Venta no encontrada');
      }

      if (venta.estado === 'ANULADA') {
        throw new ErrorProhibido('Esta venta ya está anulada');
      }

      return next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  soloPerfilPropio,
  soloVentasPropias,
  verificarPropiedadVenta,
  verificarPropiedadCredito,
  reportesPorVendedor,
  soloAdminPuedeAnular
};
