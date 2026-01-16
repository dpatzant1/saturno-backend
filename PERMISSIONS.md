# Matriz de Permisos - API Carpintería

Este documento define los permisos de acceso por rol para cada endpoint de la API.

## Roles Disponibles

- **ADMINISTRADOR**: Acceso completo a todas las operaciones
- **VENDEDOR**: Acceso de solo lectura + operaciones de venta

---

## 1. AUTENTICACIÓN

| Endpoint | Método | ADMINISTRADOR | VENDEDOR | Descripción |
|----------|--------|---------------|----------|-------------|
| `/api/auth/login` | POST | ✅ | ✅ | Inicio de sesión |
| `/api/auth/refresh` | POST | ✅ | ✅ | Renovar token de acceso |
| `/api/auth/logout` | POST | ✅ | ✅ | Cerrar sesión |

**Rate Limiting**: 5 requests/15min en `/login`

---

## 2. USUARIOS

| Endpoint | Método | ADMINISTRADOR | VENDEDOR | Descripción |
|----------|--------|---------------|----------|-------------|
| `/api/usuarios` | GET | ✅ | ❌ | Listar todos los usuarios |
| `/api/usuarios/:id` | GET | ✅ | ✅* | Obtener un usuario |
| `/api/usuarios` | POST | ✅ | ❌ | Crear nuevo usuario |
| `/api/usuarios/:id` | PUT | ✅ | ✅* | Actualizar usuario |
| `/api/usuarios/:id` | DELETE | ✅ | ❌ | Eliminar usuario |

**Notas**:
- `*` VENDEDOR solo puede ver/actualizar su propio perfil
- Rate Limiting: 20 requests/15min en creación

---

## 3. CATEGORÍAS

| Endpoint | Método | ADMINISTRADOR | VENDEDOR | Descripción |
|----------|--------|---------------|----------|-------------|
| `/api/categorias` | GET | ✅ | ✅ | Listar categorías activas |
| `/api/categorias/todas` | GET | ✅ | ✅ | Listar todas (incluso eliminadas) |
| `/api/categorias/:id` | GET | ✅ | ✅ | Obtener una categoría |
| `/api/categorias` | POST | ✅ | ❌ | Crear categoría |
| `/api/categorias/:id` | PUT | ✅ | ❌ | Actualizar categoría |
| `/api/categorias/:id` | DELETE | ✅ | ❌ | Eliminar categoría (soft delete) |
| `/api/categorias/:id/restaurar` | PATCH | ✅ | ❌ | Restaurar categoría eliminada |

**Rate Limiting**: 20 requests/15min en creación, 10 requests/15min en eliminación

---

## 4. PRODUCTOS

| Endpoint | Método | ADMINISTRADOR | VENDEDOR | Descripción |
|----------|--------|---------------|----------|-------------|
| `/api/productos` | GET | ✅ | ✅ | Listar productos activos |
| `/api/productos/todos` | GET | ✅ | ✅ | Listar todos (incluso eliminados) |
| `/api/productos/:id` | GET | ✅ | ✅ | Obtener un producto |
| `/api/productos` | POST | ✅ | ❌ | Crear producto |
| `/api/productos/:id` | PUT | ✅ | ❌ | Actualizar producto |
| `/api/productos/:id` | DELETE | ✅ | ❌ | Eliminar producto (soft delete) |
| `/api/productos/:id/restaurar` | PATCH | ✅ | ❌ | Restaurar producto eliminado |
| `/api/productos/bajo-stock` | GET | ✅ | ✅ | Productos con stock bajo |
| `/api/productos/sin-stock` | GET | ✅ | ✅ | Productos sin stock |

**Notas**:
- Los productos NO SE PUEDEN ACTUALIZAR el stock directamente
- El stock SOLO se modifica a través de movimientos de inventario
- Rate Limiting: 20 requests/15min en creación, 10 requests/15min en eliminación

---

## 5. INVENTARIO (Movimientos)

| Endpoint | Método | ADMINISTRADOR | VENDEDOR | Descripción |
|----------|--------|---------------|----------|-------------|
| `/api/inventario/movimientos` | GET | ✅ | ✅ | Listar movimientos |
| `/api/inventario/movimientos/:id` | GET | ✅ | ✅ | Obtener un movimiento |
| `/api/inventario/entrada` | POST | ✅ | ❌ | Registrar entrada de stock |
| `/api/inventario/salida` | POST | ✅ | ❌ | Registrar salida de stock |
| `/api/inventario/movimientos/producto/:id_producto` | GET | ✅ | ✅ | Historial de movimientos de un producto |

**Notas**:
- VENDEDOR puede ver movimientos pero NO puede crearlos manualmente
- Las ventas generan movimientos automáticamente de tipo VENTA
- Rate Limiting: 20 requests/15min en creación de movimientos

---

## 6. CLIENTES

| Endpoint | Método | ADMINISTRADOR | VENDEDOR | Descripción |
|----------|--------|---------------|----------|-------------|
| `/api/clientes` | GET | ✅ | ✅ | Listar clientes activos |
| `/api/clientes/todos` | GET | ✅ | ✅ | Listar todos (incluso eliminados) |
| `/api/clientes/:id` | GET | ✅ | ✅ | Obtener un cliente |
| `/api/clientes` | POST | ✅ | ❌ | Crear cliente |
| `/api/clientes/:id` | PUT | ✅ | ❌ | Actualizar cliente |
| `/api/clientes/:id` | DELETE | ✅ | ❌ | Eliminar cliente (soft delete) |
| `/api/clientes/:id/restaurar` | PATCH | ✅ | ❌ | Restaurar cliente eliminado |
| `/api/clientes/tipo/:tipo` | GET | ✅ | ✅ | Filtrar por tipo (CONTADO/CREDITO) |

