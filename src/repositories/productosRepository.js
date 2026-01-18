/**
 * Repository de Productos
 * Maneja todas las operaciones de base de datos relacionadas con productos
 * Incluye sistema de papelera con deleted_at y validaciones de stock
 */

const { supabase } = require('../config/database');
const { ErrorBaseDatos, ErrorNoEncontrado } = require('../utils/errores');

/**
 * Obtener todos los productos activos (no en papelera)
 * @param {Object} filtros - { busqueda?, id_categoria?, stock_minimo?, soloActivos?, page?, limit? }
 * @returns {Promise<Object>} Objeto con datos paginados y metadatos
 */
const obtenerTodos = async (filtros = {}) => {
  try {
    const page = parseInt(filtros.page) || 1;
    const limit = parseInt(filtros.limit) || 10;
    const offset = (page - 1) * limit;

    // Query para contar total de registros
    let countQuery = supabase
      .from('productos')
      .select('id_producto', { count: 'exact', head: true })
      .is('deleted_at', null);

    // Query para obtener datos
    let query = supabase
      .from('productos')
      .select(`
        *,
        categorias (
          id_categoria,
          nombre,
          descripcion
        )
      `)
      .is('deleted_at', null);

    // Aplicar filtros a ambas queries
    // Filtrar solo activos
    if (filtros.soloActivos !== false) {
      query = query.eq('estado', true);
      countQuery = countQuery.eq('estado', true);
    }

    // Filtrar por categoría
    if (filtros.id_categoria) {
      query = query.eq('id_categoria', filtros.id_categoria);
      countQuery = countQuery.eq('id_categoria', filtros.id_categoria);
    }

    // Búsqueda por nombre o descripción
    if (filtros.busqueda) {
      const searchPattern = `nombre.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%`;
      query = query.or(searchPattern);
      countQuery = countQuery.or(searchPattern);
    }

    // Filtrar productos con stock bajo (menor o igual al stock mínimo)
    if (filtros.stock_minimo === true) {
      query = query.filter('cantidad_stock', 'lte', 'stock_minimo');
      countQuery = countQuery.filter('cantidad_stock', 'lte', 'stock_minimo');
    }

    // Ordenar y paginar
    query = query
      .order('nombre', { ascending: true })
      .range(offset, offset + limit - 1);

    // Ejecutar ambas queries
    const [{ data, error }, { count, error: countError }] = await Promise.all([
      query,
      countQuery
    ]);

    if (error) {
      throw new ErrorBaseDatos('Error al obtener productos', error);
    }

    if (countError) {
      throw new ErrorBaseDatos('Error al contar productos', countError);
    }

    const totalPages = Math.ceil(count / limit);

    return {
      datos: data || [],
      paginacion: {
        page,
        limit,
        total: count,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al obtener productos', error);
  }
};

/**
 * Obtener productos en papelera
 * @returns {Promise<Array>} Lista de productos eliminados (soft delete)
 */
const obtenerPapelera = async () => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        categorias (
          id_categoria,
          nombre
        )
      `)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (error) {
      throw new ErrorBaseDatos('Error al obtener papelera de productos', error);
    }

    return data || [];
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al obtener papelera de productos', error);
  }
};

/**
 * Obtener lista simple de productos activos (sin paginación)
 * Retorna solo campos esenciales para selectores/dropdowns
 * @returns {Promise<Array>} Lista simplificada de productos
 */
const obtenerListaSimple = async () => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        id_producto, 
        nombre, 
        descripcion,
        precio_venta, 
        cantidad_stock, 
        stock_minimo,
        unidad_medida,
        categorias (
          id_categoria,
          nombre
        )
      `)
      .is('deleted_at', null)
      .eq('estado', true)
      .order('nombre', { ascending: true });

    if (error) {
      throw new ErrorBaseDatos('Error al obtener lista de productos', error);
    }

    return data || [];
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al obtener lista de productos', error);
  }
};

/**
 * Obtener productos con stock bajo o agotado
 * @returns {Promise<Array>} Productos donde cantidad_stock <= stock_minimo
 */
const obtenerStockBajo = async () => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        categorias (
          id_categoria,
          nombre
        )
      `)
      .is('deleted_at', null)
      .eq('estado', true)
      .filter('cantidad_stock', 'lte', 'stock_minimo')
      .order('cantidad_stock', { ascending: true });

    if (error) {
      throw new ErrorBaseDatos('Error al obtener productos con stock bajo', error);
    }

    return data || [];
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al obtener productos con stock bajo', error);
  }
};

/**
 * Obtener producto por ID
 * @param {string} idProducto - UUID del producto
 * @param {boolean} incluirEliminados - Si incluir productos en papelera
 * @returns {Promise<Object>} Producto encontrado con información de categoría
 */
const obtenerPorId = async (idProducto, incluirEliminados = false) => {
  try {
    let query = supabase
      .from('productos')
      .select(`
        *,
        categorias (
          id_categoria,
          nombre,
          descripcion
        )
      `)
      .eq('id_producto', idProducto);

    if (!incluirEliminados) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ErrorNoEncontrado('Producto no encontrado');
      }
      throw new ErrorBaseDatos('Error al obtener producto', error);
    }

    return data;
  } catch (error) {
    if (error instanceof ErrorNoEncontrado || error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al obtener producto', error);
  }
};

/**
 * Verificar si existe un producto con el nombre dado
 * @param {string} nombre - Nombre del producto
 * @param {string} [idProductoExcluir] - ID de producto a excluir (para updates)
 * @returns {Promise<boolean>} true si existe, false si no
 */
const existePorNombre = async (nombre, idProductoExcluir = null) => {
  try {
    let query = supabase
      .from('productos')
      .select('id_producto', { count: 'exact', head: true })
      .ilike('nombre', nombre)
      .is('deleted_at', null);

    if (idProductoExcluir) {
      query = query.neq('id_producto', idProductoExcluir);
    }

    const { count, error } = await query;

    if (error) {
      throw new ErrorBaseDatos('Error al verificar existencia de producto', error);
    }

    return count > 0;
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al verificar existencia de producto', error);
  }
};

/**
 * Crear nuevo producto
 * @param {Object} datosProducto - { id_categoria, nombre, descripcion?, precio_venta, unidad_medida, stock_minimo? }
 * @returns {Promise<Object>} Producto creado con información de categoría
 */
const crear = async (datosProducto) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .insert([datosProducto])
      .select(`
        *,
        categorias (
          id_categoria,
          nombre,
          descripcion
        )
      `)
      .single();

    if (error) {
      throw new ErrorBaseDatos('Error al crear producto', error);
    }

    return data;
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al crear producto', error);
  }
};

/**
 * Actualizar producto
 * @param {string} idProducto - UUID del producto
 * @param {Object} datosActualizar - Datos a actualizar
 * @returns {Promise<Object>} Producto actualizado
 */
const actualizar = async (idProducto, datosActualizar) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .update(datosActualizar)
      .eq('id_producto', idProducto)
      .is('deleted_at', null)
      .select(`
        *,
        categorias (
          id_categoria,
          nombre,
          descripcion
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ErrorNoEncontrado('Producto no encontrado');
      }
      throw new ErrorBaseDatos('Error al actualizar producto', error);
    }

    return data;
  } catch (error) {
    if (error instanceof ErrorNoEncontrado || error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al actualizar producto', error);
  }
};

