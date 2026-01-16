# 🗺️ ROADMAP - API REST Sistema de Inventario y Ventas - Carpintería

## 📋 Información del Proyecto
- **Tecnologías**: Node.js, Express, PostgreSQL (Supabase)
- **Arquitectura**: MVC + Services + Repositories
- **Fecha de Inicio**: 5 de enero de 2026
- **Estado**: En Desarrollo
- **Progreso General**: 156/187 tareas completadas (83%)

---

## 🎯 FASE 1: CONFIGURACIÓN E INFRAESTRUCTURA BASE
**Objetivo**: Establecer la base técnica del proyecto

### 1.1 Configuración Inicial
- [x] Instalación de dependencias principales (pg, bcryptjs, jsonwebtoken, etc.)
- [x] Configuración de variables de entorno (.env)
- [x] Configuración de conexión a Supabase/PostgreSQL
- [x] Configuración de estructura de carpetas
- [ ] Configuración de ESLint y Prettier (opcional)

### 1.2 Middlewares Básicos
- [x] Middleware de manejo de errores global
- [x] Middleware de validación de request
- [x] Middleware de logging mejorado
- [x] Middleware de rate limiting
- [x] Middleware de sanitización de datos

### 1.3 Utilidades y Helpers
- [x] Utilidad de respuestas HTTP estandarizadas
- [x] Utilidad de manejo de errores personalizados
- [x] Utilidad de validaciones comunes
- [x] Helper para transacciones SQL
- [x] Helper para paginación

---

## 🎯 FASE 2: AUTENTICACIÓN Y AUTORIZACIÓN
**Objetivo**: Implementar sistema de seguridad completo

### 2.1 Módulo de Roles
- [x] Modelo/Repository de roles
- [x] Seeders para roles iniciales (ADMINISTRADOR, VENDEDOR)
- [x] Servicio de consulta de roles

### 2.2 Módulo de Usuarios
- [x] Modelo/Repository de usuarios
- [x] Servicio de gestión de usuarios
- [x] Hash de contraseñas con bcryptjs
- [x] Controlador de usuarios (CRUD)
- [x] Rutas de usuarios
- [x] Validaciones de entrada

### 2.3 Autenticación JWT
- [x] Servicio de autenticación (login)
- [x] Generación de tokens JWT
- [x] Middleware de verificación de token
- [x] Middleware de verificación de roles
- [x] Endpoint de login
- [x] Endpoint de refresh token (opcional)
- [x] Endpoint de logout (opcional)

### 2.4 Seguridad Adicional
- [x] Implementar helmet.js
- [x] Configurar CORS adecuadamente
- [x] Implementar express-rate-limit
- [x] Validación y sanitización con express-validator
- [x] Protección contra SQL injection

---

## 🎯 FASE 3: MÓDULO DE CATEGORÍAS Y PRODUCTOS
**Objetivo**: Gestión del catálogo de productos

### 3.1 Módulo de Categorías
- [x] Repository de categorías
- [x] Servicio de categorías
- [x] Controlador de categorías (CRUD)
- [x] Rutas de categorías
- [x] Validaciones de entrada
- [x] Filtros y búsqueda

### 3.1.1 Sistema de Papelera para Categorías
- [x] Soft delete (mover a papelera con deleted_at)
- [x] Endpoint para listar categorías en papelera
- [x] Endpoint para restaurar categoría desde papelera
- [x] Endpoint para eliminar permanentemente
- [x] Validación: no permitir eliminar si tiene productos activos

### 3.2 Módulo de Productos
- [x] Repository de productos
- [x] Servicio de productos
- [x] Controlador de productos (CRUD)
- [x] Rutas de productos
- [x] Validaciones de entrada
- [x] Relación con categorías
- [x] Filtros, búsqueda y paginación
- [x] Consulta de productos por categoría
- [x] Alerta de stock mínimo

