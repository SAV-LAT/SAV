import React from 'react';
import { Smartphone, DownloadCloud, AlertCircle, Apple } from 'lucide-react';
import { CONFIG } from '../config.js';

const DownloadButton = ({ platform = 'android', variant = 'default' }) => {
  const handleDownload = () => {
    if (platform === 'ios') {
      alert('📲 Instalación en iPhone:\n1. Toca el botón central de abajo (Compartir)\n2. Selecciona "Agregar a inicio"');
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && platform === 'android') {
      alert('📲 Esta es la versión para Android. Para iPhone, usa el botón de "Web App".');
      return;
    }

    // Redirección directa al APK configurado
    window.location.href = CONFIG.APK_DOWNLOAD_URL;
  };

  if (variant === 'header') {
    return (
      <button
        onClick={handleDownload}
        className={`relative flex items-center gap-2 px-3 py-2 rounded-xl shadow-xl transition-all duration-300 active:scale-95 border border-white/10 group overflow-hidden ${
          platform === 'ios' ? 'bg-white text-[#1a1f36]' : 'bg-[#1a1f36] text-white'
        }`}
      >
        <div className={`p-1 rounded-lg shadow-lg ${platform === 'ios' ? 'bg-[#1a1f36] text-white' : 'bg-emerald-500 text-white'}`}>
          {platform === 'ios' ? <Apple size={14} strokeWidth={2.5} /> : <DownloadCloud size={14} strokeWidth={2.5} />}
        </div>
        <div className="text-left">
          <p className={`text-[6px] font-black uppercase tracking-widest leading-none mb-0.5 ${platform === 'ios' ? 'text-[#1a1f36]/40' : 'text-emerald-400'}`}>
            {platform === 'ios' ? 'iPhone' : 'Android'}
          </p>
          <p className="text-[9px] font-black uppercase tracking-tight leading-none">
            {platform === 'ios' ? 'Web App' : 'Descargar'}
          </p>
        </div>
      </button>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center py-6 px-4">
      <div className="relative group w-full max-w-[280px]">
        {/* Efecto de resplandor */}
        <div className={`absolute -inset-1 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 ${
          platform === 'ios' ? 'bg-gradient-to-r from-gray-200 to-gray-400' : 'bg-gradient-to-r from-emerald-500 to-blue-600'
        }`}></div>
        
        <button
          onClick={handleDownload}
          className={`relative w-full flex items-center justify-between px-6 py-4 rounded-2xl shadow-2xl transition-all duration-300 active:scale-95 border border-white/10 group ${
            platform === 'ios' ? 'bg-white text-[#1a1f36]' : 'bg-[#1a1f36] text-white'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-xl shadow-lg transition-transform duration-500 group-hover:rotate-12 ${
              platform === 'ios' ? 'bg-[#1a1f36] text-white' : 'bg-emerald-500 text-white shadow-emerald-500/20'
            }`}>
              {platform === 'ios' ? <Apple size={24} strokeWidth={2.5} /> : <DownloadCloud size={24} strokeWidth={2.5} />}
            </div>
            <div className="text-left">
              <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${
                platform === 'ios' ? 'text-[#1a1f36]/40' : 'text-emerald-400'
              }`}>
                {platform === 'ios' ? 'Apple iOS' : 'Android App'}
              </p>
              <p className="text-sm font-black uppercase tracking-tight leading-none">
                {platform === 'ios' ? 'Instalar SAV 🍎' : 'Descargar SAV 📲'}
              </p>
            </div>
          </div>
          <Smartphone size={18} className={`transition-colors ${
            platform === 'ios' ? 'text-[#1a1f36]/20 group-hover:text-blue-500' : 'text-white/20 group-hover:text-emerald-400'
          }`} />
        </button>
      </div>
      
      <p className="mt-4 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
        <AlertCircle size={10} className={platform === 'ios' ? 'text-blue-500' : 'text-emerald-500'} />
        {platform === 'ios' ? 'Versión Web Optimizada' : 'Versión Oficial v1.0.0 (APK)'}
      </p>
    </div>
  );
};

export default DownloadButton;
