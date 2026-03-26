// Forzar la URL de la API de Render si no está definida en el entorno
const VITE_API_URL = import.meta.env.VITE_API_URL || 'https://sav-proyecto.onrender.com/api';
const API = VITE_API_URL;

function getToken() {
  return localStorage.getItem('token');
}

async function request(url, options = {}, retries = 3) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  const finalUrl = API + normalizedUrl;

  try {
    const controller = new AbortController();
    // Aumentamos a 120s para dar margen a los cold starts de Render
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const res = await fetch(finalUrl, { 
      ...options, 
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    // 304 Not Modified es un éxito (usando caché del navegador)
    if (res.status === 304) {
      console.log(`[API Cache] 304 Not Modified para ${url}. Recuperando de local...`);
      const cachedUser = localStorage.getItem('user');
      return cachedUser ? JSON.parse(cachedUser) : {};
    }

    if (!res.ok) {
      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        // No hay JSON en la respuesta, lo ignoramos
      }
      
      console.error(`[API Error] ${res.status} ${finalUrl}`, data);
      
      if (res.status === 401) {
        const isAuthRoute = normalizedUrl.includes('/auth/');
        if (!isAuthRoute) {
          console.warn('Sesión expirada o inválida. Limpiando credenciales...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      const error = new Error(data.error || `Error ${res.status}: ${res.statusText}`);
      error.status = res.status;
      throw error;
    }

    return await res.json().catch(() => ({}));
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`[API Timeout] La petición a ${url} tardó más de 60 segundos y fue cancelada.`);
      // No reintentar en caso de timeout, es probable que el servidor esté caído o saturado
      throw new Error('El servidor está tardando demasiado en responder. Por favor, intenta de nuevo más tarde.');
    }

    // No reintentar en errores de cliente (4xx)
    if (err.status >= 400 && err.status < 500) {
      throw err;
    }

    if (retries > 0) {
      const delay = 2000 * (4 - retries); // Delay incremental: 2s, 4s, 6s
      console.warn(`Error en ${url}, reintentando en ${delay}ms... (${retries} restantes)`, err.message);
      await new Promise(resolve => setTimeout(resolve, delay));
      return request(url, options, retries - 1);
    }
    
    throw err;
  }
}

export const api = {
  version: '1.6.3',
  // Helper para obtener la URL completa de medios (videos/imágenes)
  getMediaUrl: (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    // Usamos el dominio de Render para los archivos estáticos
    const renderUrl = 'https://sav-proyecto.onrender.com';
    return renderUrl + normalizedPath;
  },
  post: (url, data) => request(url, { method: 'POST', body: JSON.stringify(data) }),
  auth: {
    login: (telefono, password, deviceId) => request('/auth/login', { method: 'POST', body: JSON.stringify({ telefono, password, deviceId }) }),
    register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  },
  users: {
    me: () => request('/users/me'),
    update: (data) => request('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
    stats: () => request('/users/stats'),
    team: () => request('/users/team'),
    tarjetas: () => request('/users/tarjetas'),
    addTarjeta: (data) => request('/users/tarjetas', { method: 'POST', body: JSON.stringify(data) }),
    deleteTarjeta: (id) => request(`/users/tarjetas/${id}`, { method: 'DELETE' }),
    notificaciones: () => request('/users/notificaciones'),
    changePassword: (data) => request('/users/change-password', { method: 'POST', body: JSON.stringify(data) }),
    changeFundPassword: (data) => request('/users/change-fund-password', { method: 'POST', body: JSON.stringify(data) }),
  },
  tasks: {
    list: () => request('/tasks'),
  },
  levels: {
    list: () => request('/levels'),
    ganancias: () => request('/levels/ganancias'),
  },
  recharges: {
    metodos: () => request('/recharges/metodos'),
    list: () => request('/recharges'),
    create: (data) => request('/recharges', { method: 'POST', body: JSON.stringify(data) }),
  },
  withdrawals: {
    montos: () => request('/withdrawals/montos'),
    list: () => request('/withdrawals'),
    create: (data) => request('/withdrawals', { method: 'POST', body: JSON.stringify(data) }),
  },
  banners: () => request('/banners'),
  publicContent: () => request('/public-content'),
  sorteo: {
    config: () => request('/sorteo/config'),
    premios: () => request('/sorteo/premios'),
    historial: () => request('/sorteo/historial'),
    girar: () => request('/sorteo/girar', { method: 'POST' }),
  },
  admin: {
    dashboard: () => request('/admin/dashboard'),
    usuarios: () => request('/admin/usuarios'),
    updateUsuario: (id, updates) => request(`/admin/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
    changePassword: (id, data) => request(`/admin/usuarios/${id}/password`, { method: 'POST', body: JSON.stringify(data) }),
    recargas: () => request('/admin/recargas'),
    retiros: () => request('/admin/retiros'),
    banners: () => request('/admin/banners'),
    crearBanner: (data) => request('/admin/banners', { method: 'POST', body: JSON.stringify(data) }),
    eliminarBanner: (id) => request(`/admin/banners/${id}`, { method: 'DELETE' }),
    niveles: () => request('/admin/niveles'),
    updateNivel: (id, data) => request(`/admin/niveles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    tareas: () => request('/admin/tareas'),
    crearTarea: (data) => request('/admin/tareas', { method: 'POST', body: JSON.stringify(data) }),
    actualizarTarea: (id, data) => request(`/admin/tareas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    eliminarTarea: (id) => request(`/admin/tareas/${id}`, { method: 'DELETE' }),
    aprobarRecarga: (id) => request(`/admin/recargas/${id}/aprobar`, { method: 'POST' }),
    rechazarRecarga: (id, motivo) => request(`/admin/recargas/${id}/rechazar`, { method: 'POST', body: JSON.stringify({ motivo }) }),
    aprobarRetiro: (id) => request(`/admin/retiros/${id}/aprobar`, { method: 'POST' }),
    rechazarRetiro: (id, motivo) => request(`/admin/retiros/${id}/rechazar`, { method: 'POST', body: JSON.stringify({ motivo }) }),
    metodosQr: () => request('/admin/metodos-qr'),
    crearMetodoQr: (data) => request('/admin/metodos-qr', { method: 'POST', body: JSON.stringify(data) }),
    actualizarMetodoQr: (id, data) => request(`/admin/metodos-qr/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    eliminarMetodoQr: (id) => request(`/admin/metodos-qr/${id}`, { method: 'DELETE' }),
    premiosRuleta: () => request('/admin/premios-ruleta'),
    crearPremioRuleta: (data) => request('/admin/premios-ruleta', { method: 'POST', body: JSON.stringify(data) }),
    actualizarPremioRuleta: (id, data) => request(`/admin/premios-ruleta/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    eliminarPremioRuleta: (id) => request(`/admin/premios-ruleta/${id}`, { method: 'DELETE' }),
    regalarTickets: (data) => request('/admin/regalar-tickets', { method: 'POST', body: JSON.stringify(data) }),
    publicContent: () => request('/admin/public-content'),
    updatePublicContent: (data) => request('/admin/public-content', { method: 'PUT', body: JSON.stringify(data) }),
  },
};
