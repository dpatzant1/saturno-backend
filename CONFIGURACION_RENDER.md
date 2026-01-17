# 🚀 Configuración en Render

## Variables de Entorno Requeridas

Para que tu aplicación funcione correctamente en Render, debes configurar las siguientes variables de entorno en el dashboard de Render:

### 1. Base de Datos
```
DB_HOST=tu-host-de-base-de-datos
DB_PORT=3306
DB_USER=tu-usuario
DB_PASSWORD=tu-password
DB_NAME=nombre-de-tu-base-de-datos
```

### 2. Seguridad JWT
```
JWT_SECRET=una-clave-secreta-muy-segura-y-larga-min-32-caracteres
JWT_EXPIRES_IN=24h
```

### 3. Configuración del Servidor
```
NODE_ENV=production
PORT=10000
```

### 4. CORS (Frontend)
```
CORS_ORIGIN=https://saturno-frontend.vercel.app
```
> ⚠️ **Importante**: Reemplaza con la URL real de tu frontend desplegado

### 5. Rate Limiting (Opcional - Ya tiene valores por defecto mejorados)
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

---

## 🔧 Cambios Realizados para Solucionar Errores 429

### Problema Original
El frontend estaba recibiendo errores **429 (Too Many Requests)** porque:
- El límite era muy bajo: **100 requests cada 15 minutos**
- Render usa un proxy, y todas las peticiones parecían venir de la misma IP
- Al cargar la aplicación, se hacían múltiples llamadas simultáneas (categorías, clientes, productos, ventas)

### Solución Implementada

#### 1. **Límites Aumentados**
- **General**: 100 → **1000 requests** cada 15 minutos
- **Autenticación**: 5 → **10 intentos** cada 15 minutos
- **Creación**: 10 → **30 recursos** por minuto
- **Pagos**: 10 → **50 pagos** cada 15 minutos
- **Créditos**: 15 → **50 créditos** cada 15 minutos
- **Ventas**: 30 → **100 ventas** cada 15 minutos
- **Anulaciones**: 5 → **20 anulaciones** cada 15 minutos
- **Eliminaciones**: 10 → **30 eliminaciones** cada 15 minutos

#### 2. **Configuración de Proxy**
```javascript
// En index.js
app.set('trust proxy', 1);

// En rateLimiter.js
trustProxy: true
keyGenerator: (req) => {
  return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}
```

Esto permite que el servidor reconozca la IP real del cliente detrás del proxy de Render.

---

## 📝 Pasos para Desplegar los Cambios

### Opción 1: Deploy Automático (Recomendado)
1. Haz commit de los cambios:
   ```bash
   git add .
   git commit -m "fix: Ajustar rate limiting para producción en Render"
   git push origin main
   ```

2. Render detectará automáticamente el push y hará el deploy

### Opción 2: Deploy Manual
1. Ve a tu dashboard de Render
2. Selecciona tu servicio
3. Haz clic en "Manual Deploy" → "Deploy latest commit"

---

## ✅ Verificación Post-Deploy

Después del deploy, verifica:

1. **Health Check**: 
   ```
   https://tu-app.onrender.com/health
   ```
   Debe responder: `{"status":"OK","database":"conectada",...}`

2. **Prueba el Frontend**: 
   - Navega por todas las secciones
   - Carga categorías, productos, clientes, ventas
   - Verifica que NO aparezcan errores 429

3. **Revisa los Logs en Render**:
   - Ve a tu servicio en Render
   - Click en "Logs"
   - Verifica que no haya errores de conexión

---

## 🔍 Monitoreo

### Headers de Rate Limiting
El cliente puede ver en los headers de respuesta:
```
RateLimit-Limit: 1000
RateLimit-Remaining: 999
RateLimit-Reset: [timestamp]
```

### Si Aún Recibes Errores 429
1. Verifica que `trust proxy` esté configurado
2. Aumenta `RATE_LIMIT_MAX_REQUESTS` en las variables de entorno de Render
3. Revisa los logs para identificar el endpoint problemático
4. Considera implementar caché en el frontend para reducir peticiones repetidas

---

## 📊 Mejores Prácticas

### Frontend
- Implementa **debouncing** en búsquedas
- Usa **caché local** para datos que no cambian frecuentemente
- Implementa **lazy loading** de imágenes y datos
- Evita hacer múltiples peticiones simultáneas innecesarias

### Backend (Ya implementado)
- ✅ Rate limiting configurado correctamente
- ✅ Trust proxy habilitado
- ✅ Límites adecuados para uso real
- ✅ Headers informativos para el cliente

---

## 🆘 Troubleshooting

### Error: "Demasiadas peticiones desde esta IP"
**Causa**: El rate limiter está bloqueando
**Solución**: Aumenta `RATE_LIMIT_MAX_REQUESTS` en Render

### Error: "Failed to load resource: 429"
**Causa**: Límite específico de endpoint alcanzado
**Solución**: Revisa qué endpoint y ajusta su limiter específico

### Base de datos desconectada
**Causa**: Credenciales incorrectas o DB no disponible
**Solución**: Verifica las variables `DB_*` en Render

---

## 📱 Contacto y Soporte

Si tienes problemas:
1. Revisa los logs en Render
2. Verifica las variables de entorno
3. Comprueba que el frontend tenga la URL correcta del backend
