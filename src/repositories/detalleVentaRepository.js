/**
 * Repository de Detalle de Venta
 * Gestiona el acceso a datos de detalles de ventas
 */

const { supabase } = require('../config/database');
const { ErrorNoEncontrado } = require('../utils/errores');

/**
 * Crea múltiples detalles de venta
 * @param {Array} detalles - Array de detalles de venta
 * @param {string} detalles[].id_venta - UUID de la venta
 * @param {string} detalles[].id_producto - UUID del producto
 * @param {number} detalles[].cantidad - Cantidad vendida
 * @param {number} detalles[].precio_unitario - Precio unitario
 * @param {number} detalles[].subtotal - Subtotal (cantidad * precio_unitario)
 * @returns {Promise<Array>} Detalles creados
 */
async function crearMultiples(detalles) {
  const { data, error } = await supabase
    .from('detalle_venta')
    .insert(detalles)
    .select(`
      *,
      productos:id_producto (
        id_producto,
        nombre,
        unidad_medida
      )
    `);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Obtiene los detalles de una venta
 * @param {string} id_venta - UUID de la venta
 * @returns {Promise<Array>} Detalles de la venta
 */
async function obtenerPorVenta(id_venta) {
  const { data, error } = await supabase
    .from('detalle_venta')
    .select(`
      *,
      productos:id_producto (
        id_producto,
        nombre,
        unidad_medida,
        categorias:id_categoria (
          nombre
        )
      )
    `)
    .eq('id_venta', id_venta)
    .order('id_detalle', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Obtiene un detalle específico por ID
 * @param {string} id - UUID del detalle
 * @returns {Promise<Object>} Detalle encontrado
 */
async function obtenerPorId(id) {
  const { data, error } = await supabase
    .from('detalle_venta')
    .select(`
      *,
      productos:id_producto (
        id_producto,
        nombre,
        unidad_medida
      ),
      ventas:id_venta (
        id_venta,
        tipo_venta,
        total,
        estado
      )
    `)
    .eq('id_detalle', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ErrorNoEncontrado('Detalle de venta no encontrado');
    }
    throw error;
  }

  return data;
}

/**
 * Elimina todos los detalles de una venta
 * Se usa en caso de anulación (aunque también se puede hacer por cascade)
 * @param {string} id_venta - UUID de la venta
 * @returns {Promise<number>} Cantidad de detalles eliminados
 */
async function eliminarPorVenta(id_venta) {
  const { data, error } = await supabase
    .from('detalle_venta')
    .delete()
    .eq('id_venta', id_venta)
    .select();

  if (error) {
    throw error;
  }

  return data?.length || 0;
}

/**
 * Obtiene productos más vendidos en un período
 * @param {Date} fecha_desde - Fecha inicio (opcional)
 * @param {Date} fecha_hasta - Fecha fin (opcional)
 * @param {number} limite - Cantidad de resultados (default: 10)
 * @returns {Promise<Array>} Productos más vendidos
 */
async function obtenerProductosMasVendidos(fecha_desde = null, fecha_hasta = null, limite = 10) {
  const fechaDesde = fecha_desde ? String(fecha_desde).split('T')[0] : null;
  const fechaHasta = fecha_hasta ? String(fecha_hasta).split('T')[0] : null;

  // Paso 1: obtener IDs de ventas activas en el rango solicitado.
  let ventasQuery = supabase
    .from('ventas')
    .select('id_venta, fecha_venta')
    .eq('estado', 'ACTIVA');

  if (fechaDesde) {
    ventasQuery = ventasQuery.gte('fecha_venta', fechaDesde);
  }

  if (fechaHasta) {
    ventasQuery = ventasQuery.lte('fecha_venta', fechaHasta);
  }

  const { data: ventasData, error: ventasError } = await ventasQuery;
  if (ventasError) {
    throw ventasError;
  }

  const idsVentas = (ventasData || [])
    .map(v => v.id_venta)
    .filter(Boolean);

  if (idsVentas.length === 0) {
    return [];
  }

  // Paso 2: obtener detalles en lotes para evitar errores de fetch/URL por listas .in() muy grandes.
  const detallesData = [];
  const TAMANIO_LOTE = 250;

  for (let i = 0; i < idsVentas.length; i += TAMANIO_LOTE) {
    const loteIds = idsVentas.slice(i, i + TAMANIO_LOTE);

    const { data: loteDetalle, error: loteError } = await supabase
      .from('detalle_venta')
      .select(`
        id_venta,
        id_producto,
        cantidad,
        subtotal,
        productos:id_producto (
          id_producto,
          nombre,
          unidad_medida
        )
      `)
      .in('id_venta', loteIds);

    if (loteError) {
      throw loteError;
    }

    if (loteDetalle?.length) {
      detallesData.push(...loteDetalle);
    }
  }

  // Agrupar por producto
  const productoMap = {};
  (detallesData || []).forEach(detalle => {
    const producto = Array.isArray(detalle.productos) ? detalle.productos[0] : detalle.productos;
    const id = detalle.id_producto;
    if (!id) {
      return;
    }

    if (!productoMap[id]) {
      productoMap[id] = {
        id_producto: id,
        nombre: producto?.nombre || 'Sin nombre',
        unidad_medida: producto?.unidad_medida || null,
        cantidad_total: 0,
        monto_total: 0,
        numero_ventas: 0
      };
    }

    productoMap[id].cantidad_total += Number(detalle.cantidad || 0);
    productoMap[id].monto_total += Number(detalle.subtotal || 0);
    productoMap[id].numero_ventas += 1;
  });

  // Convertir a array y ordenar por cantidad
  const productos = Object.values(productoMap)
    .sort((a, b) => b.cantidad_total - a.cantidad_total)
    .slice(0, limite);

  return productos;
}

module.exports = {
  crearMultiples,
  obtenerPorVenta,
  obtenerPorId,
  eliminarPorVenta,
  obtenerProductosMasVendidos
};
