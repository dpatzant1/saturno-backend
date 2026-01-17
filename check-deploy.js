#!/usr/bin/env node

/**
 * Script de Pre-Deploy: Verificación de Estado
 * Ejecuta una serie de checks antes de hacer deploy
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

console.log(`\n${colors.bold}${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}║  PRE-DEPLOY CHECKLIST - SATURNO API  ║${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

let totalChecks = 0;
let passedChecks = 0;
let warnings = 0;

/**
 * Verifica si un archivo existe
 */
function checkFileExists(filePath, description) {
  totalChecks++;
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    console.log(`${colors.green}✅${colors.reset} ${description}`);
    passedChecks++;
  } else {
    console.log(`${colors.red}❌${colors.reset} ${description}`);
    console.log(`   ${colors.yellow}Archivo faltante: ${filePath}${colors.reset}`);
  }
  
  return exists;
}

/**
 * Verifica contenido de un archivo
 */
function checkFileContent(filePath, searchString, description) {
  totalChecks++;
  
  if (!fs.existsSync(filePath)) {
    console.log(`${colors.red}❌${colors.reset} ${description}`);
    console.log(`   ${colors.yellow}Archivo no encontrado: ${filePath}${colors.reset}`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const found = content.includes(searchString);
  
  if (found) {
    console.log(`${colors.green}✅${colors.reset} ${description}`);
    passedChecks++;
  } else {
    console.log(`${colors.red}❌${colors.reset} ${description}`);
    console.log(`   ${colors.yellow}No se encontró: "${searchString}"${colors.reset}`);
  }
  
  return found;
}

/**
 * Warning check
 */
function checkWarning(condition, message) {
  if (!condition) {
    console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
    warnings++;
  }
}

// ===== SECCIÓN 1: ARCHIVOS ESENCIALES =====
console.log(`${colors.blue}${colors.bold}📁 Verificando archivos esenciales...${colors.reset}\n`);

checkFileExists('package.json', 'package.json existe');
checkFileExists('.env.example', '.env.example existe');
checkFileExists('src/index.js', 'Punto de entrada (index.js) existe');
checkFileExists('src/config/index.js', 'Configuración principal existe');
checkFileExists('src/middlewares/rateLimiter.js', 'Rate limiter existe');

console.log('');

// ===== SECCIÓN 2: CONFIGURACIÓN DE RATE LIMITING =====
console.log(`${colors.blue}${colors.bold}⚙️  Verificando configuración de Rate Limiting...${colors.reset}\n`);

checkFileContent(
  'src/index.js',
  "app.set('trust proxy', 1)",
  'Trust proxy está configurado'
);

checkFileContent(
  'src/config/index.js',
  'RATE_LIMIT_MAX_REQUESTS) || 1000',
  'Límite general configurado a 1000'
);

checkFileContent(
  'src/middlewares/rateLimiter.js',
  'trustProxy: true',
  'Trust proxy en rate limiter'
);

checkFileContent(
  'src/middlewares/rateLimiter.js',
  'keyGenerator:',
  'KeyGenerator personalizado implementado'
);

console.log('');

// ===== SECCIÓN 3: PACKAGE.JSON =====
console.log(`${colors.blue}${colors.bold}📦 Verificando package.json...${colors.reset}\n`);

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  totalChecks++;
  if (packageJson.scripts && packageJson.scripts.start) {
    console.log(`${colors.green}✅${colors.reset} Script "start" configurado`);
    passedChecks++;
  } else {
    console.log(`${colors.red}❌${colors.reset} Script "start" no encontrado`);
  }
  
  totalChecks++;
  if (packageJson.dependencies && packageJson.dependencies['express-rate-limit']) {
    console.log(`${colors.green}✅${colors.reset} express-rate-limit instalado`);
    passedChecks++;
  } else {
    console.log(`${colors.red}❌${colors.reset} express-rate-limit no encontrado`);
  }
  
} catch (err) {
  console.log(`${colors.red}❌${colors.reset} Error leyendo package.json: ${err.message}`);
}

console.log('');

// ===== SECCIÓN 4: VARIABLES DE ENTORNO =====
console.log(`${colors.blue}${colors.bold}🔐 Verificando configuración de variables de entorno...${colors.reset}\n`);

checkFileContent(
  '.env.example',
  'RATE_LIMIT_MAX_REQUESTS',
  'Variable RATE_LIMIT_MAX_REQUESTS en .env.example'
);

checkFileContent(
  '.env.example',
  'JWT_SECRET',
  'Variable JWT_SECRET en .env.example'
);

checkFileContent(
  '.env.example',
  'CORS_ORIGIN',
  'Variable CORS_ORIGIN en .env.example'
);

console.log('');

// ===== SECCIÓN 5: DOCUMENTACIÓN =====
console.log(`${colors.blue}${colors.bold}📚 Verificando documentación...${colors.reset}\n`);

checkFileExists('README.md', 'README.md existe');
checkFileExists('RESUMEN_SOLUCION.md', 'RESUMEN_SOLUCION.md existe');
checkFileExists('GUIA_DEPLOY.md', 'GUIA_DEPLOY.md existe');
checkFileExists('CONFIGURACION_RENDER.md', 'CONFIGURACION_RENDER.md existe');

console.log('');

// ===== SECCIÓN 6: WARNINGS =====
console.log(`${colors.blue}${colors.bold}⚠️  Verificando posibles problemas...${colors.reset}\n`);

if (fs.existsSync('.env')) {
  console.log(`${colors.yellow}⚠️  Archivo .env encontrado - Asegúrate de que NO esté en git${colors.reset}`);
  warnings++;
  
  // Verificar si .env está en .gitignore
  if (fs.existsSync('.gitignore')) {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    if (gitignore.includes('.env')) {
      console.log(`   ${colors.green}✓ .env está en .gitignore${colors.reset}`);
    } else {
      console.log(`   ${colors.red}✗ .env NO está en .gitignore - ¡PELIGRO!${colors.reset}`);
    }
  }
}

if (fs.existsSync('node_modules')) {
  console.log(`${colors.yellow}⚠️  node_modules encontrado - Asegúrate de que NO esté en git${colors.reset}`);
  warnings++;
}

console.log('');

// ===== RESUMEN FINAL =====
console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}           RESUMEN FINAL${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

const percentage = Math.round((passedChecks / totalChecks) * 100);

console.log(`Checks totales: ${totalChecks}`);
console.log(`${colors.green}✅ Pasados: ${passedChecks}${colors.reset}`);
console.log(`${colors.red}❌ Fallidos: ${totalChecks - passedChecks}${colors.reset}`);
console.log(`${colors.yellow}⚠️  Warnings: ${warnings}${colors.reset}`);
console.log(`\nÉxito: ${percentage}%\n`);

if (percentage === 100) {
  console.log(`${colors.green}${colors.bold}🎉 ¡PERFECTO! El proyecto está listo para deploy${colors.reset}\n`);
  console.log(`${colors.cyan}Próximos pasos:${colors.reset}`);
  console.log(`  1. git add .`);
  console.log(`  2. git commit -m "fix: Solucionar error 429 en Render"`);
  console.log(`  3. git push origin main\n`);
} else if (percentage >= 80) {
  console.log(`${colors.yellow}${colors.bold}⚠️  El proyecto está casi listo, pero hay algunos checks fallidos${colors.reset}\n`);
  console.log(`${colors.cyan}Revisa los errores arriba antes de hacer deploy${colors.reset}\n`);
  process.exit(1);
} else {
  console.log(`${colors.red}${colors.bold}❌ HAY PROBLEMAS CRÍTICOS - NO hacer deploy aún${colors.reset}\n`);
  console.log(`${colors.cyan}Corrige los errores antes de continuar${colors.reset}\n`);
  process.exit(1);
}

// ===== INFORMACIÓN ADICIONAL =====
console.log(`${colors.magenta}📖 Documentación disponible:${colors.reset}`);
console.log(`   • RESUMEN_SOLUCION.md    - Resumen rápido`);
console.log(`   • GUIA_DEPLOY.md         - Guía de deploy paso a paso`);
console.log(`   • CONFIGURACION_RENDER.md - Config de variables de entorno`);
console.log(`   • OPTIMIZACIONES_FUTURAS.md - Mejoras recomendadas\n`);

console.log(`${colors.cyan}🧪 Para probar localmente:${colors.reset}`);
console.log(`   npm run dev              - Modo desarrollo`);
console.log(`   npm run test:rate-limit  - Test de rate limiting\n`);
