/**
 * Repository de Categorías
 * Maneja todas las operaciones de base de datos relacionadas con categorías
 * Incluye sistema de papelera con deleted_at
 */

const { supabase } = require('../config/database');
const { ErrorBaseDatos, ErrorNoEncontrado } = require('../utils/errores');

/**
 * Obtener todas las categorías activas (no en papelera) con paginación
 * @param {Object} filtros - { busqueda?, soloActivas?, page?, limit? }
 * @returns {Promise<Object>} Objeto con datos paginados y metadatos
 */
const obtenerTodas = async (filtros = {}) => {
  try {
    const page = parseInt(filtros.page) || 1;
    const limit = parseInt(filtros.limit) || 10;
    const offset = (page - 1) * limit;

    // Query para contar total de registros
    let countQuery = supabase
      .from('categorias')
      .select('id_categoria', { count: 'exact', head: true })
      .is('deleted_at', null);

    // Query para obtener datos
    let query = supabase
      .from('categorias')
      .select('*')
      .is('deleted_at', null);

    // Aplicar filtros a ambas queries
    // Filtrar solo activas
    if (filtros.soloActivas !== false) {
      query = query.eq('estado', true);
      countQuery = countQuery.eq('estado', true);
    }

    // Búsqueda por nombre o descripción
    if (filtros.busqueda) {
      const searchPattern = `nombre.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%`;
      query = query.or(searchPattern);
      countQuery = countQuery.or(searchPattern);
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
      throw new ErrorBaseDatos('Error al obtener categorías', error);
    }

    if (countError) {
      throw new ErrorBaseDatos('Error al contar categorías', countError);
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
    throw new ErrorBaseDatos('Error al obtener categorías', error);
  }
};

/**
 * Obtener categorías en papelera
 * @returns {Promise<Array>} Lista de categorías eliminadas (soft delete)
 */
const obtenerPapelera = async () => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (error) {
      throw new ErrorBaseDatos('Error al obtener papelera de categorías', error);
    }

    return data || [];
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al obtener papelera de categorías', error);
  }
};

/**
 * Obtener categoría por ID
 * @param {string} idCategoria - UUID de la categoría
 * @param {boolean} incluirEliminadas - Si incluir categorías en papelera
 * @returns {Promise<Object>} Categoría encontrada
 */
const obtenerPorId = async (idCategoria, incluirEliminadas = false) => {
  try {
    let query = supabase
      .from('categorias')
      .select('*')
      .eq('id_categoria', idCategoria);

    if (!incluirEliminadas) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ErrorNoEncontrado('Categoría no encontrada');
      }
      throw new ErrorBaseDatos('Error al obtener categoría', error);
    }

    return data;
  } catch (error) {
    if (error instanceof ErrorNoEncontrado || error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al obtener categoría', error);
  }
};

/**
 * Verificar si existe una categoría con el nombre dado
 * @param {string} nombre - Nombre de la categoría
 * @param {string} [idCategoriaExcluir] - ID de categoría a excluir (para updates)
 * @returns {Promise<boolean>} true si existe, false si no
 */
const existePorNombre = async (nombre, idCategoriaExcluir = null) => {
  try {
    let query = supabase
      .from('categorias')
      .select('id_categoria', { count: 'exact', head: true })
      .ilike('nombre', nombre)
      .is('deleted_at', null); // Solo verificar en categorías activas

    if (idCategoriaExcluir) {
      query = query.neq('id_categoria', idCategoriaExcluir);
    }

    const { count, error } = await query;

    if (error) {
      throw new ErrorBaseDatos('Error al verificar existencia de categoría', error);
    }

    return count > 0;
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al verificar existencia de categoría', error);
  }
};

/**
 * Crear nueva categoría
 * @param {Object} datosCategoria - { nombre, descripcion? }
 * @returns {Promise<Object>} Categoría creada
 */
const crear = async (datosCategoria) => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .insert([datosCategoria])
      .select()
      .single();

    if (error) {
      throw new ErrorBaseDatos('Error al crear categoría', error);
    }

    return data;
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al crear categoría', error);
  }
};

/**
 * Actualizar categoría
 * @param {string} idCategoria - UUID de la categoría
 * @param {Object} datosActualizar - { nombre?, descripcion? }
 * @returns {Promise<Object>} Categoría actualizada
 */
