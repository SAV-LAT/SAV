import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isUpdatingRef = useRef(false);

  const logout = useCallback(() => {
    console.log('[Auth] Cerrando sesión...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastUserUpdate');
    // Limpiar estado del popup para que se vuelva a mostrar al iniciar sesión
    sessionStorage.removeItem('sav_popup_seen');
    setUser(null);
    // Usar window.location.replace para evitar que el usuario vuelva atrás a una sesión "fantasma"
    window.location.replace('/login');
  }, []);

  const getDeviceId = useCallback(() => {
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('deviceId', id);
    }
    return id;
  }, []);

  const loadUser = useCallback(async (force = false) => {
    // Evitar múltiples llamadas simultáneas usando un ref
    if (isUpdatingRef.current && !force) return;
    
    // Si no es forzado, evitar llamadas demasiado frecuentes (ej: render loops)
    const lastUpdate = localStorage.getItem('lastUserUpdate');
    const now = Date.now();
    if (!force && lastUpdate && now - parseInt(lastUpdate) < 2000) {
      return;
    }

    isUpdatingRef.current = true;
    localStorage.setItem('lastUserUpdate', now.toString());
    
    const token = localStorage.getItem('token');
    
    // Al cargar por primera vez, intentar recuperar del localStorage para evitar el flicker
    const savedUser = localStorage.getItem('user');
    if (savedUser && !user) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && typeof parsed === 'object') {
          setUser(parsed);
        }
      } catch (e) {
        localStorage.removeItem('user');
      }
    }

    if (!token) {
      setUser(null);
      localStorage.removeItem('user');
      setLoading(false);
      isUpdatingRef.current = false;
      return;
    }

    try {
      console.log(`[Auth] Solicitando /me... (Forzado: ${force})`);
      
      // Timeout de seguridad de 10 segundos para la carga del perfil
      const profilePromise = api.users.me();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT_PROFILE')), 10000)
      );

      const u = await Promise.race([profilePromise, timeoutPromise]);
      
      if (u && typeof u === 'object') {
        const newUserStr = JSON.stringify(u);
        setUser(u);
        localStorage.setItem('user', newUserStr);
        localStorage.setItem('lastUserUpdate', Date.now().toString());
      }
    } catch (err) {
      if (err.message === 'TIMEOUT_PROFILE') {
        console.warn('Timeout cargando perfil, usando datos locales temporalmente...');
        // El usuario ya está seteado desde el inicio de loadUser si existía en localStorage
      } else if (err.status === 401 || err.status === 403 || err.status === 404) {
        console.error('Sesión inválida o expirada, cerrando sesión...', err.message);
        logout();
      } else {
        console.warn('Error de red al cargar usuario, manteniendo sesión previa:', err.message);
      }
    } finally {
      setLoading(false);
      isUpdatingRef.current = false;
    }
  }, [logout, user]);

  useEffect(() => {
    // Carga inicial al montar el componente
    const init = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await loadUser(true);
      } else {
        setLoading(false);
      }
    };
    init();
    
    // Polling inteligente: cada 30s como respaldo
    const pollInterval = setInterval(async () => {
      if (localStorage.getItem('token') && document.visibilityState === 'visible') {
        await loadUser();
      }
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && localStorage.getItem('token')) {
        loadUser();
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadUser]);

  // --- IMPLEMENTACIÓN SUPABASE REALTIME UNIFICADA ---
  useEffect(() => {
    if (!user?.id) return;

    console.log(`[AuthRealtime] Suscribiendo a cambios para usuario: ${user.id}`);

    // Canal unificado para cambios en el perfil del usuario
    const userChannel = supabase
      .channel(`user_changes:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'usuarios',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[AuthRealtime] Perfil actualizado en DB:', payload.new);
          
          // Actualizamos el estado local
          setUser(prev => {
            const updated = { ...prev, ...payload.new };
            // Sincronizar con localStorage para mantener coherencia si hay fallback
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
          });
        }
      )
      .subscribe();

    // Suscribirse a cambios en 'actividad_tareas' para recargar estadísticas
    const activityChannel = supabase
      .channel(`task_activity:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'actividad_tareas',
          filter: `usuario_id=eq.${user.id}`,
        },
        () => {
          console.log('[AuthRealtime] Nueva tarea detectada, refrescando perfil...');
          loadUser(true);
        }
      )
      .subscribe();

    return () => {
      console.log('[AuthRealtime] Desconectando canales...');
      supabase.removeChannel(userChannel);
      supabase.removeChannel(activityChannel);
    };
  }, [user?.id, loadUser]);

  const login = useCallback(async (telefono, password) => {
    const deviceId = getDeviceId();
    const { user: u, token } = await api.auth.login(telefono, password, deviceId);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return u;
  }, [getDeviceId]);

  const register = useCallback(async (data) => {
    const deviceId = getDeviceId();
    const { user: u, token } = await api.auth.register({ ...data, deviceId });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return u;
  }, [getDeviceId]);

  const refreshUser = useCallback(() => loadUser(true), [loadUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/* eslint-disable-next-line react-refresh/only-export-components */
export const useAuth = () => useContext(AuthContext);
