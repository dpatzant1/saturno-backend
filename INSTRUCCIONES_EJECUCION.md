# ✅ Instrucciones de Ejecución - API Carpintería Backend

## 🎉 Estado del Proyecto: CONFIGURADO Y FUNCIONANDO

El proyecto ha sido completamente configurado y está listo para usar.

---

## 📋 Configuración Completada

### ✅ 1. Variables de Entorno
- ✅ Archivo `.env` configurado con credenciales de Supabase
- ✅ JWT secrets configurados
- ✅ Puerto configurado: 3000
- ✅ Ambiente: development

### ✅ 2. Dependencias Instaladas
- ✅ Todas las dependencias de npm instaladas correctamente
- ✅ No se encontraron vulnerabilidades

### ✅ 3. Base de Datos
- ✅ Conexión exitosa a Supabase
- ✅ URL: https://uuvyqsvqenwgsjjktezo.supabase.co

### ✅ 4. Servidor
- ✅ Servidor iniciado correctamente en puerto 3000
- ✅ Jobs automáticos configurados y activos:
  - Limpieza de papelera (mensual)
  - Actualización de créditos vencidos (diario)
  - Alertas de stock bajo (diario)
  - Alertas de créditos por vencer (diario)

---

## 🚀 Comandos para Ejecutar

### Iniciar el servidor (modo producción):
```bash
npm start
```

### Iniciar el servidor (modo desarrollo con auto-reload):
```bash
npm run dev
```

---

## 🌐 URLs Disponibles

Una vez iniciado el servidor, puedes acceder a:

- **API Base**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### Rutas de la API:
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/usuarios` - Listar usuarios
- `GET /api/categorias` - Listar categorías
- `GET /api/productos` - Listar productos
- `GET /api/movimientos` - Listar movimientos
- `GET /api/clientes` - Listar clientes
- `GET /api/ventas` - Listar ventas
- `GET /api/creditos` - Listar créditos

---

## 🔧 Tecnologías Utilizadas

- **Node.js** - Entorno de ejecución
- **Express** - Framework web
- **Supabase** - Base de datos PostgreSQL en la nube
- **JWT** - Autenticación con tokens
- **Bcrypt** - Encriptación de contraseñas
- **Node-cron** - Jobs programados
- **Helmet** - Seguridad HTTP
- **CORS** - Control de acceso
- **Rate Limiting** - Limitación de peticiones
- **Morgan** - Logging de requests

---

## 📁 Estructura del Proyecto

```
carpinteria-backend/
├── src/
│   ├── config/          # Configuraciones (DB, JWT, etc.)
│   ├── controllers/     # Controladores de rutas
│   ├── services/        # Lógica de negocio
│   ├── repositories/    # Acceso a datos
│   ├── routes/          # Definición de rutas
│   ├── middlewares/     # Middlewares personalizados
│   ├── jobs/            # Tareas programadas
│   ├── utils/           # Utilidades
│   └── index.js         # Punto de entrada
├── logs/                # Archivos de logs
├── .env                 # Variables de entorno
├── package.json         # Dependencias
└── README.md            # Documentación
```

---

## 🔒 Seguridad Implementada

- ✅ Helmet para headers HTTP seguros
- ✅ CORS configurado
- ✅ Rate limiting para prevenir abusos
- ✅ Sanitización de inputs
- ✅ JWT para autenticación
- ✅ Bcrypt para encriptación de contraseñas
- ✅ Validación de campos con express-validator

---

## 📝 Notas Importantes

1. **Ambiente de Desarrollo**: El servidor está configurado en modo `development`
2. **Puerto**: El servidor corre en el puerto `3000`
3. **Base de Datos**: Conectado a Supabase (PostgreSQL en la nube)
4. **JWT Secrets**: Recuerda cambiar los secrets en producción por valores más seguros

---

## 🐛 Solución de Problemas

### Si el servidor no inicia:
1. Verifica que el puerto 3000 no esté en uso
2. Revisa que las credenciales de Supabase sean correctas en `.env`
3. Asegúrate de que todas las dependencias estén instaladas: `npm install`

### Si hay errores de conexión a la base de datos:
1. Verifica las variables `SUPABASE_URL` y `SUPABASE_ANON_KEY` en `.env`
2. Comprueba tu conexión a internet
3. Verifica que el proyecto de Supabase esté activo

---

## 📞 Soporte

Para más información, consulta:
- [README.md](README.md) - Documentación general
- [BUSINESS_RULES.md](BUSINESS_RULES.md) - Reglas de negocio
- [PERMISSIONS.md](PERMISSIONS.md) - Sistema de permisos
- [SEGURIDAD.md](SEGURIDAD.md) - Documentación de seguridad

---

**✨ ¡El proyecto está listo para usarse! ✨**
