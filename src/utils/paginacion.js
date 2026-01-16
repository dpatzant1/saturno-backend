/**
 * Helper para paginación de resultados
 * Facilita la paginación consistente en toda la API
 */

const config = require('../config');

/**
 * Extrae y valida parámetros de paginación de la query
 * @param {Object} query - Query params de la request
 * @returns {Object} Parámetros de paginación validados
 */
const obtenerParametrosPaginacion = (query) => {
  const pagina = parseInt(query.pagina) || config.pagination.defaultPage;
  const limite = parseInt(query.limite) || config.pagination.defaultLimit;
  
  // Validar que la página sea positiva
  const paginaFinal = pagina > 0 ? pagina : 1;
  
  // Validar que el límite no exceda el máximo
  const limiteFinal = Math.min(
    Math.max(limite, 1), 
    config.pagination.maxLimit
  );
  
  // Calcular el offset (desde qué registro empezar)
  const desde = (paginaFinal - 1) * limiteFinal;
  const hasta = desde + limiteFinal - 1;
  
  return {
    pagina: paginaFinal,
    limite: limiteFinal,
    desde,
    hasta
  };
};

/**
 * Calcula la información de paginación para la respuesta
 * @param {Number} totalRegistros - Total de registros en la BD
 * @param {Number} pagina - Página actual
 * @param {Number} limite - Registros por página
 * @returns {Object} Información de paginación
 */
const calcularPaginacion = (totalRegistros, pagina, limite) => {
  const totalPaginas = Math.ceil(totalRegistros / limite);
  
  return {
    paginaActual: pagina,
    registrosPorPagina: limite,
    totalRegistros,
    totalPaginas,
    tienePaginaAnterior: pagina > 1,
    tienePaginaSiguiente: pagina < totalPaginas,
    paginaAnterior: pagina > 1 ? pagina - 1 : null,
    paginaSiguiente: pagina < totalPaginas ? pagina + 1 : null
  };
};

/**
 * Aplica paginación a una consulta de Supabase
 * @param {Object} query - Query de Supabase
 * @param {Object} params - Parámetros de paginación { pagina, limite }
 * @returns {Object} Query con paginación aplicada
 * 
 * @example
 * const params = obtenerParametrosPaginacion(req.query);
 * let query = supabase.from('productos').select('*', { count: 'exact' });
 * query = aplicarPaginacion(query, params);
 * const { data, count } = await query;
 */
const aplicarPaginacion = (query, params) => {
  const { desde, hasta } = params;
  return query.range(desde, hasta);
};

/**
 * Ejecuta una consulta paginada completa
 * @param {Object} query - Query base de Supabase (debe incluir { count: 'exact' })
 * @param {Object} queryParams - Query params de la request
 * @returns {Object} { data, paginacion }
 * 
 * @example
 * const query = supabase
 *   .from('productos')
 *   .select('*', { count: 'exact' })
 *   .eq('estado', true);
 * 
 * const resultado = await ejecutarConsultaPaginada(query, req.query);
 * // resultado = { data: [...], paginacion: {...} }
 */
const ejecutarConsultaPaginada = async (query, queryParams) => {
  const params = obtenerParametrosPaginacion(queryParams);
  
  // Aplicar paginación
  const queryPaginada = aplicarPaginacion(query, params);
  
  // Ejecutar consulta
  const { data, error, count } = await queryPaginada;
  
  if (error) {
    throw error;
  }
  
  // Calcular información de paginación
  const paginacion = calcularPaginacion(count || 0, params.pagina, params.limite);
  
  return {
    data: data || [],
    paginacion
  };
};

/**
 * Helper para aplicar filtros de búsqueda comunes
 * @param {Object} query - Query de Supabase
 * @param {String} busqueda - Término de búsqueda
 * @param {Array} campos - Campos en los que buscar
 * @returns {Object} Query con filtros aplicados
 * 
 * @example
 * let query = supabase.from('productos').select('*');
 * query = aplicarBusqueda(query, 'martillo', ['nombre', 'descripcion']);
 */
const aplicarBusqueda = (query, busqueda, campos = []) => {
  if (!busqueda || campos.length === 0) {
    return query;
  }
  
  // Construir filtro OR para búsqueda en múltiples campos
  const filtros = campos.map(campo => `${campo}.ilike.%${busqueda}%`).join(',');
  return query.or(filtros);
};

/**
 * Helper para aplicar ordenamiento
 * @param {Object} query - Query de Supabase
 * @param {String} ordenarPor - Campo por el cual ordenar
 * @param {String} orden - 'asc' o 'desc'
 * @returns {Object} Query con ordenamiento aplicado
 * 
 * @example
 * let query = supabase.from('productos').select('*');
 * query = aplicarOrdenamiento(query, 'nombre', 'asc');
 */
const aplicarOrdenamiento = (query, ordenarPor = 'fecha_creacion', orden = 'desc') => {
  const ordenFinal = orden.toLowerCase() === 'asc' ? true : false;
  return query.order(ordenarPor, { ascending: ordenFinal });
};

/**
 * Helper completo: paginación + búsqueda + ordenamiento
 * @param {Object} baseQuery - Query base de Supabase
 * @param {Object} opciones - { queryParams, busqueda, camposBusqueda, ordenarPor, orden }
 * @returns {Object} { data, paginacion }
 * 
 * @example
 * const resultado = await consultaCompleta(
 *   supabase.from('productos').select('*', { count: 'exact' }).eq('estado', true),
 *   {
 *     queryParams: req.query,
 *     busqueda: req.query.busqueda,
 *     camposBusqueda: ['nombre', 'descripcion'],
 *     ordenarPor: 'nombre',
 *     orden: 'asc'
 *   }
 * );
 */
const consultaCompleta = async (baseQuery, opciones = {}) => {
  const {
    queryParams = {},
    busqueda = null,
    camposBusqueda = [],
    ordenarPor = 'fecha_creacion',
    orden = 'desc'
  } = opciones;
  
  let query = baseQuery;
  
  // Aplicar búsqueda si existe
  if (busqueda && camposBusqueda.length > 0) {
    query = aplicarBusqueda(query, busqueda, camposBusqueda);
  }
  
  // Aplicar ordenamiento
  query = aplicarOrdenamiento(query, ordenarPor, orden);
  
  // Ejecutar con paginación
  return await ejecutarConsultaPaginada(query, queryParams);
};

module.exports = {
  obtenerParametrosPaginacion,
  calcularPaginacion,
  aplicarPaginacion,
  ejecutarConsultaPaginada,
  aplicarBusqueda,
  aplicarOrdenamiento,
  consultaCompleta
};
