import React from 'react';
import { Smartphone, DownloadCloud, AlertCircle } from 'lucide-react';

const DownloadButton = () => {
  const APK_URL = 'https://github.com/SAV-LAT/SAV/releases/download/v1.0.0/app-release.apk';

  const handleDownload = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
      alert('📲 La aplicación nativa está disponible actualmente solo para Android. Para iPhone, por favor usa la versión Web (PWA).');
      return;
    }

    // Redirección directa al APK en GitHub
    window.location.href = APK_URL;
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-6 px-4">
      <div className="relative group w-full max-w-[280px]">
        {/* Efecto de resplandor tipo Play Store */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        
        <button
          onClick={handleDownload}
          className="relative w-full bg-[#1a1f36] hover:bg-[#242a45] text-white flex items-center justify-between px-6 py-4 rounded-2xl shadow-2xl transition-all duration-300 active:scale-95 border border-white/10 group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20 group-hover:rotate-12 transition-transform duration-500">
              <DownloadCloud size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Android App</p>
              <p className="text-sm font-black text-white uppercase tracking-tight leading-none">Descargar SAV 📲</p>
            </div>
          </div>
          <Smartphone size={18} className="text-white/20 group-hover:text-emerald-400 transition-colors" />
        </button>
      </div>
      
      <p className="mt-4 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
        <AlertCircle size={10} className="text-emerald-500" />
        Versión Oficial v1.0.0 (APK)
      </p>
    </div>
  );
};

export default DownloadButton;
