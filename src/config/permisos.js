/**
 * Configuración de Permisos y Matriz de Autorización
 * Define qué roles pueden acceder a qué endpoints
 */

/**
 * Matriz de permisos por recurso y acción
 */
const PERMISOS = {
  // USUARIOS
  usuarios: {
    listar: ['ADMINISTRADOR'],
    ver: ['ADMINISTRADOR'], // VENDEDOR puede ver solo su perfil (validado en middleware)
    crear: ['ADMINISTRADOR'],
    actualizar: ['ADMINISTRADOR'], // VENDEDOR puede actualizar solo su perfil
    eliminar: ['ADMINISTRADOR'],
    cambiarPassword: ['ADMINISTRADOR']
  },

  // CATEGORÍAS
  categorias: {
    listar: ['ADMINISTRADOR', 'VENDEDOR'],
    ver: ['ADMINISTRADOR', 'VENDEDOR'],
    crear: ['ADMINISTRADOR'],
    actualizar: ['ADMINISTRADOR'],
    activar: ['ADMINISTRADOR'],
    eliminar: ['ADMINISTRADOR'], // Mover a papelera
    listarPapelera: ['ADMINISTRADOR'],
    restaurar: ['ADMINISTRADOR'],
    eliminarPermanente: ['ADMINISTRADOR']
  },

  // PRODUCTOS
  productos: {
    listar: ['ADMINISTRADOR', 'VENDEDOR'],
    ver: ['ADMINISTRADOR', 'VENDEDOR'],
    verStockBajo: ['ADMINISTRADOR', 'VENDEDOR'],
    crear: ['ADMINISTRADOR'],
    actualizar: ['ADMINISTRADOR'],
    activar: ['ADMINISTRADOR'],
    eliminar: ['ADMINISTRADOR'], // Mover a papelera
    listarPapelera: ['ADMINISTRADOR'],
    restaurar: ['ADMINISTRADOR'],
    eliminarPermanente: ['ADMINISTRADOR']
  },

  // MOVIMIENTOS DE INVENTARIO
  movimientos: {
    listar: ['ADMINISTRADOR', 'VENDEDOR'],
    ver: ['ADMINISTRADOR', 'VENDEDOR'],
    registrarEntrada: ['ADMINISTRADOR'],
    registrarSalida: ['ADMINISTRADOR'],
    ajustar: ['ADMINISTRADOR'],
    verReportes: ['ADMINISTRADOR', 'VENDEDOR'],
    verKardex: ['ADMINISTRADOR', 'VENDEDOR']
  },

  // CLIENTES
  clientes: {
    listar: ['ADMINISTRADOR', 'VENDEDOR'],
    ver: ['ADMINISTRADOR', 'VENDEDOR'],
    crear: ['ADMINISTRADOR', 'VENDEDOR'],
    actualizar: ['ADMINISTRADOR', 'VENDEDOR'],
    eliminar: ['ADMINISTRADOR'], // Mover a papelera
    listarPapelera: ['ADMINISTRADOR'],
    restaurar: ['ADMINISTRADOR'],
    eliminarPermanente: ['ADMINISTRADOR'],
    verReportes: ['ADMINISTRADOR', 'VENDEDOR']
  },

  // VENTAS
  ventas: {
    listar: ['ADMINISTRADOR', 'VENDEDOR'], // VENDEDOR ve solo sus ventas
    ver: ['ADMINISTRADOR', 'VENDEDOR'], // VENDEDOR ve solo sus ventas
    crearContado: ['ADMINISTRADOR', 'VENDEDOR'],
    crearCredito: ['ADMINISTRADOR', 'VENDEDOR'],
    anular: ['ADMINISTRADOR'], // Solo ADMIN puede anular
    verReportes: ['ADMINISTRADOR', 'VENDEDOR'] // VENDEDOR ve solo sus reportes
  },

  // CRÉDITOS
  creditos: {
    listar: ['ADMINISTRADOR', 'VENDEDOR'], // VENDEDOR ve solo créditos de sus ventas
    ver: ['ADMINISTRADOR', 'VENDEDOR'],
    crear: ['ADMINISTRADOR', 'VENDEDOR'],
    registrarPago: ['ADMINISTRADOR', 'VENDEDOR'],
    verVencidos: ['ADMINISTRADOR'],
    verDashboard: ['ADMINISTRADOR'],
    verReportes: ['ADMINISTRADOR', 'VENDEDOR']
  },

  // PAGOS
  pagos: {
    listar: ['ADMINISTRADOR', 'VENDEDOR'],
    ver: ['ADMINISTRADOR', 'VENDEDOR'],
    verHistorial: ['ADMINISTRADOR', 'VENDEDOR']
  }
};

/**
 * Verifica si un rol tiene permiso para una acción en un recurso
 * @param {string} recurso - Nombre del recurso (usuarios, productos, etc.)
 * @param {string} accion - Acción a realizar (listar, crear, etc.)
 * @param {string} rol - Rol del usuario (ADMINISTRADOR, VENDEDOR)
 * @returns {boolean} true si tiene permiso
 */
