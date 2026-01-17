# API REST - Sistema de Gestión de Inventario y Ventas para Carpintería

API REST desarrollada con Node.js y Express para la gestión de inventario y ventas de una tienda de artículos de carpintería.

---

## 🚨 ¿Tienes errores 429 en Render?

**👉 [INICIO_RAPIDO.md](INICIO_RAPIDO.md)** - Solución en 3 pasos

---

## 📚 Documentación Completa

| Documento | Descripción | Cuándo usarlo |
|-----------|-------------|---------------|
| **[INICIO_RAPIDO.md](INICIO_RAPIDO.md)** | 📋 Resumen ejecutivo | Primero que todo |
| **[RESUMEN_SOLUCION.md](RESUMEN_SOLUCION.md)** | 🎯 Quick start visual | Deploy rápido |
| **[GUIA_DEPLOY.md](GUIA_DEPLOY.md)** | 🚀 Deploy paso a paso | Primera vez en Render |
| **[CONFIGURACION_RENDER.md](CONFIGURACION_RENDER.md)** | ⚙️ Variables de entorno | Configurar en Render |
| **[SOLUCION_ERROR_429.md](SOLUCION_ERROR_429.md)** | 🔧 Análisis técnico | Entender el problema |
| **[OPTIMIZACIONES_FUTURAS.md](OPTIMIZACIONES_FUTURAS.md)** | 💡 Mejoras recomendadas | Después del deploy |

---

## 🚀 Deploy en Render

**¿Problemas con errores 429?** → Lee [INICIO_RAPIDO.md](INICIO_RAPIDO.md)

**Guía de deploy**: [GUIA_DEPLOY.md](GUIA_DEPLOY.md)

---

## Requisitos

- Node.js (v14 o superior)
- npm o yarn
- PostgreSQL

## Instalación

1. Clonar el repositorio o descargar el proyecto

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
- Copiar el archivo `.env.example` a `.env`
- Modificar los valores según tu configuración

## Uso

### Modo desarrollo (con auto-reload):
```bash
npm run dev
```

### Modo producción:
```bash
npm start
```

### Verificar estado antes de deploy:
```bash
npm run check
```

### Probar rate limiting:
```bash
npm run test:rate-limit
```

El servidor se ejecutará por defecto en `http://localhost:3000`

---

## 📁 Estructura del Proyecto

```
saturno-backend/
├── src/
│   ├── config/          # Configuraciones
│   ├── controllers/     # Controladores
│   ├── routes/          # Rutas de la API
│   ├── middlewares/     # Middlewares personalizados
│   ├── services/        # Lógica de negocio
│   ├── repositories/    # Acceso a datos
│   ├── jobs/            # Tareas programadas
│   ├── utils/           # Utilidades
│   └── index.js         # Punto de entrada
├── .env                 # Variables de entorno (no versionado)
├── .env.example         # Ejemplo de variables de entorno
├── .gitignore          
└── package.json
```

## Scripts Disponibles

- `npm start` - Inicia el servidor en modo producción
- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon

## Autor

Tu nombre

## Licencia

ISC
