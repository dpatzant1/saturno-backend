# Reglas de Negocio - API Carpintería

Este documento centraliza todas las reglas de negocio del sistema para mantener la consistencia y facilitar el mantenimiento.

---

## 1. PRODUCTOS

### Gestión de Stock
- ❌ **PROHIBIDO**: Actualizar el campo `stock` directamente
- ✅ **OBLIGATORIO**: Toda modificación de stock debe realizarse a través de movimientos de inventario
- ✅ El stock se calcula automáticamente sumando todos los movimientos del producto
- ✅ El stock puede ser negativo temporalmente (permite backorders)

### Estados
- `estado = true`: Producto activo
- `estado = false`: Producto inactivo (no aparece en listados generales)
- `deleted_at = null`: Producto NO eliminado
- `deleted_at != null`: Producto eliminado (soft delete)

### Validaciones
- ✅ `nombre`: obligatorio, mínimo 3 caracteres
- ✅ `descripcion`: opcional
- ✅ `precio`: obligatorio, mayor a 0
- ✅ `stock_minimo`: obligatorio, mayor o igual a 0
- ✅ `id_categoria`: obligatorio, debe existir y estar activa

### Alertas
- Stock bajo: `stock < stock_minimo`
- Sin stock: `stock = 0`

---

## 2. CATEGORÍAS

### Estados
- `estado = true`: Categoría activa
- `deleted_at = null`: Categoría NO eliminada

### Validaciones
- ✅ `nombre`: obligatorio, único, mínimo 3 caracteres
- ✅ `descripcion`: opcional

### Restricciones
- ❌ No se puede eliminar una categoría con productos asociados activos
- ✅ Se puede restaurar una categoría eliminada

---

## 3. CLIENTES

### Tipos de Cliente
- `CONTADO`: Cliente que paga de contado (sin crédito)
- `CREDITO`: Cliente con crédito habilitado

### Estados
- `estado = true`: Cliente activo
- `deleted_at = null`: Cliente NO eliminado

### Validaciones Cliente CONTADO
- ✅ `nombre`: obligatorio
- ✅ `nit`: opcional
- ✅ `direccion`: opcional
- ✅ `telefono`: opcional
- ✅ `email`: opcional
- ✅ `tipo_cliente = 'CONTADO'`
- ❌ `limite_credito` debe ser null
- ❌ `deuda_actual` debe ser null

### Validaciones Cliente CREDITO
- ✅ `nombre`: obligatorio
- ✅ `nit`: obligatorio
- ✅ `direccion`: obligatorio
- ✅ `telefono`: obligatorio
- ✅ `email`: opcional
- ✅ `tipo_cliente = 'CREDITO'`
- ✅ `limite_credito`: obligatorio, mayor a 0
- ✅ `deuda_actual`: se calcula automáticamente

### Cálculo de Deuda
- Deuda actual = Suma de saldos pendientes de créditos ACTIVOS + VENCIDOS
- Se actualiza automáticamente al crear créditos o registrar pagos

### Crédito Disponible
- Crédito disponible = `limite_credito - deuda_actual`
- Debe ser > 0 para crear nuevos créditos

---

## 4. INVENTARIO (Movimientos)

### Tipos de Movimiento
- `ENTRADA`: Ingreso de productos al inventario (compra, devolución)
- `SALIDA`: Salida manual de productos (ajuste, daño, transferencia)
- `VENTA`: Salida automática generada por una venta
- `ANULACION_VENTA`: Entrada automática por anulación de venta

### Validaciones
- ✅ `id_producto`: obligatorio, debe existir y estar activo
- ✅ `tipo_movimiento`: obligatorio, uno de los tipos válidos
- ✅ `cantidad`: obligatoria, mayor a 0
- ✅ `id_usuario`: obligatorio (quien registra el movimiento)
- ✅ `observaciones`: opcional

### Reglas
- ✅ Los movimientos de tipo VENTA/ANULACION_VENTA se crean automáticamente
- ✅ NO se pueden eliminar movimientos (integridad del historial)
- ✅ El stock del producto se calcula como:
  ```
  ENTRADA - SALIDA - VENTA + ANULACION_VENTA
  ```