function tienePermiso(recurso, accion, rol) {
  const recursoPerm = PERMISOS[recurso];
  if (!recursoPerm) {
    return false;
  }

  const accionPerm = recursoPerm[accion];
  if (!accionPerm) {
    return false;
  }

  return accionPerm.includes(rol);
}

/**
 * Obtiene todos los permisos de un rol
 * @param {string} rol - Rol del usuario
 * @returns {Object} Objeto con recursos y acciones permitidas
 */
function obtenerPermisosPorRol(rol) {
  const permisos = {};

  for (const [recurso, acciones] of Object.entries(PERMISOS)) {
    permisos[recurso] = [];
    for (const [accion, roles] of Object.entries(acciones)) {
      if (roles.includes(rol)) {
        permisos[recurso].push(accion);
      }
    }
  }

  return permisos;
}

/**
 * Acciones que requieren auditoría obligatoria
 */
const ACCIONES_AUDITABLES = {
  // Autenticación
  LOGIN: { recurso: 'auth', accion: 'login', nivel: 'INFO' },
  LOGOUT: { recurso: 'auth', accion: 'logout', nivel: 'INFO' },
  REFRESH_TOKEN: { recurso: 'auth', accion: 'refresh', nivel: 'INFO' },
  
  // Usuarios
  CREAR_USUARIO: { recurso: 'usuarios', accion: 'crear', nivel: 'WARNING' },
  ACTUALIZAR_USUARIO: { recurso: 'usuarios', accion: 'actualizar', nivel: 'INFO' },
  ELIMINAR_USUARIO: { recurso: 'usuarios', accion: 'eliminar', nivel: 'WARNING' },
  CAMBIAR_PASSWORD: { recurso: 'usuarios', accion: 'cambiarPassword', nivel: 'WARNING' },
  
  // Productos
  CREAR_PRODUCTO: { recurso: 'productos', accion: 'crear', nivel: 'INFO' },
  ACTUALIZAR_PRODUCTO: { recurso: 'productos', accion: 'actualizar', nivel: 'INFO' },
  ELIMINAR_PRODUCTO: { recurso: 'productos', accion: 'eliminar', nivel: 'WARNING' },
  RESTAURAR_PRODUCTO: { recurso: 'productos', accion: 'restaurar', nivel: 'WARNING' },
  ELIMINAR_PERMANENTE_PRODUCTO: { recurso: 'productos', accion: 'eliminarPermanente', nivel: 'ERROR' },
  
  // Inventario
  ENTRADA_INVENTARIO: { recurso: 'movimientos', accion: 'entrada', nivel: 'WARNING' },
  SALIDA_INVENTARIO: { recurso: 'movimientos', accion: 'salida', nivel: 'WARNING' },
  AJUSTE_INVENTARIO: { recurso: 'movimientos', accion: 'ajuste', nivel: 'ERROR' },
  
  // Ventas
  CREAR_VENTA: { recurso: 'ventas', accion: 'crear', nivel: 'INFO' },
  ANULAR_VENTA: { recurso: 'ventas', accion: 'anular', nivel: 'ERROR' },
  
  // Créditos
  CREAR_CREDITO: { recurso: 'creditos', accion: 'crear', nivel: 'WARNING' },
  REGISTRAR_PAGO: { recurso: 'creditos', accion: 'pago', nivel: 'WARNING' },
  
  // Categorías
  ELIMINAR_CATEGORIA: { recurso: 'categorias', accion: 'eliminar', nivel: 'WARNING' },
  
  // Clientes
  ELIMINAR_CLIENTE: { recurso: 'clientes', accion: 'eliminar', nivel: 'WARNING' }
};

/**
 * Endpoints críticos que requieren rate limiting más estricto
 */
const ENDPOINTS_CRITICOS = {
  // Autenticación - más restrictivo
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos
    message: 'Demasiados intentos de inicio de sesión. Intente de nuevo en 15 minutos.'
  },
  
  // Creación de usuarios
  '/api/usuarios': {
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Demasiadas solicitudes de creación. Intente de nuevo más tarde.'
  },
  
  // Anulación de ventas - muy crítico
  '/api/ventas/:id/anular': {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5,
    message: 'Límite de anulaciones alcanzado. Contacte al administrador.'
  },
  
  // Ajustes de inventario - crítico
  '/api/movimientos/ajuste': {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10,
    message: 'Demasiados ajustes de inventario. Intente más tarde.'
  },
  
  // Eliminación permanente - muy crítico
  '/api/productos/:id/eliminar-permanente': {
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Límite de eliminaciones permanentes alcanzado.'
  }
};

module.exports = {
  PERMISOS,
  ACCIONES_AUDITABLES,
  ENDPOINTS_CRITICOS,
  tienePermiso,
  obtenerPermisosPorRol
};