### 3.2.1 Sistema de Papelera para Productos
- [x] Soft delete (mover a papelera con deleted_at)
- [x] Endpoint para listar productos en papelera
- [x] Endpoint para restaurar producto desde papelera
- [x] Endpoint para eliminar permanentemente
- [x] Validación: no permitir eliminar si tiene stock > 0
- [x] Validación: no permitir eliminar si tiene movimientos recientes

---

## 🎯 FASE 4: MÓDULO DE INVENTARIO
**Objetivo**: Control de movimientos de stock

### 4.1 Movimientos de Inventario
- [x] Repository de movimientos
- [x] Servicio de movimientos de inventario
- [x] Controlador de movimientos
- [x] Rutas de movimientos
- [x] Validaciones de entrada

### 4.2 Lógica de Inventario
- [x] Función de registro de entrada de productos
- [x] Función de registro de salida de productos
- [x] Actualización automática de stock en productos
- [x] Validación de stock disponible
- [x] Historial de movimientos por producto
- [x] Reporte de movimientos por fecha
- [x] Transacciones SQL para consistencia

### 4.3 Reportes de Inventario
- [x] Endpoint de productos con bajo stock
- [x] Endpoint de movimientos por período
- [x] Endpoint de kardex por producto
- [x] Dashboard de inventario (estadísticas)

---

## 🎯 FASE 5: MÓDULO DE CLIENTES
**Objetivo**: Gestión de clientes y sus tipos

### 5.1 CRUD de Clientes
- [x] Repository de clientes
- [x] Servicio de clientes
- [x] Controlador de clientes (CRUD)
- [x] Rutas de clientes
- [x] Validaciones de entrada
- [x] Filtros por tipo de cliente

### 5.1.1 Sistema de Papelera para Clientes
- [x] Soft delete (mover a papelera con deleted_at)
- [x] Endpoint para listar clientes en papelera
- [x] Endpoint para restaurar cliente desde papelera
- [x] Endpoint para eliminar permanentemente
- [x] Validación: no permitir eliminar si tiene créditos activos
- [x] Validación: no permitir eliminar si tiene ventas recientes

### 5.2 Gestión de Tipos de Cliente
- [x] Validación de límite de crédito para clientes CREDITO
- [x] Consulta de clientes por tipo (CONTADO/CREDITO)
- [x] Historial de compras por cliente
- [x] Reporte de deuda por cliente

---

## 🎯 FASE 6: MÓDULO DE VENTAS (CORE)
**Objetivo**: Sistema completo de registro y gestión de ventas
**Estado**: 25/26 tareas completadas (96%)

### 6.1 Registro de Ventas
- [x] Repository de ventas
- [x] Repository de detalle_venta
- [x] Servicio de ventas
- [x] Controlador de ventas
- [x] Rutas de ventas

### 6.2 Lógica de Venta al Contado
- [x] Endpoint de crear venta CONTADO
- [x] Validación de stock disponible
- [x] Creación de encabezado de venta
- [x] Creación de detalles de venta
- [x] Generación automática de movimientos SALIDA
- [x] Actualización de stock de productos
- [x] Uso de transacciones SQL
- [x] Cálculo automático de totales

### 6.3 Lógica de Venta a Crédito
- [x] Endpoint de crear venta CREDITO
- [x] Validación de límite de crédito del cliente
- [x] Creación de registro en tabla creditos
- [x] Cálculo de fecha de vencimiento
- [x] Vinculación venta-crédito
- [x] Validación de deuda actual vs límite

### 6.4 Anulación de Ventas
- [x] Endpoint de anular venta
- [x] Cambio de estado a ANULADA
- [x] Reversión de stock (movimientos ENTRADA)
- [x] Actualización de inventario
- [x] Si es crédito, ajustar el registro de crédito
- [x] Uso de transacciones SQL

### 6.5 Consultas y Reportes de Ventas
- [x] Listar ventas con filtros
- [x] Detalle completo de una venta
- [x] Ventas por cliente
- [x] Ventas por usuario/vendedor
- [x] Ventas por fecha
- [x] Dashboard de ventas del día
- [x] Reporte de ventas por período