const actualizar = async (idCategoria, datosActualizar) => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .update(datosActualizar)
      .eq('id_categoria', idCategoria)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ErrorNoEncontrado('Categoría no encontrada');
      }
      throw new ErrorBaseDatos('Error al actualizar categoría', error);
    }

    return data;
  } catch (error) {
    if (error instanceof ErrorNoEncontrado || error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al actualizar categoría', error);
  }
};

/**
 * Cambiar estado de categoría (activar/desactivar)
 * @param {string} idCategoria - UUID de la categoría
 * @param {boolean} estado - true = activa, false = inactiva
 * @returns {Promise<Object>} Categoría actualizada
 */
const cambiarEstado = async (idCategoria, estado) => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .update({ estado })
      .eq('id_categoria', idCategoria)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ErrorNoEncontrado('Categoría no encontrada');
      }
      throw new ErrorBaseDatos('Error al cambiar estado de categoría', error);
    }

    return data;
  } catch (error) {
    if (error instanceof ErrorNoEncontrado || error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al cambiar estado de categoría', error);
  }
};

/**
 * Soft delete - Mover categoría a papelera
 * @param {string} idCategoria - UUID de la categoría
 * @returns {Promise<Object>} Categoría movida a papelera
 */
const moverPapelera = async (idCategoria) => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id_categoria', idCategoria)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ErrorNoEncontrado('Categoría no encontrada');
      }
      throw new ErrorBaseDatos('Error al mover categoría a papelera', error);
    }

    return data;
  } catch (error) {
    if (error instanceof ErrorNoEncontrado || error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al mover categoría a papelera', error);
  }
};

/**
 * Restaurar categoría desde papelera
 * @param {string} idCategoria - UUID de la categoría
 * @returns {Promise<Object>} Categoría restaurada
 */
const restaurarDePapelera = async (idCategoria) => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .update({ deleted_at: null })
      .eq('id_categoria', idCategoria)
      .not('deleted_at', 'is', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ErrorNoEncontrado('Categoría no encontrada en papelera');
      }
      throw new ErrorBaseDatos('Error al restaurar categoría', error);
    }

    return data;
  } catch (error) {
    if (error instanceof ErrorNoEncontrado || error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al restaurar categoría', error);
  }
};

/**
 * Eliminar categoría permanentemente
 * @param {string} idCategoria - UUID de la categoría
 * @returns {Promise<void>}
 */
const eliminarPermanentemente = async (idCategoria) => {
  try {
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id_categoria', idCategoria);

    if (error) {
      throw new ErrorBaseDatos('Error al eliminar categoría permanentemente', error);
    }
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al eliminar categoría permanentemente', error);
  }
};

/**
 * Verificar si una categoría tiene productos activos
 * @param {string} idCategoria - UUID de la categoría
 * @returns {Promise<boolean>} true si tiene productos activos
 */
const tieneProductosActivos = async (idCategoria) => {
  try {
    const { count, error } = await supabase
      .from('productos')
      .select('id_producto', { count: 'exact', head: true })
      .eq('id_categoria', idCategoria)
      .is('deleted_at', null)
      .eq('estado', true);

    if (error) {
      throw new ErrorBaseDatos('Error al verificar productos de categoría', error);
    }

    return count > 0;
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al verificar productos de categoría', error);
  }
};

/**
 * Verificar si una categoría tiene productos (incluyendo inactivos y eliminados)
 * @param {string} idCategoria - UUID de la categoría
 * @returns {Promise<boolean>} true si tiene algún producto
 */
const tieneProductos = async (idCategoria) => {
  try {
    const { count, error } = await supabase
      .from('productos')
      .select('id_producto', { count: 'exact', head: true })
      .eq('id_categoria', idCategoria);

    if (error) {
      throw new ErrorBaseDatos('Error al verificar productos de categoría', error);
    }

    return count > 0;
  } catch (error) {
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('Error al verificar productos de categoría', error);
  }
};

module.exports = {
  obtenerTodas,
  obtenerPapelera,
  obtenerPorId,
  existePorNombre,
  crear,
  actualizar,
  cambiarEstado,
  moverPapelera,
  restaurarDePapelera,
  eliminarPermanentemente,
  tieneProductosActivos,
  tieneProductos
};