---

## 5. VENTAS

### Tipos de Venta
- `CONTADO`: Venta pagada inmediatamente
- `CREDITO`: Venta a crédito (genera un crédito)

### Estados de Venta
- `ACTIVO`: Venta válida
- `ANULADA`: Venta anulada (genera movimientos inversos)

### Validaciones Venta CONTADO
- ✅ `id_cliente`: obligatorio, cliente tipo CONTADO o CREDITO
- ✅ `tipo_pago = 'CONTADO'`
- ✅ `metodo_pago`: obligatorio (EFECTIVO, TARJETA, TRANSFERENCIA)
- ✅ `productos`: array con al menos 1 producto
- ✅ Cada producto debe tener: `id_producto`, `cantidad > 0`, `precio_unitario > 0`
- ✅ Todos los productos deben existir y estar activos
- ✅ `total`: se calcula automáticamente

### Validaciones Venta CREDITO
- ✅ `id_cliente`: obligatorio, cliente tipo CREDITO
- ✅ Cliente debe tener crédito disponible
- ✅ `tipo_pago = 'CREDITO'`
- ✅ `metodo_pago`: debe ser null
- ✅ `fecha_vencimiento`: obligatorio (ISO 8601)
- ✅ `fecha_vencimiento > fecha_venta`
- ✅ `productos`: array con al menos 1 producto
- ✅ Cada producto validado igual que CONTADO
- ✅ `total` no debe exceder el crédito disponible del cliente

### Proceso de Venta
1. Validar datos de la venta
2. Validar existencia y estado de productos
3. Crear registro de venta
4. Crear detalles de venta (productos)
5. Generar movimientos de inventario (tipo VENTA) para cada producto
6. Si es CREDITO: crear registro de crédito
7. Actualizar deuda del cliente (si aplica)

### Anulación de Ventas
- ✅ Solo ADMINISTRADOR puede anular
- ✅ Solo se pueden anular ventas ACTIVAS
- ✅ Proceso:
  1. Cambiar estado de venta a ANULADA
  2. Generar movimientos inversos (tipo ANULACION_VENTA)
  3. Si era venta a CREDITO: anular el crédito asociado
  4. Actualizar deuda del cliente

---

## 6. CRÉDITOS

### Estados de Crédito
- `ACTIVO`: Crédito vigente con saldo pendiente
- `PAGADO`: Crédito totalmente liquidado (saldo = 0)
- `VENCIDO`: Crédito con fecha_vencimiento vencida y saldo > 0

### Validaciones al Crear
- ✅ `id_cliente`: obligatorio, debe ser tipo CREDITO
- ✅ Cliente debe tener crédito disponible suficiente
- ✅ `monto_total`: obligatorio, mayor a 0
- ✅ `monto_total <= crédito_disponible`
- ✅ `fecha_inicio`: se establece automáticamente (fecha actual)
- ✅ `fecha_vencimiento`: obligatorio (ISO 8601)
- ✅ `fecha_vencimiento > fecha_inicio`
- ✅ `saldo_pendiente`: inicialmente = monto_total
- ✅ `estado`: inicialmente = ACTIVO

### Cálculo de Estado
- Si `saldo_pendiente = 0` → PAGADO
- Si `fecha_vencimiento < fecha_actual AND saldo_pendiente > 0` → VENCIDO
- Si no → ACTIVO

### Relación con Ventas
- Un crédito se crea automáticamente cuando se hace una venta a CREDITO
- El monto del crédito = total de la venta
- La fecha de vencimiento = fecha_vencimiento de la venta

---

## 7. PAGOS

### Validaciones
- ✅ `id_credito`: obligatorio, debe existir
- ✅ Crédito NO debe estar en estado PAGADO
- ✅ `monto_pagado`: obligatorio, mayor a 0
- ✅ `monto_pagado <= saldo_pendiente` del crédito
- ✅ `metodo_pago`: obligatorio (EFECTIVO, TARJETA, TRANSFERENCIA, CHEQUE)
- ✅ `fecha_pago`: se establece automáticamente
- ✅ `observaciones`: opcional