/**
 * Cambiar estado del producto (activar/desactivar)
 * @param {string} idProducto - UUID del producto
 * @param {boolean} estado - true = activo, false = inactivo
 * @returns {Promise<Object>} Producto actualizado
 */
const cambiarEstado = async (idProducto, estado) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .update({ estado })
      .eq('id_producto', idProducto)
      .is('deleted_at', null)
      .select(`
        *,
        categorias (
          id_categoria,
          nombre
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ErrorNoEncontrado('Producto no encontrado');
      }
      throw new ErrorBaseDatos('Error al cambiar estado del producto', error);
    }

    return data;
  } catch (error) {
    if (error instanceof ErrorNoEncontrado || error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al cambiar estado del producto', error);
  }
};

/**
 * Soft delete - Mover producto a papelera
 * @param {string} idProducto - UUID del producto
 * @returns {Promise<Object>} Producto movido a papelera
 */
const moverPapelera = async (idProducto) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id_producto', idProducto)
      .is('deleted_at', null)
      .select(`
        *,
        categorias (
          id_categoria,
          nombre
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ErrorNoEncontrado('Producto no encontrado');
      }
      throw new ErrorBaseDatos('Error al mover producto a papelera', error);
    }

    return data;
  } catch (error) {
    if (error instanceof ErrorNoEncontrado || error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al mover producto a papelera', error);
  }
};

/**
 * Restaurar producto desde papelera
 * @param {string} idProducto - UUID del producto
 * @returns {Promise<Object>} Producto restaurado
 */
const restaurarDePapelera = async (idProducto) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .update({ deleted_at: null })
      .eq('id_producto', idProducto)
      .not('deleted_at', 'is', null)
      .select(`
        *,
        categorias (
          id_categoria,
          nombre
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ErrorNoEncontrado('Producto no encontrado en papelera');
      }
      throw new ErrorBaseDatos('Error al restaurar producto', error);
    }

    return data;
  } catch (error) {
    if (error instanceof ErrorNoEncontrado || error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al restaurar producto', error);
  }
};

/**
 * Eliminar producto permanentemente
 * @param {string} idProducto - UUID del producto
 * @returns {Promise<void>}
 */
const eliminarPermanentemente = async (idProducto) => {
  try {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id_producto', idProducto);

    if (error) {
      throw new ErrorBaseDatos('Error al eliminar producto permanentemente', error);
    }
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al eliminar producto permanentemente', error);
  }
};

/**
 * Verificar si un producto tiene movimientos de inventario
 * @param {string} idProducto - UUID del producto
 * @returns {Promise<boolean>} true si tiene movimientos
 */
const tieneMovimientos = async (idProducto) => {
  try {
    const { count, error } = await supabase
      .from('movimientos_inventario')
      .select('id_movimiento', { count: 'exact', head: true })
      .eq('id_producto', idProducto);

    if (error) {
      throw new ErrorBaseDatos('Error al verificar movimientos del producto', error);
    }

    return count > 0;
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al verificar movimientos del producto', error);
  }
};

/**
 * Contar movimientos recientes del producto (últimos 30 días)
 * @param {string} idProducto - UUID del producto
 * @returns {Promise<number>} Cantidad de movimientos recientes
 */
const contarMovimientosRecientes = async (idProducto) => {
  try {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);

    const { count, error } = await supabase
      .from('movimientos_inventario')
      .select('id_movimiento', { count: 'exact', head: true })
      .eq('id_producto', idProducto)
      .gte('fecha_movimiento', fechaLimite.toISOString());

    if (error) {
      throw new ErrorBaseDatos('Error al contar movimientos recientes', error);
    }

    return count || 0;
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al contar movimientos recientes', error);
  }
};

module.exports = {
  obtenerTodos,
  obtenerListaSimple,
  obtenerPapelera,
  obtenerStockBajo,
  obtenerPorId,
  existePorNombre,
  crear,
  actualizar,
  cambiarEstado,
  moverPapelera,
  restaurarDePapelera,
  eliminarPermanentemente,
  tieneMovimientos,
  contarMovimientosRecientes
};
