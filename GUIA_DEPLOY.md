# 🚀 Guía Rápida de Deploy - Saturno Backend

## 📋 Resumen de Cambios Realizados

Se solucionaron los errores **429 (Too Many Requests)** que impedían el funcionamiento correcto de la aplicación en Render.

### Cambios Principales:
1. ✅ Rate limiting ajustado de 100 a **1000 requests/15min**
2. ✅ Configuración de **trust proxy** para Render
3. ✅ Límites específicos aumentados para cada tipo de operación
4. ✅ KeyGenerator personalizado para IPs reales

## 🎯 Pasos para Deploy Inmediato

### 1️⃣ Hacer Commit de los Cambios

```bash
# Ver los archivos modificados
git status

# Agregar todos los cambios
git add .

# Hacer commit con mensaje descriptivo
git commit -m "fix: Solucionar error 429 ajustando rate limiting para producción en Render

- Aumentar límite general de 100 a 1000 requests por ventana
- Configurar trust proxy para Render
- Ajustar límites específicos de auth, creación, pagos, etc.
- Agregar keyGenerator personalizado para IPs correctas
- Documentación completa de configuración y troubleshooting"

# Pushear a GitHub
git push origin main
```

### 2️⃣ Verificar Deploy en Render

1. Abre [Render Dashboard](https://dashboard.render.com/)
2. Selecciona tu servicio `saturno-backend`
3. El deploy automático debería iniciarse
4. Espera 2-5 minutos
5. Verifica que el status sea **"Live"** (verde)

### 3️⃣ Configurar Variables de Entorno (Primera vez)

Si no lo has hecho, ve a **Environment** en Render y agrega:

```env
# Base de Datos
DB_HOST=tu-host-postgresql
DB_PORT=5432
DB_USER=tu_usuario
DB_PASSWORD=tu_password_seguro
DB_NAME=nombre_base_datos

# JWT
JWT_SECRET=clave-super-secreta-minimo-32-caracteres-aleatorios-seguros
JWT_EXPIRES_IN=24h

# Servidor
NODE_ENV=production
PORT=10000

# CORS (URL de tu frontend)
CORS_ORIGIN=https://saturno-frontend.vercel.app

# Rate Limiting (Opcional - ya tiene buenos defaults)
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=900000
```

⚠️ **Importante**: Reemplaza los valores de ejemplo con tus datos reales.

### 4️⃣ Verificar que Funciona

```bash
# Test 1: Health Check
curl https://saturno-backend-xxxx.onrender.com/health

# Respuesta esperada:
# {"status":"OK","database":"conectada","timestamp":"..."}

# Test 2: Endpoint de API (requiere token)
curl https://saturno-backend-xxxx.onrender.com/api/categorias

# Si funciona, verás la lista de categorías o un error de autenticación
# NO deberías ver error 429
```

### 5️⃣ Probar el Frontend

1. Abre tu aplicación frontend
2. Inicia sesión
3. Navega por todas las secciones:
   - ✅ Categorías
   - ✅ Productos
   - ✅ Clientes
   - ✅ Ventas
   - ✅ Movimientos
   - ✅ Créditos

4. **Recarga la página varias veces** para verificar que no aparece el error de "Demasiadas peticiones"

## 🔍 Verificación de Logs

### En Render:
1. Ve a tu servicio
2. Click en **"Logs"**
3. Busca:
   - ✅ `🚀 Servidor ejecutándose en puerto 10000`
   - ✅ `✅ Base de datos conectada correctamente`
   - ❌ NO debe haber errores de conexión

### En el Navegador (DevTools):
1. Abre **F12** → **Console**
2. Recarga la página
3. Verifica:
   - ✅ Todas las peticiones devuelven **200 OK** o **201 Created**
   - ❌ NO debe haber errores **429 Too Many Requests**

## 📊 Monitoreo de Rate Limiting

Después del deploy, revisa los headers de respuesta en el navegador:

```
RateLimit-Limit: 1000
RateLimit-Remaining: 995
RateLimit-Reset: 1737146789
```

Esto indica:
- Límite total: 1000 requests
- Restantes: 995 (aún tienes margen)
- Reset: timestamp de cuando se reinicia el contador

## ⚠️ Troubleshooting

### Problema: Error 429 persiste

**Solución 1**: Aumenta el límite en Render
```env
RATE_LIMIT_MAX_REQUESTS=2000
```

**Solución 2**: Verifica que `trust proxy` esté configurado
- Revisa [src/index.js](src/index.js#L17)
- Debe tener: `app.set('trust proxy', 1);`

### Problema: Error de CORS

```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solución**: Actualiza `CORS_ORIGIN` en Render con la URL exacta de tu frontend:
```env
CORS_ORIGIN=https://saturno-frontend.vercel.app
```

### Problema: Base de datos desconectada

**Solución**: Verifica las credenciales en Render:
1. Ve a **Environment**
2. Revisa `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
3. Asegúrate de que coincidan con tu base de datos PostgreSQL

### Problema: JWT inválido

**Solución**: Genera un nuevo secret seguro:
```bash
# Generar secret aleatorio
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copia el resultado y úsalo en JWT_SECRET
```

## 📈 Mejoras Post-Deploy

### Optimizaciones Recomendadas:

1. **Implementar caché en el frontend**
   - React Query / SWR
   - LocalStorage para datos no sensibles

2. **Monitoreo de performance**
   - [Render Metrics](https://render.com/docs/metrics)
   - [New Relic](https://newrelic.com/) (opcional)

3. **Backups automáticos**
   - Configurar snapshots de base de datos
   - Exports programados

4. **CI/CD mejorado**
   - Tests automáticos antes del deploy
   - Rollback automático en caso de fallo

## 📚 Documentación Adicional

- 📖 [SOLUCION_ERROR_429.md](SOLUCION_ERROR_429.md) - Análisis detallado del problema
- 📖 [CONFIGURACION_RENDER.md](CONFIGURACION_RENDER.md) - Configuración completa de Render
- 📖 [.env.example](.env.example) - Variables de entorno de referencia

## ✅ Checklist Final

Antes de considerar el deploy completo, verifica:

- [ ] ✅ Cambios commiteados y pusheados a GitHub
- [ ] ✅ Deploy en Render completado sin errores
- [ ] ✅ Variables de entorno configuradas en Render
- [ ] ✅ Health check responde correctamente
- [ ] ✅ Frontend carga sin errores 429
- [ ] ✅ Todas las secciones funcionan (categorías, productos, etc.)
- [ ] ✅ Login funciona correctamente
- [ ] ✅ Operaciones CRUD funcionan
- [ ] ✅ No hay errores en los logs de Render

## 🎉 ¡Deploy Exitoso!

Si todos los checks están en verde, **¡tu aplicación está funcionando correctamente!**

### Próximos pasos sugeridos:
1. Monitorear el uso durante las próximas 24 horas
2. Revisar logs periódicamente
3. Configurar alertas en Render para caídas
4. Implementar las mejoras recomendadas

---

**¿Necesitas ayuda?** Revisa los archivos de documentación o los logs de Render.

**Última actualización**: 17 de enero de 2026
