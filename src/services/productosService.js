/**
 * Servicio de Productos
 * Contiene la lógica de negocio para la gestión de productos
 * Incluye validaciones críticas de stock y movimientos para eliminación
 */

const productosRepository = require('../repositories/productosRepository');
const categoriasRepository = require('../repositories/categoriasRepository');
const { ErrorValidacion, ErrorConflicto } = require('../utils/errores');

/**
 * Validar datos de producto
 * @param {Object} datos - Datos del producto
 * @param {string} [idProductoExcluir] - ID a excluir en validación de duplicados
 */
const validarDatosProducto = async (datos, idProductoExcluir = null) => {
  const errores = [];

  // Validar nombre
  if (datos.nombre !== undefined) {
    if (!datos.nombre || typeof datos.nombre !== 'string') {
      errores.push('El nombre es requerido');
    } else if (datos.nombre.trim().length === 0) {
      errores.push('El nombre no puede estar vacío');
    } else if (datos.nombre.length > 150) {
      errores.push('El nombre no puede exceder los 150 caracteres');
    } else {
      // Verificar nombre único
      const existe = await productosRepository.existePorNombre(datos.nombre, idProductoExcluir);
      if (existe) {
        errores.push('Ya existe un producto con ese nombre');
      }
    }
  }

  // Validar categoría
  if (datos.id_categoria !== undefined) {
    if (!datos.id_categoria) {
      errores.push('La categoría es requerida');
    } else {
      try {
        const categoria = await categoriasRepository.obtenerPorId(datos.id_categoria);
        if (!categoria.estado) {
          errores.push('La categoría seleccionada no está activa');
        }
      } catch (error) {
        errores.push('La categoría especificada no existe');
      }
    }
  }

  // Validar precio de venta
  if (datos.precio_venta !== undefined) {
    if (datos.precio_venta === null || datos.precio_venta === undefined) {
      errores.push('El precio de venta es requerido');
    } else {
      const precio = parseFloat(datos.precio_venta);
      if (isNaN(precio) || precio < 0) {
        errores.push('El precio de venta debe ser un número positivo');
      } else if (precio > 99999999.99) {
        errores.push('El precio de venta es demasiado grande');
      }
    }
  }

  // Validar unidad de medida
  if (datos.unidad_medida !== undefined) {
    if (!datos.unidad_medida || typeof datos.unidad_medida !== 'string') {
      errores.push('La unidad de medida es requerida');
    } else if (datos.unidad_medida.length > 50) {
      errores.push('La unidad de medida no puede exceder los 50 caracteres');
    }
  }

  // Validar stock mínimo
  if (datos.stock_minimo !== undefined && datos.stock_minimo !== null) {
    const stockMin = parseInt(datos.stock_minimo);
    if (isNaN(stockMin) || stockMin < 0) {
      errores.push('El stock mínimo debe ser un número entero positivo');
    }
  }

  // Validar cantidad en stock
  if (datos.cantidad_stock !== undefined && datos.cantidad_stock !== null) {
    const cantStock = parseInt(datos.cantidad_stock);
    if (isNaN(cantStock) || cantStock < 0) {
      errores.push('La cantidad en stock debe ser un número entero positivo');
    }
  }

  // Validar descripción (opcional)
  if (datos.descripcion !== undefined && datos.descripcion !== null) {
    if (typeof datos.descripcion !== 'string') {
      errores.push('La descripción debe ser texto');
    }
  }

  if (errores.length > 0) {
    throw new ErrorValidacion('Errores de validación', errores);
  }
};

/**
 * Obtener todos los productos
 * @param {Object} filtros - Filtros de búsqueda
 * @returns {Promise<Array>} Lista de productos
 */
const obtenerTodos = async (filtros = {}) => {
  return await productosRepository.obtenerTodos(filtros);
};

/**
 * Obtener lista simple de productos activos (sin paginación)
 * Retorna solo campos esenciales para selectores
 * @returns {Promise<Array>} Lista simplificada de productos
 */
const obtenerListaSimple = async () => {
  return await productosRepository.obtenerListaSimple();
};

/**
 * Obtener productos en papelera
 * @returns {Promise<Array>} Lista de productos eliminados
 */
const obtenerPapelera = async () => {
  return await productosRepository.obtenerPapelera();
};

/**
 * Obtener productos con stock bajo
 * @returns {Promise<Array>} Productos con stock bajo o agotado
 */
const obtenerStockBajo = async () => {
  return await productosRepository.obtenerStockBajo();
};

/**
 * Obtener producto por ID
 * @param {string} idProducto - UUID del producto
 * @returns {Promise<Object>} Producto encontrado
 */
const obtenerPorId = async (idProducto) => {
  if (!idProducto) {
    throw new ErrorValidacion('ID de producto requerido');
  }

  return await productosRepository.obtenerPorId(idProducto);
};

/**
 * Crear nuevo producto
 * @param {Object} datosProducto - Datos del producto
 * @returns {Promise<Object>} Producto creado
 */
const crear = async (datosProducto) => {
  // Validar todos los datos
  await validarDatosProducto(datosProducto);

  // Crear producto con cantidad_stock proporcionada o 0 por defecto
  const producto = await productosRepository.crear({
    id_categoria: datosProducto.id_categoria,
    nombre: datosProducto.nombre.trim(),
    descripcion: datosProducto.descripcion?.trim() || null,
    precio_venta: parseFloat(datosProducto.precio_venta),
    unidad_medida: datosProducto.unidad_medida.trim(),
    stock_minimo: parseInt(datosProducto.stock_minimo || 0),
    cantidad_stock: parseInt(datosProducto.cantidad_stock || 0)
  });

  return producto;
};

