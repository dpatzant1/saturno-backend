#!/usr/bin/env node

/**
 * Script de Verificación de Rate Limiting
 * Simula múltiples peticiones para probar los límites
 */

const axios = require('axios');
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Configuración
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_TOKEN || '';

console.log(`${colors.cyan}🧪 Iniciando pruebas de Rate Limiting${colors.reset}\n`);
console.log(`${colors.blue}📡 URL Base: ${BASE_URL}${colors.reset}\n`);

// Headers comunes
const headers = TEST_TOKEN ? {
  'Authorization': `Bearer ${TEST_TOKEN}`
} : {};

/**
 * Realiza múltiples peticiones paralelas
 */
async function testParallelRequests(endpoint, count, label) {
  console.log(`${colors.yellow}🔄 Probando ${count} peticiones paralelas a ${endpoint}...${colors.reset}`);
  
  const startTime = Date.now();
  const promises = [];
  
  for (let i = 0; i < count; i++) {
    promises.push(
      axios.get(`${BASE_URL}${endpoint}`, { headers })
        .then(res => ({ success: true, status: res.status, remaining: res.headers['ratelimit-remaining'] }))
        .catch(err => ({ 
          success: false, 
          status: err.response?.status, 
          message: err.response?.data?.message || err.message,
          remaining: err.response?.headers['ratelimit-remaining']
        }))
    );
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const rateLimited = results.filter(r => r.status === 429).length;
  
  console.log(`${colors.cyan}📊 Resultados de ${label}:${colors.reset}`);
  console.log(`   ✅ Exitosas: ${colors.green}${successful}${colors.reset}`);
  console.log(`   ❌ Fallidas: ${colors.red}${failed}${colors.reset}`);
  console.log(`   🚫 Rate Limited (429): ${colors.magenta}${rateLimited}${colors.reset}`);
  console.log(`   ⏱️  Tiempo total: ${endTime - startTime}ms`);
  
  const lastResult = results[results.length - 1];
  if (lastResult.remaining !== undefined) {
    console.log(`   📉 Requests restantes: ${lastResult.remaining}`);
  }
  
  console.log('');
  
  return { successful, failed, rateLimited };
}

/**
 * Realiza peticiones secuenciales con delay
 */
async function testSequentialRequests(endpoint, count, delayMs, label) {
  console.log(`${colors.yellow}🔄 Probando ${count} peticiones secuenciales a ${endpoint} (delay: ${delayMs}ms)...${colors.reset}`);
  
  let successful = 0;
  let failed = 0;
  let rateLimited = 0;
  
  for (let i = 0; i < count; i++) {
    try {
      const res = await axios.get(`${BASE_URL}${endpoint}`, { headers });
      successful++;
      
      if (i === count - 1) {
        console.log(`   📉 Requests restantes: ${res.headers['ratelimit-remaining']}`);
      }
    } catch (err) {
      failed++;
      if (err.response?.status === 429) {
        rateLimited++;
      }
    }
    
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log(`${colors.cyan}📊 Resultados de ${label}:${colors.reset}`);
  console.log(`   ✅ Exitosas: ${colors.green}${successful}${colors.reset}`);
  console.log(`   ❌ Fallidas: ${colors.red}${failed}${colors.reset}`);
  console.log(`   🚫 Rate Limited (429): ${colors.magenta}${rateLimited}${colors.reset}\n`);
  
  return { successful, failed, rateLimited };
}

/**
 * Verifica el health check
 */
async function checkHealth() {
  console.log(`${colors.yellow}🏥 Verificando health check...${colors.reset}`);
  
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    console.log(`${colors.green}✅ Servidor activo${colors.reset}`);
    console.log(`   Status: ${res.data.status}`);
    console.log(`   Database: ${res.data.database}\n`);
    return true;
  } catch (err) {
    console.log(`${colors.red}❌ Servidor no responde${colors.reset}`);
    console.log(`   Error: ${err.message}\n`);
    return false;
  }
}

/**
 * Ejecuta todas las pruebas
 */
async function runTests() {
  // Health check primero
  const isHealthy = await checkHealth();
  if (!isHealthy) {
    console.log(`${colors.red}⚠️  El servidor no está disponible. Abortando pruebas.${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.magenta}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.magenta}  PRUEBAS DE RATE LIMITING${colors.reset}`);
  console.log(`${colors.magenta}═══════════════════════════════════════${colors.reset}\n`);
  
  // Test 1: Simular carga del frontend (múltiples endpoints simultáneos)
  console.log(`${colors.cyan}📋 TEST 1: Simular carga inicial del frontend${colors.reset}\n`);
  
  const endpoints = [
    '/api/categorias',
    '/api/productos',
    '/api/clientes',
    '/api/ventas'
  ];
  
  const loadResults = await Promise.all(
    endpoints.map(ep => testParallelRequests(ep + '?limit=10', 5, `Carga de ${ep}`))
  );
  
  const totalSuccess = loadResults.reduce((acc, r) => acc + r.successful, 0);
  const totalFailed = loadResults.reduce((acc, r) => acc + r.failed, 0);
  
  console.log(`${colors.cyan}📊 Resumen Total del Frontend:${colors.reset}`);
  console.log(`   ✅ Total exitosas: ${colors.green}${totalSuccess}${colors.reset}`);
  console.log(`   ❌ Total fallidas: ${colors.red}${totalFailed}${colors.reset}\n`);
  
  // Test 2: Prueba de límite general (muchas peticiones rápidas)
  console.log(`${colors.cyan}📋 TEST 2: Prueba de límite general${colors.reset}\n`);
  await testParallelRequests('/api/categorias', 50, 'Burst de 50 requests');
  
  // Test 3: Prueba de límite de creación (simulado con GET)
  console.log(`${colors.cyan}📋 TEST 3: Prueba de requests secuenciales${colors.reset}\n`);
  await testSequentialRequests('/api/productos', 20, 100, 'Sequential Load');
  
  console.log(`${colors.green}✅ Pruebas completadas${colors.reset}\n`);
  
  console.log(`${colors.yellow}💡 Notas:${colors.reset}`);
  console.log(`   - Si ves errores 429, el rate limiter está funcionando`);
  console.log(`   - En producción con los nuevos límites, deberías ver menos errores`);
  console.log(`   - Límite general actual: 1000 requests cada 15 minutos`);
  console.log(`   - Verifica los headers RateLimit-* en las respuestas\n`);
}

// Ejecutar pruebas
runTests().catch(err => {
  console.error(`${colors.red}❌ Error en las pruebas:${colors.reset}`, err.message);
  process.exit(1);
});
