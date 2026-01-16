/**
 * Middleware de sanitización de datos
 * Limpia y valida los datos de entrada para prevenir ataques
 */

/**
 * Sanitiza un string eliminando caracteres peligrosos
 */
const sanitizarString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Eliminar espacios al inicio y final
  str = str.trim();
  
  // Escapar caracteres HTML peligrosos
  str = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  return str;
};

/**
 * Sanitiza recursivamente un objeto
 */
const sanitizarObjeto = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizarObjeto(item));
  }
  
  if (typeof obj === 'object') {
    const objetoSanitizado = {};
    for (const [key, value] of Object.entries(obj)) {
      objetoSanitizado[key] = sanitizarObjeto(value);
    }
    return objetoSanitizado;
  }
  
  if (typeof obj === 'string') {
    return sanitizarString(obj);
  }
  
  return obj;
};

/**
 * Middleware que sanitiza el body, query y params de la request
 */
const sanitizarRequest = (req, res, next) => {
  if (req.body) {
    req.body = sanitizarObjeto(req.body);
  }
  
  if (req.query) {
    req.query = sanitizarObjeto(req.query);
  }
  
  if (req.params) {
    req.params = sanitizarObjeto(req.params);
  }
  
  next();
};

/**
 * Middleware específico para sanitizar solo el body
 */
const sanitizarBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizarObjeto(req.body);
  }
  next();
};

module.exports = {
  sanitizarRequest,
  sanitizarBody,
  sanitizarString,
  sanitizarObjeto
};
