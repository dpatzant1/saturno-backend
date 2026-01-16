# 📘 Documentación de Descuentos en Ventas

## Resumen
Se agregó funcionalidad completa de descuentos para ventas tanto al CONTADO como a CRÉDITO.

---

## 🗄️ Cambios en la Base de Datos

### Tabla `ventas` - Nuevos campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `subtotal` | NUMERIC(10,2) | Subtotal antes del descuento |
| `descuento_tipo` | VARCHAR(20) | Tipo: `NINGUNO`, `PORCENTAJE`, `MONTO` |
| `descuento_valor` | NUMERIC(10,2) | Valor del descuento (% o monto) |
| `descuento_monto` | NUMERIC(10,2) | Monto calculado del descuento |
| `total` | NUMERIC(10,2) | Total después del descuento |

---

## 📡 API Endpoints

### POST /api/ventas/contado

Crea una venta al contado con descuento opcional.

**Request Body:**
```json
{
  "id_cliente": "uuid-del-cliente",
  "productos": [
    {
      "id_producto": "uuid-producto-1",
      "cantidad": 2,
      "precio_unitario": 500.00
    },
    {
      "id_producto": "uuid-producto-2",
      "cantidad": 1,
      "precio_unitario": 150.00
    }
  ],
  "descuento": {
    "tipo": "PORCENTAJE",
    "valor": 10
  }
}
```

**Cálculo:**
- Subtotal: Q1,150.00 (2×500 + 1×150)
- Descuento 10%: Q115.00
- **Total: Q1,035.00**

---

### POST /api/ventas/credito

Crea una venta a crédito con descuento opcional.

**Request Body:**
```json
{
  "id_cliente": "uuid-del-cliente-credito",
  "productos": [
    {
      "id_producto": "uuid-producto-1",
      "cantidad": 3,
      "precio_unitario": 200.00
    }
  ],
  "dias_credito": 30,
  "descuento": {
    "tipo": "MONTO",
    "valor": 100.00
  }
}
```

**Cálculo:**
- Subtotal: Q600.00 (3×200)
- Descuento monto fijo: Q100.00
- **Total: Q500.00**
- **Crédito creado por: Q500.00** (el total con descuento)

---

## 🎯 Tipos de Descuento

### 1. Sin Descuento (NINGUNO)

```json
{
  "descuento": {
    "tipo": "NINGUNO",
    "valor": 0
  }
}
```

O simplemente omitir el campo `descuento`:
```json
{
  "id_cliente": "...",
  "productos": [...]
  // Sin descuento
}
```

### 2. Descuento por Porcentaje

```json
{
  "descuento": {
    "tipo": "PORCENTAJE",
    "valor": 15
  }
}
```

**Validaciones:**
- `valor` debe estar entre 0 y 100
- Se calcula: `descuento_monto = subtotal × (valor / 100)`

**Ejemplo:**
- Subtotal: Q1,000
- Valor: 15 (15%)
- Descuento monto: Q150
- Total: Q850

### 3. Descuento por Monto Fijo

```json
{
  "descuento": {
    "tipo": "MONTO",
    "valor": 250.00
  }
}
```

**Validaciones:**
- `valor` no puede ser negativo
- `valor` no puede ser mayor al subtotal

**Ejemplo:**
- Subtotal: Q1,000
- Valor: 250
- Descuento monto: Q250
- Total: Q750

---

## ✅ Validaciones

### 1. Validación de Tipo
```javascript
// Solo se permiten estos tipos
TIPOS_DESCUENTO = ['NINGUNO', 'PORCENTAJE', 'MONTO']
```

### 2. Validación de Porcentaje
```javascript
if (tipo === 'PORCENTAJE' && valor > 100) {
  throw Error('El descuento no puede ser mayor a 100%')
}
```

### 3. Validación de Monto
```javascript
if (tipo === 'MONTO' && valor > subtotal) {
  throw Error('El descuento no puede ser mayor al subtotal')
}
```

### 4. Validación de Crédito
Para ventas a CRÉDITO, se valida el límite disponible **con el total después del descuento**:

```javascript
if (reporteDeuda.disponible < totalConDescuento) {
  throw Error('Crédito insuficiente')
}
```

---

## 📊 Respuesta del API

