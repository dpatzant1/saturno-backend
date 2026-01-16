# Sistema de Paginación - API Backend

## 📋 Resumen

Se ha implementado un sistema de paginación completo y consistente en todos los módulos del backend de la API de carpintería.

## 🎯 Módulos con Paginación

- ✅ **Productos** (`/api/productos`)
- ✅ **Clientes** (`/api/clientes`)
- ✅ **Ventas** (`/api/ventas`)
- ✅ **Categorías** (`/api/categorias`)
- ✅ **Movimientos de Inventario** (`/api/movimientos`)
- ✅ **Créditos** (`/api/creditos`)

## 📝 Parámetros de Paginación

Todos los endpoints GET principales ahora aceptan los siguientes parámetros en la **query string**:

### `page` (opcional)
- **Tipo**: Número entero
- **Default**: 1
- **Descripción**: Número de página a consultar (comienza en 1)
- **Ejemplo**: `?page=2`

### `limit` (opcional)
- **Tipo**: Número entero
- **Default**: 10
- **Valores sugeridos**: 10, 20, 30, 40, 50
- **Descripción**: Cantidad de registros por página
- **Ejemplo**: `?limit=20`

## 🔍 Ejemplos de Uso

### Productos
```http
GET /api/productos?page=1&limit=10
GET /api/productos?page=2&limit=20&busqueda=mesa
GET /api/productos?page=1&limit=30&id_categoria=uuid-categoria
```

### Clientes
```http
GET /api/clientes?page=1&limit=10
GET /api/clientes?page=3&limit=20&tipo_cliente=CREDITO
GET /api/clientes?page=1&limit=50&busqueda=juan
```

### Ventas
```http
GET /api/ventas?page=1&limit=10
GET /api/ventas?page=2&limit=30&tipo_venta=CONTADO
GET /api/ventas?page=1&limit=20&fecha_desde=2024-01-01&fecha_hasta=2024-12-31
```

### Categorías
```http
GET /api/categorias?page=1&limit=10
GET /api/categorias?page=2&limit=20&busqueda=madera
```

### Movimientos
```http
GET /api/movimientos?page=1&limit=10
GET /api/movimientos?page=2&limit=30&tipo_movimiento=ENTRADA
GET /api/movimientos?page=1&limit=20&id_producto=uuid-producto
```

### Créditos
```http
GET /api/creditos?page=1&limit=10
GET /api/creditos?page=2&limit=20&estado=ACTIVO
GET /api/creditos?page=1&limit=30&id_cliente=uuid-cliente
```

## 📦 Estructura de Respuesta

Todas las respuestas paginadas siguen el siguiente formato estándar:

```json
{
  "success": true,
  "message": "Productos obtenidos exitosamente",
  "data": [
    {
      // ... objetos de datos
    }
  ],
  "metadatos": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Campos de Metadatos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `page` | number | Página actual |
| `limit` | number | Registros por página |
| `total` | number | Total de registros disponibles |
| `totalPages` | number | Total de páginas calculadas |
| `hasNextPage` | boolean | Indica si hay una página siguiente |
| `hasPrevPage` | boolean | Indica si hay una página anterior |

## 🎨 Valores de Limit Recomendados

Para el frontend, se recomienda ofrecer las siguientes opciones al usuario:

- **10** registros - Vista compacta (default)
- **20** registros - Vista estándar
- **30** registros - Vista extendida
- **40** registros - Vista amplia
- **50** registros - Vista máxima

## 💡 Notas Importantes

1. **Compatibilidad**: Los filtros existentes (búsqueda, estado, fechas, etc.) se mantienen y funcionan en conjunto con la paginación.

2. **Performance**: La paginación mejora significativamente el rendimiento al:
   - Reducir la cantidad de datos transferidos
   - Disminuir el tiempo de carga
   - Optimizar el uso de memoria en el cliente

3. **Default**: Si no se especifican `page` o `limit`, se usa `page=1` y `limit=10`.

4. **Conteo Eficiente**: El sistema hace dos queries en paralelo:
   - Una para obtener los datos paginados
   - Otra para contar el total de registros (para calcular totalPages)

## 🔄 Migración desde Sistema Antiguo

El sistema anterior usaba `limite` y `offset`. Ahora se usa `page` y `limit`:

### Antes:
```http
GET /api/productos?limite=50&offset=100
```

### Ahora:
```http
GET /api/productos?page=3&limit=50
```

**Cálculo**: `page = (offset / limite) + 1`
- Ejemplo: offset=100, limite=50 → page = (100/50) + 1 = 3

## ✅ Implementación Completa

### Repositorios Actualizados
- `productosRepository.js`
- `clientesRepository.js`
- `ventasRepository.js`
- `categoriasRepository.js`
- `movimientosRepository.js`
- `creditosRepository.js`

### Controladores Actualizados
- `productosController.js`
- `clientesController.js`
- `ventasController.js`
- `categoriasController.js`
- `movimientosController.js`
- `creditosController.js`

## 🚀 Próximos Pasos

Ahora que el backend está listo, el siguiente paso es implementar:

1. **Frontend - Componente de Paginación**: 
   - Selector de cantidad de registros (10, 20, 30, 40, 50)
   - Botones de navegación (anterior, siguiente)
   - Indicador de página actual / total de páginas
   - Input para ir a página específica

2. **Actualizar llamadas API**:
   - Agregar parámetros `page` y `limit` en todas las llamadas
   - Manejar los metadatos de paginación en el estado
   - Actualizar las listas para mostrar solo los datos paginados

3. **Mantener estado de paginación**:
   - Recordar la página actual al navegar
   - Persistir la preferencia de `limit` del usuario
   - Resetear a página 1 cuando se aplican nuevos filtros
