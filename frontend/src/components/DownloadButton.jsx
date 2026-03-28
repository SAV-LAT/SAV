import React, { useState } from 'react';
import { Smartphone, DownloadCloud, AlertCircle, Apple, X, MoreVertical, Share, PlusSquare } from 'lucide-react';
import { CONFIG } from '../config.js';

const DownloadButton = ({ platform = 'android', variant = 'default' }) => {
  const [showIosModal, setShowIosModal] = useState(false);

  const handleDownload = () => {
    if (platform === 'ios') {
      setShowIosModal(true);
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && platform === 'android') {
      setShowIosModal(true);
      return;
    }

    // Redirección directa al APK configurado
    window.location.href = CONFIG.APK_DOWNLOAD_URL;
  };

  if (variant === 'header') {
    return (
      <>
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
              {platform === 'ios' ? 'Instalar' : 'Descargar'}
            </p>
          </div>
        </button>
        {showIosModal && <IosInstructions onClose={() => setShowIosModal(false)} />}
      </>
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

        <h3 className="text-2xl font-black text-[#1a1f36] uppercase tracking-tighter mb-2">Instalar en iPhone</h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Sigue estos 3 pasos rápidos</p>

        <div className="space-y-4 text-left">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 group">
            <div className="w-10 h-10 rounded-xl bg-[#1a1f36] text-white flex items-center justify-center font-black shrink-0 shadow-lg">1</div>
            <div className="flex-1">
              <p className="text-[11px] font-black text-[#1a1f36] uppercase tracking-tight leading-none mb-1">Abre en Chrome/Safari</p>
              <p className="text-[10px] font-medium text-gray-500">Asegúrate de estar en esta web.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-[#1a1f36] text-white flex items-center justify-center font-black shrink-0 shadow-lg">2</div>
            <div className="flex-1">
              <p className="text-[11px] font-black text-[#1a1f36] uppercase tracking-tight leading-none mb-1">Toca los 3 puntitos</p>
              <p className="text-[10px] font-medium text-gray-500 flex items-center gap-1.5">
                Busca el menú <MoreVertical size={12} className="text-emerald-500" /> o Compartir <Share size={12} className="text-blue-500" />
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
