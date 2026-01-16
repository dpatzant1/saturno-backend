# Correcciones al Módulo de Créditos

## Problema Reportado
En el modal de detalle de crédito, se presentaban los siguientes problemas:

1. ❌ **Teléfono del cliente**: Mostraba N/A
2. ❌ **Crédito disponible**: Mostraba Q0.00 cuando debería mostrar el crédito disponible real
3. ❌ **Saldo después (en historial de pagos)**: Mostraba Q0.00
4. ❌ **Usuario (en historial de pagos)**: Mostraba N/A

## Solución Implementada

### 1. Backend - Correcciones en Repositories

#### `creditosRepository.js`
- ✅ Agregado campo `credito_disponible` al JOIN con clientes en `obtenerPorId()`
- Ahora retorna el crédito disponible calculado del cliente

#### `pagosRepository.js`
- ✅ Agregado JOIN con tabla `usuarios` en `obtenerPorCredito()`
- ✅ Ahora retorna información del usuario que registró cada pago
- ✅ Actualizado `crear()` para guardar `saldo_despues_pago` y `id_usuario`

### 2. Backend - Correcciones en Services

#### `creditosService.js`
- ✅ Modificado `registrarPago()` para calcular `saldo_despues_pago` ANTES de crear el pago
- ✅ Ahora pasa `saldo_despues_pago` y `id_usuario` al repository

### 3. Backend - Correcciones en Controllers

#### `creditosController.js`
- ✅ Modificado `registrarPago()` para extraer `id_usuario` de `req.usuario` (agregado por middleware de autenticación)
- ✅ Ahora pasa el ID del usuario que está registrando el pago

### 4. Frontend - Correcciones en UI

#### `Creditos.jsx`
- ✅ Corregida extracción del array de pagos del objeto respuesta de la API
- ✅ Mejorada visualización del usuario: ahora muestra nombre completo (nombre + apellido)
- ✅ Agregado manejo de campo `observaciones` como fallback de `notas`

## ⚠️ IMPORTANTE - Migración de Base de Datos Requerida

Para que estos cambios funcionen, **DEBES ejecutar el siguiente script SQL en Supabase**:

### Pasos para ejecutar la migración:

1. Abrir Supabase Dashboard
2. Ir a SQL Editor
3. Abrir el archivo `AGREGAR_COLUMNAS_PAGOS.sql`
4. Copiar y pegar el contenido en el editor SQL
5. Ejecutar el script

### Contenido del script:
```sql
-- Agregar columnas faltantes a pagos_credito
ALTER TABLE pagos_credito 
ADD COLUMN IF NOT EXISTS saldo_despues_pago DECIMAL(10,2);

ALTER TABLE pagos_credito 
ADD COLUMN IF NOT EXISTS id_usuario UUID;

ALTER TABLE pagos_credito
ADD CONSTRAINT fk_pagos_usuario 
FOREIGN KEY (id_usuario) 
REFERENCES usuarios(id_usuario)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pagos_credito_usuario ON pagos_credito(id_usuario);
```

## Resultado Final

Después de aplicar estos cambios y ejecutar la migración:

- ✅ **Teléfono del cliente**: Se muestra correctamente desde `clientes.telefono`
- ✅ **Crédito disponible**: Se muestra el valor calculado desde `clientes.credito_disponible`
- ✅ **Saldo después**: Se muestra el saldo del crédito después de cada pago
- ✅ **Usuario**: Se muestra el nombre completo del usuario que registró el pago

## Archivos Modificados

### Backend
1. `src/repositories/creditosRepository.js` - Agregado credito_disponible al JOIN
2. `src/repositories/pagosRepository.js` - Agregado JOIN con usuarios y nuevos campos
3. `src/services/creditosService.js` - Cálculo de saldo_despues_pago
4. `src/controllers/creditosController.js` - Extracción de id_usuario

### Frontend
1. `src/pages/Creditos.jsx` - Correcciones en manejo de datos y visualización

### Migración
1. `AGREGAR_COLUMNAS_PAGOS.sql` - Script SQL para agregar columnas a la base de datos

## Testing

Para verificar que todo funciona correctamente:

1. Ejecutar el script SQL en Supabase
2. Reiniciar el servidor backend
3. En el frontend, abrir el módulo de Créditos
4. Hacer clic en "Ver Detalle" de un crédito existente
5. Verificar que se muestren:
   - Teléfono del cliente
   - Crédito disponible con valor correcto
6. Registrar un nuevo pago
7. Ver el historial de pagos y verificar:
   - Saldo después del pago
   - Nombre del usuario que registró el pago

## Notas Adicionales

- El campo `credito_disponible` se calcula en el backend usando el servicio `clientesService.calcularCreditoDisponible()`
- El middleware `verificarToken` agrega automáticamente el `id_usuario` a todas las requests autenticadas
- Los pagos existentes tendrán `saldo_despues_pago` y `id_usuario` en NULL hasta que se registren nuevos pagos
