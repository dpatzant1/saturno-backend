/**
 * Configuración de JWT (JSON Web Tokens)
 * Para autenticación y autorización
 * Sistema de doble token: Access Token (corta duración) + Refresh Token (larga duración)
 */

require('dotenv').config();

const jwtConfig = {
  // Access Token - para autenticación de requests
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET || 'access_secret_change_in_production',
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '2h', // 2 horas
  },
  
  // Refresh Token - para renovar access tokens
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_change_in_production',
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // 7 días
  },
  
  // Opciones adicionales para firmar tokens
  signOptions: {
    algorithm: 'HS256',
    issuer: 'carpinteria-api',
    audience: 'carpinteria-users'
  },
  
  // Opciones para verificar tokens
  verifyOptions: {
    algorithms: ['HS256'],
    issuer: 'carpinteria-api',
    audience: 'carpinteria-users'
  }
};

module.exports = jwtConfig;
