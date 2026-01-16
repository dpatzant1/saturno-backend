# API REST - Sistema de Gestión de Inventario y Ventas para Carpintería

API REST desarrollada con Node.js y Express para la gestión de inventario y ventas de una tienda de artículos de carpintería.

## Requisitos

- Node.js (v14 o superior)
- npm o yarn

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

El servidor se ejecutará por defecto en `http://localhost:3000`

## Estructura del Proyecto

```
carpinteria-backend/
├── src/
│   ├── config/          # Configuraciones
│   ├── controllers/     # Controladores
│   ├── models/          # Modelos de datos
│   ├── routes/          # Rutas de la API
│   ├── middlewares/     # Middlewares personalizados
│   ├── services/        # Lógica de negocio
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
