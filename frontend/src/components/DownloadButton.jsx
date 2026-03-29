import React, { useState, useEffect } from 'react';
import { Smartphone, DownloadCloud, AlertCircle, Apple, X, MoreVertical, Share, PlusSquare, Globe, ExternalLink } from 'lucide-react';
import { CONFIG } from '../config.js';

const DownloadButton = ({ variant = 'default' }) => {
  const [showIosModal, setShowIosModal] = useState(false);
  const [device, setDevice] = useState('unknown');
  const [isInstalled, setIsInstalled] = useState(() => {
    // Intento de detección síncrona inicial
    if (typeof window === 'undefined') return false;
    const isStandalone = window.navigator?.standalone || window.matchMedia?.('(display-mode: standalone)').matches;
    const isNative = window.Capacitor?.isNativePlatform?.() || false;
    return isStandalone || isNative;
  });

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(ua);
    const isIos = /iphone|ipad|ipod/.test(ua);
    
    // Re-verificar en useEffect por si Capacitor se carga después
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    const isNative = window.Capacitor?.isNativePlatform?.() || false;

    if (isAndroid) {
      setDevice('android');
    } else if (isIos) {
      setDevice('ios');
    } else {
      setDevice('desktop');
    }

    setIsInstalled(isStandalone || isNative);
  }, []);

  // Si la aplicación ya está instalada o es nativa, no mostramos los botones de descarga
  if (isInstalled) return null;

  const handleAndroidDownload = () => {
    // Usar la URL centralizada desde config.js
    window.location.href = CONFIG.APK_DOWNLOAD_URL;
  };

  const handleIosAction = () => {
    setShowIosModal(true);
  };

  const handleWebAction = () => {
    window.location.href = CONFIG.WEB_URL;
  };

  // Renderizado para el Header (Botón compacto)
  if (variant === 'header') {
    return (
      <>
        <div className="flex items-center gap-1.5">
          {/* Botón para Android/Desktop */}
          {(device === 'android' || device === 'desktop') && (
            <button
              onClick={handleAndroidDownload}
              title="Descargar App Android"
              className="w-9 h-9 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all active:scale-90 shadow-lg shadow-emerald-500/20 group"
            >
              <DownloadCloud size={18} className="group-hover:animate-bounce" />
            </button>
          )}

          {/* Botón para iOS/Desktop */}
          {(device === 'ios' || device === 'desktop') && (
            <button
              onClick={device === 'ios' ? handleIosAction : handleWebAction}
              title={device === 'ios' ? 'Instalar en iPhone' : 'Versión Web'}
              className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all active:scale-90 shadow-lg group"
            >
              {device === 'ios' ? <Apple size={18} /> : <Globe size={18} />}
            </button>
          )}
        </div>
        {showIosModal && <IosInstructions onClose={() => setShowIosModal(false)} />}
      </>
    );
  }

  // Renderizado Inteligente para el Dashboard (Parte Superior)
  if (variant === 'intelligent') {
    return (
      <div className="w-full px-4 pt-4 pb-2">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl overflow-hidden relative group">
          {/* Fondo decorativo sutil */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-all duration-700" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-tr from-[#1a1f36] to-[#2a2f46] rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
                {device === 'ios' ? (
                  <Apple className="text-white" size={24} />
                ) : (
                  <DownloadCloud className="text-emerald-400" size={24} />
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">
                  {device === 'android' ? 'App Oficial para Android' : device === 'ios' ? 'Versión Web para iPhone' : 'Descarga nuestra App'}
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">
                  {device === 'android' ? `Versión ${CONFIG.APP_VERSION} Estable` : device === 'ios' ? 'Instalación PWA Optimizada' : 'Acceso Multiplataforma'}
                </p>
                {device === 'ios' && (
                  <p className="text-[8px] font-bold text-emerald-500/80 uppercase tracking-wider mt-1.5 flex items-center gap-1">
                    <AlertCircle size={10} /> APK solo compatible con Android
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Lógica de botones según dispositivo */}
              {(device === 'android' || device === 'desktop') && (
                <button
                  onClick={handleAndroidDownload}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20 group/btn"
                >
                  <DownloadCloud size={16} className="group-hover/btn:animate-bounce" />
                  Descargar para Android
                </button>
              )}

              {(device === 'ios' || device === 'desktop') && (
                <button
                  onClick={device === 'ios' ? handleIosAction : handleWebAction}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-[#1a1f36] rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg group/btn"
                >
                  {device === 'ios' ? <Apple size={16} /> : <Globe size={16} />}
                  {device === 'ios' ? 'Abrir en Navegador' : 'Versión Web'}
                </button>
              )}
            </div>
          </div>
        </div>
        {showIosModal && <IosInstructions onClose={() => setShowIosModal(false)} />}
      </div>
    );
  }

  // Mantener compatibilidad con otras variantes si existen
  return (
    <div className="w-full flex flex-col items-center justify-center py-6 px-4">
      {/* Botón Simple (Inteligente por defecto) */}
      <div className="relative group w-full max-w-[280px]">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <button
          onClick={device === 'ios' ? handleIosAction : handleAndroidDownload}
          className="relative w-full flex items-center justify-between px-6 py-4 rounded-2xl shadow-2xl transition-all duration-300 active:scale-95 border border-white/10 group bg-[#1a1f36] text-white"
        >
          <div className="flex items-center gap-4">
            <div className={`${device === 'ios' ? 'bg-blue-500' : 'bg-emerald-500'} p-2 rounded-xl shadow-lg transition-transform duration-500 group-hover:rotate-12`}>
              {device === 'ios' ? <Apple size={24} className="text-white" strokeWidth={2.5} /> : <DownloadCloud size={24} className="text-white" strokeWidth={2.5} />}
            </div>
            <div className="text-left">
              <p className={`text-[10px] font-black ${device === 'ios' ? 'text-blue-400' : 'text-emerald-400'} uppercase tracking-widest leading-none mb-1`}>
                {device === 'ios' ? 'iOS Web App' : 'Android App'}
              </p>
              <p className="text-sm font-black text-white uppercase tracking-tight leading-none">
                {device === 'ios' ? 'Usar Versión Web' : 'Descargar SAV 📲'}
              </p>
            </div>
          </div>
          {device === 'ios' ? <ExternalLink size={18} className="text-white/20 group-hover:text-blue-400 transition-colors" /> : <Smartphone size={18} className="text-white/20 group-hover:text-emerald-400 transition-colors" />}
        </button>
      </div>
      {showIosModal && <IosInstructions onClose={() => setShowIosModal(false)} />}
    </div>
  );
};

const IosInstructions = ({ onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a0c1a]/90 backdrop-blur-md animate-fade-in">
    <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in relative">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
      >
        <X size={20} />
      </button>

      <div className="p-8 pt-12 text-center">
        <div className="w-20 h-20 bg-[#1a1f36] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-gray-50">
          <Apple size={40} className="text-white" strokeWidth={2.5} />
        </div>

        <h3 className="text-2xl font-black text-[#1a1f36] uppercase tracking-tighter mb-2">Usar Versión Web</h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Instala SAV en tu iPhone en 3 pasos</p>

        <div className="space-y-4 text-left">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 group">
            <div className="w-10 h-10 rounded-xl bg-[#1a1f36] text-white flex items-center justify-center font-black shrink-0 shadow-lg">1</div>
            <div className="flex-1">
              <p className="text-[11px] font-black text-[#1a1f36] uppercase tracking-tight leading-none mb-1">Abre en Safari</p>
              <p className="text-[10px] font-medium text-gray-500">Asegúrate de estar usando Safari.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-[#1a1f36] text-white flex items-center justify-center font-black shrink-0 shadow-lg">2</div>
            <div className="flex-1">
              <p className="text-[11px] font-black text-[#1a1f36] uppercase tracking-tight leading-none mb-1">Toca Compartir</p>
              <p className="text-[10px] font-medium text-gray-500 flex items-center gap-1.5">
                Busca el icono de compartir <Share size={12} className="text-blue-500" /> en la barra inferior.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 border-dashed">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shrink-0 shadow-lg animate-pulse">3</div>
            <div className="flex-1">
              <p className="text-[11px] font-black text-emerald-700 uppercase tracking-tight leading-none mb-1">Agregar a inicio</p>
              <p className="text-[10px] font-bold text-emerald-600/70 flex items-center gap-1.5">
                Selecciona "Agregar a pantalla de inicio" <PlusSquare size={12} />
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 py-4 rounded-2xl bg-[#1a1f36] text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-xl active:scale-95 transition-all hover:bg-[#242a45]"
        >
          ¡Entendido, vamos!
        </button>
      </div>
    </div>
  </div>
);

export default DownloadButton;
