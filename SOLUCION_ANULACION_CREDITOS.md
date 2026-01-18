# Solución: Anulación Automática de Créditos al Anular Ventas

## Problema Identificado

Cuando se anulaba una venta de crédito desde el módulo de ventas, el crédito asociado permanecía con estado `ACTIVO` en el módulo de créditos, causando inconsistencias en el sistema.

## Causa Raíz

El código backend ya tenía implementada la lógica para anular créditos automáticamente (en `ventasService.js`, función `anularVenta()`), pero **fallaba silenciosamente** porque:

1. El método `creditosRepository.anular()` intentaba cambiar el estado a `'ANULADO'`
2. La base de datos solo permitía los estados: `'ACTIVO'`, `'VENCIDO'`, `'PAGADO'`
3. El estado `'ANULADO'` no existía en la restricción CHECK de la tabla `creditos`

## Solución Implementada

### 1. Cambios en Backend (✅ Completados)

Se actualizaron las validaciones para aceptar el estado `'ANULADO'`:

- **Archivo:** `src/utils/validacionesNegocio.js`
  - Actualizada constante `ESTADOS_CREDITO_VALIDOS` para incluir `'ANULADO'`

- **Archivo:** `src/utils/validaciones.js`
  - Actualizada validación `validarEstadoCredito()` para incluir `'ANULADO'`

### 2. Cambios en Base de Datos (⚠️ PENDIENTE - ACCIÓN REQUERIDA)

**Debes ejecutar el siguiente script SQL en Supabase:**

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Ejecuta el script contenido en: `AGREGAR_ESTADO_ANULADO_CREDITOS.sql`

El script hace lo siguiente:
```sql
-- Elimina la restricción CHECK existente
ALTER TABLE creditos 
DROP CONSTRAINT IF EXISTS creditos_estado_check;

-- Agrega nueva restricción incluyendo 'ANULADO'
ALTER TABLE creditos 
ADD CONSTRAINT creditos_estado_check 
CHECK (estado IN ('ACTIVO', 'VENCIDO', 'PAGADO', 'ANULADO'));
```

## Cómo Funciona Ahora

Cuando anules una venta de crédito:

1. La venta cambia su estado a `'ANULADA'` ✅
2. Se generan movimientos de `ENTRADA` para reversar el stock ✅
3. El crédito asociado cambia automáticamente a estado `'ANULADO'` ✅
4. El `saldo_pendiente` del crédito se pone en `0` ✅

## Código Relevante

La lógica ya existente en `src/services/ventasService.js`:

```javascript
// 3. Si es venta a CREDITO, anular el registro de crédito
let creditoAnulado = null;
if (venta.tipo_venta === TIPOS_VENTA.CREDITO) {
  try {
    const credito = await creditosRepository.obtenerPorVenta(id);
    creditoAnulado = await creditosRepository.anular(credito.id_credito);
  } catch (error) {
    console.warn(`No se encontró crédito asociado a la venta ${id}`);
  }
}
```

El método en `src/repositories/creditosRepository.js`:

```javascript
async function anular(id_credito) {
  try {
    const { data, error } = await supabase
      .from('creditos')
      .update({
        estado: 'ANULADO',
        saldo_pendiente: 0
      })
      .eq('id_credito', id_credito)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new ErrorBaseDatos(`Error al anular crédito: ${error.message}`);
  }
}
```

## Estados de Crédito Actualizados

Después de aplicar los cambios, los estados válidos de un crédito serán:

- **ACTIVO**: Crédito vigente con saldo pendiente
- **VENCIDO**: Crédito que pasó su fecha de vencimiento
- **PAGADO**: Crédito completamente pagado (saldo = 0)
- **ANULADO**: Crédito anulado por anulación de venta (saldo = 0)

## Verificación

Después de ejecutar el script SQL, puedes verificar que funciona:

1. Crea una venta a crédito
2. Anula la venta desde el módulo de ventas
3. Verifica en el módulo de créditos que aparezca con estado `ANULADO`

## Impacto en Reportes

Los créditos con estado `ANULADO`:
- NO se contarán en el cálculo de deuda del cliente
- NO aparecerán en filtros de créditos activos
- Mantendrán el historial de la transacción para auditoría

---

**Fecha:** 17 de enero de 2026  
**Archivos modificados:** 
- `src/utils/validacionesNegocio.js`
- `src/utils/validaciones.js`
- `AGREGAR_ESTADO_ANULADO_CREDITOS.sql` (nuevo)