```json
{
  "status": 201,
  "mensaje": "Venta al contado creada correctamente",
  "datos": {
    "id_venta": "uuid-venta",
    "id_cliente": "uuid-cliente",
    "tipo_venta": "CONTADO",
    "subtotal": 1150.00,
    "descuento_tipo": "PORCENTAJE",
    "descuento_valor": 10.00,
    "descuento_monto": 115.00,
    "total": 1035.00,
    "estado": "ACTIVA",
    "fecha_venta": "2026-01-10T...",
    "detalles": [...],
    "movimientos_generados": 2
  }
}
```

---

## 🔄 Flujo de Negocio

### Venta al CONTADO con Descuento:
1. Calcular subtotal de productos
2. Aplicar descuento → obtener total final
3. Crear venta con campos de descuento
4. Crear detalles de venta
5. Generar movimientos de inventario (SALIDA)

### Venta a CRÉDITO con Descuento:
1. Validar que cliente sea tipo CREDITO
2. Calcular subtotal de productos
3. Aplicar descuento → obtener total final
4. Validar límite de crédito con total final
5. Crear venta con campos de descuento
6. Crear detalles de venta
7. Generar movimientos de inventario (SALIDA)
8. **Crear crédito con el total DESPUÉS del descuento**

---

## 📝 Ejemplos Completos

### Ejemplo 1: Venta CONTADO sin descuento

```bash
POST /api/ventas/contado
Authorization: Bearer {token}

{
  "id_cliente": "123e4567-e89b-12d3-a456-426614174000",
  "productos": [
    {
      "id_producto": "223e4567-e89b-12d3-a456-426614174000",
      "cantidad": 5,
      "precio_unitario": 25.50
    }
  ]
}
```

Resultado:
- Subtotal: Q127.50
- Descuento: NINGUNO
- Total: Q127.50

---

### Ejemplo 2: Venta CONTADO con 15% descuento

```bash
POST /api/ventas/contado
Authorization: Bearer {token}

{
  "id_cliente": "123e4567-e89b-12d3-a456-426614174000",
  "productos": [
    {
      "id_producto": "223e4567-e89b-12d3-a456-426614174000",
      "cantidad": 10,
      "precio_unitario": 100.00
    }
  ],
  "descuento": {
    "tipo": "PORCENTAJE",
    "valor": 15
  }
}
```

Resultado:
- Subtotal: Q1,000.00
- Descuento 15%: Q150.00
- Total: Q850.00

---

### Ejemplo 3: Venta CRÉDITO con Q200 descuento

```bash
POST /api/ventas/credito
Authorization: Bearer {token}

{
  "id_cliente": "123e4567-e89b-12d3-a456-426614174000",
  "productos": [
    {
      "id_producto": "223e4567-e89b-12d3-a456-426614174000",
      "cantidad": 4,
      "precio_unitario": 300.00
    }
  ],
  "dias_credito": 45,
  "descuento": {
    "tipo": "MONTO",
    "valor": 200.00
  }
}
```

Resultado:
- Subtotal: Q1,200.00
- Descuento monto: Q200.00
- Total: Q1,000.00
- **Crédito creado: Q1,000.00** (30 días)

---

## 🛠️ Modificaciones Realizadas

### Archivos Modificados:

1. **Base de Datos:**
   - Tabla `ventas`: Agregados campos de descuento

2. **Backend - Services:**
   - `ventasService.js`: 
     - Nuevas funciones: `validarDescuento()`, `calcularDescuento()`, `calcularTotalConDescuento()`
     - Modificado: `crearVentaContado()`, `crearVentaCredito()`

3. **Backend - Repositories:**
   - `ventasRepository.js`: 
     - Modificado método `crear()` para incluir campos de descuento

---

## ⚠️ Notas Importantes

1. El descuento se aplica **siempre al total de la venta**, no por producto individual
2. Para ventas a CRÉDITO, el crédito se genera con el monto **DESPUÉS del descuento**
3. Los campos de descuento son **opcionales**. Si no se envían, se asume "NINGUNO"
4. El cálculo del descuento se hace en el backend, nunca confiar en valores del frontend

---

## 🎉 ¡Listo para el Frontend!

El backend ya está completamente preparado para manejar descuentos. 

**Próximos pasos:**
- Implementar UI en el frontend para capturar descuentos
- Actualizar PDFs para mostrar el desglose con descuento
