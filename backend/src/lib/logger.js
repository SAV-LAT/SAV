const isProd = process.env.NODE_ENV === 'production';

/**
 * Logger centralizado para controlar el volumen de logs en producción
 * y reducir el consumo de Disk I/O en Render.
 */
const logger = {
  info: (msg, ...args) => {
    if (!isProd) {
      console.log(`[INFO] ${msg}`, ...args);
    }
  },
  
  warn: (msg, ...args) => {
    // Solo mostramos advertencias importantes en producción
    console.warn(`[WARN] ${msg}`, ...args);
  },
  
  error: (msg, ...args) => {
    // Siempre mostramos errores en producción para diagnóstico
    console.error(`[ERROR] ${msg}`, ...args);
  },
  
  debug: (msg, ...args) => {
    if (!isProd) {
      console.debug(`[DEBUG] ${msg}`, ...args);
    }
  },

  // Log de auditoría que siempre se muestra pero de forma concisa
  audit: (msg, ...args) => {
    console.log(`[AUDIT] ${msg}`, ...args);
  }
};

export default logger;
