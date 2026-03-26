import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// --- MECANISMO DE LIMPIEZA NUCLEAR v4.0.1 ---
// Fuerza la eliminación de cualquier caché antigua detectada
const APP_VERSION = '4.0.1';
const currentVersion = localStorage.getItem('sav_app_version');

if (currentVersion !== APP_VERSION) {
  console.log('[SAV] Nueva versión detectada. Limpiando caché...');
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister();
      }
    });
  }
  caches.keys().then(names => {
    for (let name of names) caches.delete(name);
  });
  localStorage.setItem('sav_app_version', APP_VERSION);
  // No recargamos aquí para evitar bucles, pero el próximo F5 será limpio
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Capturar el evento de instalación globalmente para usarlo en cualquier momento
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
});
