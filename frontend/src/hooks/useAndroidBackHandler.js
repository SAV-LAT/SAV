import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Hook para manejar el botón físico de Atrás en Android usando Capacitor.
 * Implementa la lógica de navegación paso a paso y salida controlada.
 */
export const useAndroidBackHandler = (activeTask, onCloseTask) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Solo registrar el listener si estamos en una plataforma nativa (Android/iOS)
    if (!Capacitor.isNativePlatform()) return;

    const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
      const path = location.pathname;

      console.log(`[AndroidBack] Botón presionado en ruta: ${path}`);

      // 1. Prioridad: Cerrar tarea activa si existe
      if (activeTask && onCloseTask) {
        console.log('[AndroidBack] Cerrando tarea activa...');
        onCloseTask();
        return;
      }

      // 2. Mapeo de rutas internas (Subpantallas -> Pantalla lógica anterior)
      const internalMapping = {
        '/invitar': '/equipo',
        '/seguridad': '/usuario',
        '/vincular-tarjeta': '/usuario',
        '/cambiar-contrasena': '/seguridad',
        '/cambiar-contrasena-fondo': '/seguridad',
        '/registro-facturacion': '/usuario',
        '/retiro': '/usuario',
        '/recargar': '/usuario',
        '/tareas': '/', // Si existe una sala de tareas independiente
      };

      if (internalMapping[path]) {
        console.log(`[AndroidBack] Redirigiendo de ${path} a ${internalMapping[path]}`);
        navigate(internalMapping[path]);
        return;
      }

      // 3. Pestañas principales del menú inferior (Cualquiera -> Inicio)
      const mainTabs = ['/equipo', '/vip', '/ganancias', '/usuario'];
      if (mainTabs.includes(path)) {
        console.log(`[AndroidBack] Pestaña principal detectada. Volviendo a Inicio.`);
        navigate('/', { replace: true });
        return;
      }

      // 4. Pantalla de Inicio (Inicio -> Salir de la App)
      if (path === '/' || path === '/admin') {
        console.log('[AndroidBack] En Inicio. Saliendo de la aplicación...');
        App.exitApp();
        return;
      }

      // 5. Comportamiento por defecto: Intentar volver atrás en el historial
      if (canGoBack) {
        console.log('[AndroidBack] Usando historial de navegación...');
        window.history.back();
      } else {
        // Fallback final: si no hay historial, volver al inicio
        console.log('[AndroidBack] Sin historial. Forzando Inicio.');
        navigate('/', { replace: true });
      }
    });

    return () => {
      console.log('[AndroidBack] Limpiando listener...');
      backButtonListener.then(l => l.remove());
    };
  }, [location.pathname, activeTask, onCloseTask, navigate]);
};