### Proceso de Pago (TRANSACCIONAL)
1. Validar que el crédito existe y está ACTIVO o VENCIDO
2. Validar que monto_pagado <= saldo_pendiente
3. Crear registro de pago
4. Calcular nuevo_saldo = saldo_pendiente - monto_pagado
5. Actualizar saldo_pendiente del crédito
6. Si nuevo_saldo = 0: cambiar estado a PAGADO
7. Actualizar deuda_actual del cliente

### Resultado
- Se retorna información detallada:
  - Saldo anterior
  - Monto pagado
  - Nuevo saldo
  - Estado del crédito
  - Indicador de liquidación completa

---

## 8. USUARIOS

### Roles
- `ADMINISTRADOR`: Acceso completo
- `VENDEDOR`: Acceso limitado (ver matriz de permisos)

### Estados
- `estado = true`: Usuario activo (puede iniciar sesión)
- `estado = false`: Usuario inactivo (no puede iniciar sesión)

### Validaciones
- ✅ `nombre_usuario`: obligatorio, único, mínimo 3 caracteres
- ✅ `password`: obligatorio, mínimo 6 caracteres, se hashea con bcrypt
- ✅ `rol`: obligatorio, debe ser ADMINISTRADOR o VENDEDOR
- ✅ `nombre_completo`: opcional

### Autenticación
- Sistema de doble token (Access + Refresh)
- Access Token: válido 30 minutos
- Refresh Token: válido 7 días
- El Refresh Token se guarda en la base de datos

---

## 9. VALIDACIONES GLOBALES

### Identificadores
- Todos los IDs son UUID v4
- Se validan con `.isUUID()`

### Fechas
- Formato ISO 8601 (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss)
- Se validan con `.isISO8601()`

### Números
- Cantidades y montos: mayores a 0
- Límites de crédito: mayores a 0
- Stock mínimo: mayor o igual a 0

### Cadenas de Texto
- Nombres: mínimo 3 caracteres
- Sin caracteres especiales peligrosos (XSS)
- Sanitización automática con middleware

### Paginación
- `limite`: valor por defecto 10, máximo 100
- `pagina`: valor por defecto 1

---

## 10. REGLAS DE CONSISTENCIA

### Soft Delete
- Los registros NO se eliminan físicamente
- Se marca con `deleted_at = timestamp`
- Los listados generales filtran `deleted_at IS NULL`
- Endpoint especial para ver todos (incluyendo eliminados)

### Auditoría
- Todas las operaciones críticas se registran
- Se guarda: usuario, acción, entidad, datos antes/después, IP, timestamp

### Integridad Referencial
- ON DELETE RESTRICT en relaciones críticas
- Previene eliminación de registros con dependencias

### Transaccionalidad
- Operaciones complejas (ventas, pagos) se ejecutan en transacción
- Si falla algún paso, se revierte todo

---

## 11. RESTRICCIONES DE NEGOCIO

### No se puede:
- ❌ Modificar stock directamente
- ❌ Eliminar categorías con productos activos
- ❌ Eliminar clientes con créditos pendientes
- ❌ Anular ventas ya anuladas
- ❌ Pagar más del saldo pendiente
- ❌ Crear venta a crédito sin crédito disponible
- ❌ Modificar movimientos de inventario una vez creados
- ❌ Eliminar movimientos de inventario

### Se debe:
- ✅ Validar stock antes de venta (aunque puede quedar negativo)
- ✅ Actualizar deuda del cliente automáticamente
- ✅ Generar movimientos automáticos en ventas/anulaciones
- ✅ Cambiar estado de crédito a PAGADO cuando saldo = 0
- ✅ Validar límite de crédito antes de crear crédito
- ✅ Hashear contraseñas con bcrypt

---

**Última actualización**: Fase 8 - Validaciones y Seguridad Avanzada
