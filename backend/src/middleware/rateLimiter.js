const rateLimitMap = new Map();

/**
 * Middleware de rate limiting ligero en memoria para proteger ráfagas de peticiones.
 * @param {number} windowMs - Tiempo de la ventana en milisegundos.
 * @param {number} max - Máximo de peticiones permitidas por IP en la ventana.
 */
export const rateLimiter = (windowMs = 60000, max = 30) => {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    
    let userRequests = rateLimitMap.get(ip) || [];
    
    // Filtrar peticiones fuera de la ventana de tiempo
    userRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
    
    if (userRequests.length >= max) {
      console.warn(`[Rate Limit] IP bloqueada temporalmente: ${ip} para ${req.url}`);
      return res.status(429).json({ 
        error: 'Demasiadas solicitudes. Por favor, espera un minuto e intenta de nuevo.' 
      });
    }
    
    userRequests.push(now);
    rateLimitMap.set(ip, userRequests);
    next();
  };
};

// Limpieza periódica del mapa para evitar fugas de memoria
setInterval(() => {
  const now = Date.now();
  for (const [ip, requests] of rateLimitMap.entries()) {
    const filtered = requests.filter(timestamp => now - timestamp < 300000); // 5 min
    if (filtered.length === 0) rateLimitMap.delete(ip);
    else rateLimitMap.set(ip, filtered);
  }
}, 300000);