---

## 🎯 FASE 7: MÓDULO DE CRÉDITOS Y PAGOS
**Objetivo**: Control de créditos y cobranza
**Estado**: 15/15 tareas completadas (100%)

### 7.1 Gestión de Créditos
- [x] Repository de créditos
- [x] Servicio de créditos
- [x] Controlador de créditos
- [x] Rutas de créditos
- [x] Consulta de créditos activos
- [x] Consulta de créditos vencidos
- [x] Consulta de créditos por cliente

### 7.2 Registro de Pagos
- [x] Repository de pagos_credito
- [x] Servicio de pagos
- [x] Endpoint de registrar pago
- [x] Actualización de saldo_pendiente
- [x] Cambio automático de estado (ACTIVO → PAGADO)
- [x] Validación de monto pagado
- [x] Uso de transacciones SQL

### 7.3 Reportes de Créditos
- [x] Listado de créditos pendientes
- [x] Historial de pagos por crédito
- [x] Reporte de cartera vencida
- [x] Dashboard de cobranza
- [x] Alertas de créditos próximos a vencer

---

## 🎯 FASE 8: VALIDACIONES Y SEGURIDAD AVANZADA
**Objetivo**: Reforzar seguridad y robustez

### 8.1 Validaciones de Negocio
- [x] Revisión de todas las reglas de negocio
- [x] Validación de relaciones entre entidades
- [x] Validación de estados permitidos
- [x] Validación de tipos de datos
- [x] Mensajes de error descriptivos

### 8.2 Control de Permisos por Rol
- [x] Definir permisos por endpoint
- [x] ADMINISTRADOR: acceso total
- [x] VENDEDOR: limitaciones definidas
- [x] Middleware de autorización por recurso
- [x] Auditoría de acciones críticas

### 8.3 Seguridad de Datos
- [x] Revisión de inyección SQL
- [x] Revisión de XSS
- [x] Validación exhaustiva de inputs
- [x] Rate limiting por endpoint crítico
- [x] Logs de operaciones críticas

---

## 🎯 FASE 9: TAREAS AUTOMATIZADAS Y JOBS
**Objetivo**: Implementar procesos automáticos del sistema

### 9.1 Sistema de Limpieza Automática de Papelera
- [x] Configuración de node-cron o node-schedule
- [x] Job para eliminar registros después de 30 días en papelera
- [x] Aplicar a productos, categorías y clientes
- [x] Logs de registros eliminados automáticamente
- [x] Configuración de horario de ejecución

### 9.2 Otras Tareas Automáticas
- [x] Job para actualizar estado de créditos vencidos
- [x] Job para alertas de productos con bajo stock
- [x] Job para alertas de créditos próximos a vencer
- [x] Sistema de notificaciones (opcional)

---

## 🎯 FASE 10: OPTIMIZACIÓN Y RENDIMIENTO
**Objetivo**: Mejorar performance y escalabilidad

### 9.1 Optimización de Consultas
- [ ] Revisión de índices en la BD
- [ ] Optimización de queries complejas
- [ ] Uso de prepared statements
- [ ] Paginación en todos los listados
- [ ] Lazy loading cuando sea apropiado

### 10.2 Caching (Opcional)
- [ ] Implementar Redis para datos frecuentes
- [ ] Cache de productos
- [ ] Cache de categorías
- [ ] Estrategia de invalidación de cache

### 10.3 Logging y Monitoreo
- [ ] Sistema de logs estructurado (Winston)
- [ ] Logs de errores
- [ ] Logs de acceso
- [ ] Logs de operaciones críticas
- [ ] Rotación de logs

---

## 🎯 FASE 11: DOCUMENTACIÓN Y TESTING
**Objetivo**: Asegurar calidad y mantenibilidad

### 11.1 Documentación de API
- [ ] Documentación con Swagger/OpenAPI
- [ ] Ejemplos de requests/responses
- [ ] Descripción de todos los endpoints
- [ ] Documentación de autenticación
- [ ] Colección de Postman/Insomnia

