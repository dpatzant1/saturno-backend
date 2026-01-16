/**
 * Sistema de Logging Mejorado
 * Proporciona logging estructurado sin dependencias externas
 */

const fs = require('fs');
const path = require('path');

// Niveles de log
const NIVELES = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Colores para consola (solo en desarrollo)
const COLORES = {
  ERROR: '\x1b[31m', // Rojo
  WARN: '\x1b[33m',  // Amarillo
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[90m', // Gris
  RESET: '\x1b[0m'
};

class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, '../../logs');
    this.ensureLogsDirectory();
  }

  /**
   * Asegura que el directorio de logs existe
   */
  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Formatea el mensaje de log
   */
  formatMessage(nivel, mensaje, metadata = {}) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      nivel,
      mensaje,
      ...metadata
    };
  }

  /**
   * Escribe en archivo de log
   */
  writeToFile(nivel, mensajeFormateado) {
    const filename = nivel === 'ERROR' 
      ? 'error.log' 
      : 'combined.log';
    
    const filepath = path.join(this.logsDir, filename);
    const logLine = JSON.stringify(mensajeFormateado) + '\n';

    fs.appendFile(filepath, logLine, (err) => {
      if (err) {
        console.error('Error escribiendo log:', err.message);
      }
    });
  }

  /**
   * Escribe en consola con color
   */
  writeToConsole(nivel, mensajeFormateado) {
    const color = COLORES[nivel] || COLORES.RESET;
    const reset = COLORES.RESET;
    const { timestamp, mensaje, ...metadata } = mensajeFormateado;

    let output = `${color}[${timestamp}] [${nivel}]${reset} ${mensaje}`;
    
    if (Object.keys(metadata).length > 0) {
      output += `\n${JSON.stringify(metadata, null, 2)}`;
    }

    console.log(output);
  }

  /**
   * Método genérico de log
   */
  log(nivel, mensaje, metadata = {}) {
    const mensajeFormateado = this.formatMessage(nivel, mensaje, metadata);
    
    // Siempre escribir en consola
    this.writeToConsole(nivel, mensajeFormateado);
    
    // Escribir en archivo (async)
    this.writeToFile(nivel, mensajeFormateado);
  }

  /**
   * Log de error
   */
  error(mensaje, error = null) {
    const metadata = {};
    
    if (error) {
      metadata.error = {
        message: error.message,
        stack: error.stack,
        ...(error.statusCode && { statusCode: error.statusCode })
      };
    }
    
    this.log(NIVELES.ERROR, mensaje, metadata);
  }

  /**
   * Log de advertencia
   */
  warn(mensaje, metadata = {}) {
    this.log(NIVELES.WARN, mensaje, metadata);
  }

  /**
   * Log de información
   */
  info(mensaje, metadata = {}) {
    this.log(NIVELES.INFO, mensaje, metadata);
  }

  /**
   * Log de debug
   */
  debug(mensaje, metadata = {}) {
    // Solo en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      this.log(NIVELES.DEBUG, mensaje, metadata);
    }
  }

  /**
   * Log de petición HTTP
   */
  http(req, res, duracion) {
    const metadata = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duracion: `${duracion}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      usuario: req.usuario?.nombre_usuario || 'Anónimo'
    };

    const nivel = res.statusCode >= 400 ? NIVELES.ERROR : NIVELES.INFO;
    const mensaje = `${req.method} ${req.originalUrl} - ${res.statusCode}`;
    
    this.log(nivel, mensaje, metadata);
  }
}

// Exportar instancia única (singleton)
const logger = new Logger();

/**
 * Middleware para logging de requests HTTP
 */
function requestLogger(req, res, next) {
  const inicio = Date.now();
  
  // Interceptar el método end de la respuesta
  const originalEnd = res.end;
  
  res.end = function(...args) {
    const duracion = Date.now() - inicio;
    logger.http(req, res, duracion);
    originalEnd.apply(res, args);
  };
  
  next();
}

module.exports = {
  logger,
  requestLogger,
  NIVELES
};