**Rate Limiting**: 20 requests/15min en creación, 10 requests/15min en eliminación

---

## 7. VENTAS

| Endpoint | Método | ADMINISTRADOR | VENDEDOR | Descripción |
|----------|--------|---------------|----------|-------------|
| `/api/ventas` | GET | ✅ | ✅ | Listar ventas |
| `/api/ventas/:id` | GET | ✅ | ✅ | Obtener una venta |
| `/api/ventas/contado` | POST | ✅ | ✅ | Crear venta al contado |
| `/api/ventas/credito` | POST | ✅ | ✅ | Crear venta a crédito |
| `/api/ventas/:id/anular` | POST | ✅ | ❌ | Anular una venta |
| `/api/ventas/reportes/ventas-por-periodo` | GET | ✅ | ✅ | Reporte de ventas |
| `/api/ventas/reportes/productos-mas-vendidos` | GET | ✅ | ✅ | Productos más vendidos |
| `/api/ventas/estado/:estado` | GET | ✅ | ✅ | Filtrar por estado (ACTIVO/ANULADA) |

**Notas**:
- VENDEDOR puede crear ventas pero NO puede anularlas
- Las ventas generan automáticamente movimientos de inventario
- Rate Limiting: 30 requests/15min en creación, 5 requests/15min en anulación

---

## 8. CRÉDITOS

| Endpoint | Método | ADMINISTRADOR | VENDEDOR | Descripción |
|----------|--------|---------------|----------|-------------|
| `/api/creditos` | GET | ✅ | ✅ | Listar créditos |
| `/api/creditos/:id` | GET | ✅ | ✅ | Obtener un crédito |
| `/api/creditos` | POST | ✅ | ❌ | Crear crédito |
| `/api/creditos/activos` | GET | ✅ | ✅ | Créditos activos |
| `/api/creditos/vencidos` | GET | ✅ | ✅ | Créditos vencidos |
| `/api/creditos/cliente/:id_cliente` | GET | ✅ | ✅ | Créditos de un cliente |
| `/api/creditos/:id/pagar` | POST | ✅ | ✅ | Registrar pago |
| `/api/creditos/:id/pagos` | GET | ✅ | ✅ | Historial de pagos |
| `/api/creditos/dashboard/cobranza` | GET | ✅ | ✅ | Dashboard de cobranza |
| `/api/creditos/reportes/cartera-vencida` | GET | ✅ | ✅ | Reporte de cartera vencida |
| `/api/creditos/alertas/proximos-vencer` | GET | ✅ | ✅ | Alertas de vencimiento |

**Notas**:
- VENDEDOR puede registrar pagos
- VENDEDOR NO puede crear créditos nuevos
- Rate Limiting: 15 requests/15min en creación, 10 requests/15min en pagos

---

## 9. PAGOS (Créditos)

Los endpoints de pagos están integrados en el módulo de créditos (ver arriba).

**Rate Limiting específico**: 10 requests/15min en `/creditos/:id/pagar`

---

## Auditoría de Acciones Críticas

Las siguientes acciones quedan registradas en el log de auditoría:

### Autenticación
- ✅ Login
- ✅ Logout
- ✅ Refresh token

### Usuarios
- ✅ Crear usuario
- ✅ Actualizar usuario
- ✅ Eliminar usuario

### Productos
- ✅ Crear producto
- ✅ Actualizar producto
- ✅ Eliminar producto (soft delete)
- ✅ Restaurar producto

### Inventario
- ✅ Entrada de stock
- ✅ Salida de stock

### Ventas
- ✅ Crear venta al contado
- ✅ Crear venta a crédito
- ✅ Anular venta

### Créditos y Pagos
- ✅ Crear crédito
- ✅ Registrar pago

### Clientes
- ✅ Crear cliente
- ✅ Actualizar cliente
- ✅ Eliminar cliente

---

## Configuración de Rate Limiting

| Tipo de Endpoint | Límite | Ventana |
|------------------|--------|---------|
| General | 100 requests | 15 minutos |
| Autenticación | 5 requests | 15 minutos |
| Creación general | 10 requests | 1 minuto |
| Ventas | 30 requests | 15 minutos |
| Pagos | 10 requests | 15 minutos |
| Créditos | 15 requests | 15 minutos |
| Anulación | 5 requests | 15 minutos |
| Eliminación | 10 requests | 15 minutos |

---

## Validaciones de Seguridad

### Protección contra SQL Injection
✅ Todas las consultas usan Supabase con prepared statements

### Protección contra XSS
✅ Middleware de sanitización en todas las rutas

### Validación de Inputs
✅ express-validator en todos los endpoints

### Autenticación
✅ JWT con tokens de acceso (30 min) y refresh (7 días)

### Autorización
✅ Middleware de verificación de roles en rutas protegidas

### Headers de Seguridad
✅ helmet.js configurado

### CORS
✅ Configurado con origen permitido

---

## Reglas de Negocio Críticas

1. **Stock NUNCA se modifica directamente**: Solo a través de movimientos de inventario
2. **Ventas a crédito**: Solo para clientes tipo CREDITO
3. **Límite de crédito**: El sistema valida que el cliente tenga crédito disponible
4. **Anulación de ventas**: Solo ADMINISTRADOR, genera movimiento inverso automático
5. **Pagos**: No pueden exceder el saldo pendiente del crédito
6. **Soft Delete**: Los registros eliminados se marcan con `deleted_at`, no se borran físicamente

---

**Última actualización**: Fase 8 - Validaciones y Seguridad Avanzada