### 11.2 Testing (Opcional pero Recomendado)
- [ ] Setup de Jest o Mocha
- [ ] Tests unitarios de servicios
- [ ] Tests de integración de endpoints
- [ ] Tests de autenticación
- [ ] Tests de validaciones
- [ ] Coverage mínimo del 70%

### 11.3 Documentación del Código
- [ ] README.md completo
- [ ] Comentarios en código complejo
- [ ] Guía de instalación
- [ ] Guía de deployment
- [ ] Diagrama de arquitectura

---

## 🎯 FASE 12: DEPLOYMENT Y PRODUCCIÓN
**Objetivo**: Preparar para producción

### 12.1 Configuración de Producción
- [ ] Variables de entorno para producción
- [ ] Configuración de CORS para dominio específico
- [ ] Configuración de logs para producción
- [ ] Manejo de errores para producción
- [ ] Health check endpoint

### 12.2 Deployment
- [ ] Script de deployment
- [ ] Configuración de servidor (Railway, Render, AWS, etc.)
- [ ] CI/CD básico (opcional)
- [ ] Backup de base de datos
- [ ] Migración de datos iniciales

### 12.3 Monitoreo y Mantenimiento
- [ ] Sistema de alertas de errores
- [ ] Monitoreo de rendimiento
- [ ] Plan de respaldo
- [ ] Plan de escalabilidad

---

## 📊 MÉTRICAS DE PROGRESO

### Resumen por Fase
- [x] **FASE 1**: Configuración e Infraestructura Base (14/15)
- [x] **FASE 2**: Autenticación y Autorización (18/18)
- [x] **FASE 3**: Categorías y Productos (28/28)
- [x] **FASE 4**: Inventario (16/16)
- [x] **FASE 5**: Clientes (15/15)
- [x] **FASE 6**: Ventas (25/26)
- [x] **FASE 7**: Créditos y Pagos (15/15)
- [x] **FASE 8**: Validaciones y Seguridad (12/12)
- [x] **FASE 9**: Tareas Automatizadas y Jobs (9/9)
- [ ] **FASE 10**: Optimización y Rendimiento (0/11)
- [ ] **FASE 11**: Documentación y Testing (0/13)
- [ ] **FASE 12**: Deployment y Producción (0/11)

### Progreso General
- **Total de Tareas**: 187
- **Completadas**: 156
- **Progreso**: 83%

---

## 📝 NOTAS IMPORTANTES

### Convenciones de Código
- Usar ES6+ (async/await, arrow functions, etc.)
- Nombres en español para mantener coherencia con BD
- Comentarios en español
- Validar siempre antes de ejecutar operaciones
- Usar transacciones para operaciones críticas

### Estructura de Carpetas
```
src/
├── config/          # Configuraciones (db, jwt, etc.)
├── controllers/     # Controladores (lógica de rutas)
├── services/        # Lógica de negocio
├── repositories/    # Acceso a datos (queries)
├── middlewares/     # Middlewares personalizados
├── routes/          # Definición de rutas
├── models/          # Esquemas y validaciones
├── utils/           # Utilidades y helpers
├── jobs/            # Tareas automatizadas (cron jobs)
└── index.js         # Punto de entrada
```

### Reglas de Oro
1. **Nunca modificar stock directamente** → Siempre usar movimientos
2. **Usar transacciones** para operaciones multi-tabla
3. **Sistema de papelera completo** → Soft delete con posibilidad de restaurar
4. **Auto-limpieza de papelera** → Eliminación automática después de 30 días
5. **Validar permisos** en cada endpoint protegido
6. **Encriptar contraseñas** siempre
7. **Logs de auditoría** para operaciones críticas
8. **Validar dependencias** antes de eliminar (ej: producto con stock > 0)

---

## 🚀 PRÓXIMOS PASOS

Iniciar con **FASE 1** → Configuración e Infraestructura Base

---

**Última Actualización**: 5 de enero de 2026
**Versión del Roadmap**: 1.0
