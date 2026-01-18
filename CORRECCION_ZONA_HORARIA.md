# Corrección de Zona Horaria - Guatemala

## Problema Identificado

Los movimientos y otros registros en la base de datos se estaban guardando con la hora UTC (Tiempo Universal Coordinado) en lugar de la hora de Guatemala (UTC-6). Esto causaba que las fechas aparecieran con 6 horas de adelanto.

### Ejemplo del problema:
- **Hora real en Guatemala**: 17 de enero de 2026, 22:36
- **Hora que se guardaba**: 18 de enero de 2026, 04:36 (UTC)
- **Diferencia**: +6 horas

## Solución Implementada

### 1. Configuración de Zona Horaria en el Servidor

**Archivo**: `.env`
```env
TZ=America/Guatemala
```

**Archivo**: `src/index.js`
```javascript
// Configurar zona horaria de Guatemala al inicio de la aplicación
process.env.TZ = process.env.TZ || 'America/Guatemala';
```

### 2. Utilidades de Fecha para Guatemala

**Archivo creado**: `src/utils/fechas.js`

Funciones disponibles:
- `obtenerFechaGuatemala()` - Fecha y hora actual en Guatemala
- `obtenerFechaHoyGuatemala()` - Solo fecha en formato YYYY-MM-DD
- `formatearISO(fecha)` - Formatea fecha en ISO con zona horaria de Guatemala
- `convertirAGuatemala(fecha)` - Convierte cualquier fecha a Guatemala
- `obtenerFechaFuturaGuatemala(dias)` - Calcula fechas futuras
- `calcularDiasEntre(fecha1, fecha2)` - Calcula diferencia en días

### 3. Actualización de Repositorios

Se actualizaron los siguientes repositorios para registrar fechas con la zona horaria correcta:

#### Movimientos de Inventario
**Archivo**: `src/repositories/movimientosRepository.js`
```javascript
const { obtenerFechaGuatemala, formatearISO } = require('../utils/fechas');

// Al crear un movimiento, se especifica la fecha explícitamente
const fechaMovimiento = formatearISO(obtenerFechaGuatemala());

.insert({
  // ... otros campos
  fecha_movimiento: fechaMovimiento
})
```

#### Ventas
**Archivo**: `src/repositories/ventasRepository.js`
- Se registra `fecha_venta` con hora de Guatemala

#### Pagos de Crédito
**Archivo**: `src/repositories/pagosRepository.js`
- Se registra `fecha_pago` con hora de Guatemala

#### Créditos
**Archivo**: `src/repositories/creditosRepository.js`
- Se usa fecha de Guatemala para `fecha_inicio` si no se proporciona

### 4. Actualización de Jobs Programados

Se actualizaron los jobs que ejecutan tareas programadas:

**Archivos actualizados**:
- `src/jobs/actualizarCreditosVencidos.js` - Usa `obtenerFechaHoyGuatemala()`
- `src/jobs/alertasCreditosPorVencer.js` - Usa `obtenerFechaGuatemala()` y `obtenerFechaFuturaGuatemala()`
- `src/jobs/limpiezaPapelera.js` - Usa `obtenerFechaGuatemala()` y `formatearISO()`

## Formato de Fechas

### Antes de la corrección:
```
2026-01-18T04:36:59.941Z  (UTC)
```

### Después de la corrección:
```
2026-01-17T22:36:59.942-06:00  (Guatemala, UTC-6)
```

## Pruebas

Se incluye el archivo `test-timezone.js` para verificar que la zona horaria está configurada correctamente:

```bash
node test-timezone.js
```

Este script muestra:
- Fecha del sistema
- Fecha en Guatemala
- Comparación de horas
- Variable de entorno TZ configurada

## Impacto

Esta corrección afecta a **TODOS** los registros nuevos que se creen a partir de ahora:

✅ Movimientos de inventario (ENTRADA/SALIDA)  
✅ Ventas (fecha_venta)  
✅ Pagos de crédito (fecha_pago)  
✅ Créditos (fecha_inicio)  
✅ Jobs programados (créditos vencidos, alertas, limpieza)

**Nota**: Los registros anteriores en la base de datos mantienen sus fechas originales (en UTC). Si se requiere, se puede crear un script de migración para actualizarlos.

## Verificación

Para verificar que un nuevo registro tiene la hora correcta:

1. Crear un nuevo movimiento/venta/pago
2. Verificar la columna de fecha en la base de datos
3. La fecha debe incluir el offset `-06:00` al final
4. La hora debe coincidir con la hora actual de Guatemala

## Zona Horaria de Guatemala

- **Zona**: America/Guatemala
- **Offset**: UTC-6 (6 horas detrás de UTC)
- **Horario de verano**: Guatemala NO usa horario de verano
- **Offset constante**: Siempre es UTC-6 durante todo el año