/**
 * Actualizar producto
 * @param {string} idProducto - UUID del producto
 * @param {Object} datosActualizar - Datos a actualizar
 * @returns {Promise<Object>} Producto actualizado
 */
const actualizar = async (idProducto, datosActualizar) => {
  if (!idProducto) {
    throw new ErrorValidacion('ID de producto requerido');
  }

  // Verificar que el producto existe
  await productosRepository.obtenerPorId(idProducto);

  // Validar datos a actualizar
  await validarDatosProducto(datosActualizar, idProducto);

  // Preparar datos (NO permitir actualizar cantidad_stock directamente)
  const datos = {};
  
  if (datosActualizar.id_categoria) {
    datos.id_categoria = datosActualizar.id_categoria;
  }
  if (datosActualizar.nombre) {
    datos.nombre = datosActualizar.nombre.trim();
  }
  if (datosActualizar.descripcion !== undefined) {
    datos.descripcion = datosActualizar.descripcion?.trim() || null;
  }
  if (datosActualizar.precio_venta !== undefined) {
    datos.precio_venta = parseFloat(datosActualizar.precio_venta);
  }
  if (datosActualizar.unidad_medida) {
    datos.unidad_medida = datosActualizar.unidad_medida.trim();
  }
  if (datosActualizar.stock_minimo !== undefined) {
    datos.stock_minimo = parseInt(datosActualizar.stock_minimo || 0);
  }

  // Permitir actualizar cantidad_stock
  if (datosActualizar.cantidad_stock !== undefined) {
    datos.cantidad_stock = parseInt(datosActualizar.cantidad_stock || 0);
  }

  if (Object.keys(datos).length === 0) {
    throw new ErrorValidacion('No hay datos para actualizar');
  }

  return await productosRepository.actualizar(idProducto, datos);
};

/**
 * Mover producto a papelera (soft delete)
 * Similar a WooCommerce: permite eliminar productos independientemente del stock o categoría
 * El producto se marca como eliminado pero mantiene todas sus relaciones e historial
 * 
 * @param {string} idProducto - UUID del producto
 * @returns {Promise<Object>} Producto movido a papelera
 */
const moverPapelera = async (idProducto) => {
  if (!idProducto) {
    throw new ErrorValidacion('ID de producto requerido');
  }

  // Verificar que el producto existe
  const producto = await productosRepository.obtenerPorId(idProducto);

  // Mover a papelera sin restricciones de stock o movimientos
  // El soft delete preserva el historial y permite restauración
  return await productosRepository.moverPapelera(idProducto);
};

/**
 * Restaurar producto desde papelera
 * @param {string} idProducto - UUID del producto
 * @returns {Promise<Object>} Producto restaurado
 */
const restaurarDePapelera = async (idProducto) => {
  if (!idProducto) {
    throw new ErrorValidacion('ID de producto requerido');
  }

  // Verificar que no exista otro producto activo con el mismo nombre
  const productoEliminado = await productosRepository.obtenerPorId(idProducto, true);
  
  const existe = await productosRepository.existePorNombre(productoEliminado.nombre);
  if (existe) {
    throw new ErrorConflicto(
      'Ya existe un producto activo con ese nombre. Cambie el nombre antes de restaurar'
    );
  }

  return await productosRepository.restaurarDePapelera(idProducto);
};

/**
 * Eliminar producto permanentemente (hard delete)
 * VALIDACIÓN CRÍTICA: No permitir si tiene movimientos (historial)
 * 
 * @param {string} idProducto - UUID del producto
 * @returns {Promise<void>}
 */
const eliminarPermanentemente = async (idProducto) => {
  if (!idProducto) {
    throw new ErrorValidacion('ID de producto requerido');
  }

  // Verificar que el producto existe (incluso en papelera)
  const producto = await productosRepository.obtenerPorId(idProducto, true);

  // VALIDACIÓN: No permitir eliminar si tiene movimientos (afecta auditoría)
  const tieneMovimientos = await productosRepository.tieneMovimientos(idProducto);
  if (tieneMovimientos) {
    throw new ErrorConflicto(
      'No se puede eliminar permanentemente el producto porque tiene movimientos de inventario registrados. ' +
      'Esto afectaría la integridad del historial y la auditoría del sistema'
    );
  }

  // VALIDACIÓN: No debe tener stock
  if (producto.cantidad_stock > 0) {
    throw new ErrorConflicto(
      `No se puede eliminar permanentemente el producto porque tiene stock (${producto.cantidad_stock})`
    );
  }

  await productosRepository.eliminarPermanentemente(idProducto);
};

/**
 * Activar producto
 * @param {string} idProducto - UUID del producto
 * @returns {Promise<Object>} Producto activado
 */
const activar = async (idProducto) => {
  if (!idProducto) {
    throw new ErrorValidacion('ID de producto requerido');
  }

  return await productosRepository.cambiarEstado(idProducto, true);
};

/**
 * Desactivar producto
 * @param {string} idProducto - UUID del producto
 * @returns {Promise<Object>} Producto desactivado
 */
const desactivar = async (idProducto) => {
  if (!idProducto) {
    throw new ErrorValidacion('ID de producto requerido');
  }

  return await productosRepository.cambiarEstado(idProducto, false);
};

module.exports = {
  obtenerTodos,
  obtenerListaSimple,
  obtenerPapelera,
  obtenerStockBajo,
  obtenerPorId,
  crear,
  actualizar,
  moverPapelera,
  restaurarDePapelera,
  eliminarPermanentemente,
  activar,
  desactivar
};
