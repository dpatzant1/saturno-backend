# 🔧 Solución de Problemas - Error 429 (Too Many Requests)

## 🐛 Problema Identificado

Tu aplicación desplegada en Render estaba mostrando el error:
```
"Demasiadas peticiones desde esta IP, por favor intente más tarde"
Failed to load resource: the server responded with a status of 429
```

### Causa Raíz

1. **Rate limiting muy restrictivo**: El límite original era de **100 requests cada 15 minutos**, insuficiente cuando el frontend hace múltiples llamadas simultáneas al cargar.

2. **Problema con proxy de Render**: Todas las peticiones parecían venir de la misma IP (la del proxy de Render), multiplicando el efecto del rate limiting.

3. **Carga simultánea del frontend**: Al abrir la aplicación, el frontend hace peticiones a:
   - `/api/categorias`
   - `/api/productos`
   - `/api/clientes`
   - `/api/ventas`
   - `/api/creditos`
   - `/api/movimientos`

## ✅ Solución Implementada

### 1. Configuración de Trust Proxy

**Archivo**: [src/index.js](src/index.js#L17-L19)
```javascript
// Confiar en proxy de Render para obtener IPs reales
app.set('trust proxy', 1);
```

Esto permite que Express reconozca la IP real del cliente detrás del proxy.

### 2. Límites de Rate Aumentados

**Archivo**: [src/config/index.js](src/config/index.js#L26-L29)

| Endpoint | Límite Anterior | Límite Nuevo |
|----------|----------------|--------------|
| General (todas las rutas) | 100/15min | **1000/15min** |
| Autenticación | 5/15min | **10/15min** |
| Creación de recursos | 10/min | **30/min** |
| Pagos | 10/15min | **50/15min** |
| Créditos | 15/15min | **50/15min** |
| Ventas | 30/15min | **100/15min** |
| Anulaciones | 5/15min | **20/15min** |
| Eliminaciones | 10/15min | **30/15min** |

### 3. KeyGenerator Personalizado

**Archivo**: [src/middlewares/rateLimiter.js](src/middlewares/rateLimiter.js#L29-L32)
```javascript
keyGenerator: (req) => {
  return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}
```

Extrae correctamente la IP del cliente desde los headers del proxy.

## 📦 Archivos Modificados

1. ✅ [src/index.js](src/index.js) - Agregado `app.set('trust proxy', 1)`
2. ✅ [src/config/index.js](src/config/index.js) - Límite general aumentado a 1000
3. ✅ [src/middlewares/rateLimiter.js](src/middlewares/rateLimiter.js) - Todos los limiters actualizados con `trustProxy: true` y límites mayores

## 🚀 Pasos para Aplicar la Solución

### 1. Commit y Push
```bash
git add .
git commit -m "fix: Solucionar errores 429 ajustando rate limiting para Render"
git push origin main
```

### 2. Verificar Deploy en Render
- El deploy automático se activará
- Espera 2-5 minutos a que termine
- Revisa los logs en Render Dashboard

### 3. Configurar Variables de Entorno (si no lo has hecho)

Ve a tu servicio en Render → **Environment** y verifica:

```env
NODE_ENV=production
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=900000
CORS_ORIGIN=https://tu-frontend.vercel.app
```

### 4. Probar la Aplicación
1. Abre tu frontend
2. Navega por diferentes secciones
3. Recarga varias veces
4. Verifica que **NO aparezcan errores 429**

## 🧪 Testing Local

Para probar los cambios localmente antes del deploy:

```bash
# Instalar dependencias si no lo has hecho
npm install

# Opción 1: Ejecutar en modo desarrollo (sin rate limiting)
npm run dev

# Opción 2: Simular producción localmente
NODE_ENV=production npm start

# Opción 3: Probar el rate limiting con script de test
npm run test:rate-limit
```

## 📊 Monitoreo Post-Deploy

### Headers de Rate Limiting

Cada respuesta incluye headers informativos:
```
RateLimit-Limit: 1000
RateLimit-Remaining: 995
RateLimit-Reset: 1234567890
```

### Logs en Render

Accede a los logs en tiempo real:
1. Ve a tu servicio en Render
2. Click en "Logs"
3. Busca mensajes relacionados con rate limiting

## ⚠️ Si Aún Tienes Problemas

### Problema: Sigues viendo errores 429
**Solución**: Aumenta `RATE_LIMIT_MAX_REQUESTS` en las variables de entorno de Render a `2000` o `5000`.

### Problema: Algunos endpoints específicos fallan
**Solución**: Identifica el endpoint y ajusta su limiter específico en [src/middlewares/rateLimiter.js](src/middlewares/rateLimiter.js).

### Problema: Base de datos se desconecta
**Solución**: Verifica las variables `DB_*` en Render y que tu base de datos esté activa.

### Problema: CORS errors
**Solución**: Asegúrate de que `CORS_ORIGIN` en Render apunte a la URL exacta de tu frontend.

## 📈 Mejoras Futuras Recomendadas

### En el Frontend
1. **Caché de datos**: Usar React Query o SWR para cachear respuestas
2. **Lazy loading**: Cargar datos solo cuando sean visibles
3. **Debouncing**: En búsquedas y filtros
4. **Batch requests**: Combinar múltiples peticiones en una sola

### En el Backend
1. **Redis para rate limiting**: Más eficiente en apps distribuidas
2. **Caché de respuestas**: Para datos que no cambian frecuentemente
3. **Paginación optimizada**: Reducir payload de respuestas
4. **WebSockets**: Para actualizaciones en tiempo real sin polling

## 📚 Documentación Adicional

- [CONFIGURACION_RENDER.md](CONFIGURACION_RENDER.md) - Guía completa de configuración en Render
- [.env.example](.env.example) - Variables de entorno de ejemplo
- [test-rate-limit.js](test-rate-limit.js) - Script de prueba de rate limiting

## ✅ Checklist de Verificación

- [x] Trust proxy configurado en Express
- [x] Rate limits aumentados adecuadamente
- [x] KeyGenerator personalizado implementado
- [x] Variables de entorno documentadas
- [x] Script de testing creado
- [ ] Cambios pusheados a GitHub
- [ ] Deploy completado en Render
- [ ] Frontend probado sin errores 429
- [ ] Variables de entorno configuradas en Render

---

**Última actualización**: 17 de enero de 2026
**Estado**: ✅ Solucionado y listo para deploy
