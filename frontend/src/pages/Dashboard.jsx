import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import DownloadButton from '../components/DownloadButton.jsx';
import { api } from '../lib/api.js';
import { supabase } from '../lib/supabase.js';
import { CONFIG } from '../config.js';
import { 
  ClipboardList, TrendingUp, Bell, HandCoins, 
  Wallet, Users, Gift, UserPlus, 
  ChevronRight, Info, ShieldCheck, DownloadCloud,
  Sparkles, Trophy, Play
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import FloatingQuestionnaire from '../components/FloatingQuestionnaire.jsx';

const gridItems = [
  { to: '/vip', icon: TrendingUp, label: 'Fondo Riqueza', color: 'text-amber-500', bg: 'bg-amber-50' },
  { to: '/tareas', icon: ClipboardList, label: 'Tareas', color: 'text-blue-500', bg: 'bg-blue-50' },
  { to: '/noticias-conferencia', icon: Bell, label: 'Noticias', color: 'text-purple-500', bg: 'bg-purple-50' },
  { to: '/equipo', icon: Users, label: 'Mi Equipo', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { to: '/invitar', icon: UserPlus, label: 'Invitar', color: 'text-rose-500', bg: 'bg-rose-50' },
  { to: '/recompensas', icon: Gift, label: 'Premios', color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

const defaultBanners = [
  { id: 1, imagen_url: '/imag/carrusel1.jpeg', titulo: 'SAV Global' },
  { id: 2, imagen_url: '/imag/carrusel2.jpeg', titulo: 'Activos Virtuales' },
  { id: 3, imagen_url: '/imag/banner_sav_3.jpeg', titulo: 'Libertad Financiera' },
];

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [banners, setBanners] = useState([]);
  const [slide, setSlide] = useState(0);
  const [stats, setStats] = useState(null);
  const [guideText, setGuideText] = useState('BIENVENIDO A SAV. TU FUTURO FINANCIERO COMIENZA AQUÍ. ALCANZA TUS METAS.');
  // Force redeploy trigger
  const [triggerUpdate, setTriggerUpdate] = useState(Date.now());
  const [popup, setPopup] = useState({ popup_enabled: false, popup_title: '', popup_message: '' });
  const [showPopup, setShowPopup] = useState(false);
  const [publicConfig, setPublicConfig] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const fetchStats = () => {
      api.users.stats()
        .then(data => {
          if (isMounted) setStats(data);
        })
        .catch((err) => {
          console.error('Error fetching stats:', err);
        });
    };

    // fetchStats(); // Eliminado duplicado

    // Polling de respaldo para estadísticas cada 45 segundos (antes 20s, solo si es visible)
    const statsInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchStats();
      }
    }, 45000);
    
    const fetchBanners = () => {
      api.banners()
        .then(data => {
          if (isMounted) {
            if (Array.isArray(data) && data.length > 0) {
              setBanners(data);
            } else {
              setBanners(defaultBanners);
            }
          }
        })
        .catch(() => {
          if (isMounted) setBanners(defaultBanners);
        });
    };

    const fetchPublicConfig = () => {
      api.publicContent()
        .then((data) => {
          if (!isMounted || !data) return;
          setPublicConfig(data);
          setGuideText(g => data.home_guide || g);
          setPopup(data);
          
          const hasSeenPopup = sessionStorage.getItem('sav_popup_seen');
          if (data.popup_enabled && !hasSeenPopup) {
            setShowPopup(true);
            sessionStorage.setItem('sav_popup_seen', 'true');
          }
        })
        .catch(() => {});
    };

    fetchBanners();
    fetchPublicConfig();
    fetchStats(); // Recuperado para carga inicial, la deduplicación en api.js evita exceso

    // --- SINCRONIZACIÓN REALTIME MEJORADA ---
    // 1. Cambios globales del Admin
    const adminChannel = supabase.channel('admin_global_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => {
        console.log('[Realtime] Banners actualizados por admin');
        fetchBanners();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'public_content' }, () => {
        console.log('[Realtime] Configuración pública actualizada por admin');
        fetchPublicConfig();
      })
      .subscribe();

    // 2. Cambios específicos del Usuario (Saldo y Ganancias)
    let userChannel = null;
    if (user?.id) {
      userChannel = supabase.channel(`user_sync_${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'usuarios', 
          filter: `id=eq.${user.id}` 
        }, (payload) => {
          console.log('[Realtime] Datos de usuario actualizados:', payload.new);
          refreshUser(); // Actualiza el contexto global (Activos, Comisión)
          fetchStats(); // Actualiza las estadísticas (Hoy, Semana, Mes)
        })
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'movimientos_saldo', 
          filter: `usuario_id=eq.${user.id}` 
        }, () => {
          console.log('[Realtime] Nuevo movimiento detectado. Refrescando estadísticas...');
          fetchStats();
        })
        .subscribe();
    }

    return () => {
      clearInterval(statsInterval);
      supabase.removeChannel(adminChannel);
      if (userChannel) supabase.removeChannel(userChannel);
    };
  }, [isMounted, user?.id]);

  useEffect(() => {
    if (!isMounted || banners.length <= 1) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [isMounted, banners.length]);

  const imgUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('/')) return url;
    return url;
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#1a1f36] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Layout>
      <FloatingQuestionnaire />
      {/* Header Premium White & Navy */}
      <header className="bg-gradient-to-r from-[#1a1f36] to-[#2a2f46] px-5 py-4 flex items-center justify-between sticky top-0 z-30 border-b border-white/10 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 group cursor-pointer active:scale-95 transition-all">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-11 h-11 rounded-[1.2rem] overflow-hidden shadow-2xl border border-white/20 p-1 bg-white/5 backdrop-blur-xl relative z-10 transition-all duration-500 group-hover:scale-105 group-hover:rotate-3">
              <img src="/imag/logo-carrusel.png" alt="SAV" className="w-full h-full object-contain rounded-lg" />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xl font-black tracking-tighter text-white leading-none drop-shadow-md">SAV</span>
            <span className="text-[7px] font-black tracking-[0.4em] text-white/30 uppercase mt-0.5 ml-0.5">Platform</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botones de Descarga en el Header */}
          <DownloadButton variant="header" />
          
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20 shadow-inner backdrop-blur-md">
            <span className="text-sm">🇧🇴</span>
            <span className="text-[11px] font-black text-white uppercase tracking-widest">BOB</span>
          </div>
        </div>
      </header>

      <div className="bg-gray-50/50 min-h-screen pb-24 relative overflow-hidden">
        {/* Sección de Descarga Inteligente SAV (Removido de aquí y movido al Header) */}

        {/* Elementos decorativos de fondo */}
        <div className="absolute top-20 -left-20 w-64 h-64 bg-[#1a1f36]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-40 -right-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Section: Banner Impactante */}
        <div className="px-4 pt-6">
          <div className="relative h-60 bg-[#1a1f36] overflow-hidden rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(26,31,54,0.3)] group border border-white/10">
            {/* Badge de Nivel Flotante */}
            <div className="absolute top-5 left-5 z-20 flex flex-col gap-2">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 shadow-lg">
                <div className="w-2.5 h-2.5 bg-[#00C853] rounded-full shadow-[0_0_10px_#00C853] animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                  {user?.nivel_codigo === 'internar' ? 'PASANTE' : user?.nivel_codigo || 'USUARIO'}
                </span>
              </div>
            </div>

            {Array.isArray(banners) && banners.length > 0 ? (
              <img
                src={imgUrl(banners[slide]?.imagen_url)}
                alt=""
                className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110 opacity-80"
                onError={(e) => {
                  e.target.src = '/imag/carrusel1.jpeg';
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-[#1a1f36] to-[#2a2f46]">
                <Logo variant="hero" className="opacity-10 scale-150" />
              </div>
            )}
            
            {/* Overlay Gradient Profundo */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1f36] via-[#1a1f36]/20 to-transparent pointer-events-none" />
            
            {/* Texto decorativo en el Banner - Más pequeño y sutil para no tapar logos */}
            <div className="absolute bottom-12 left-8 right-8 z-10 text-center pointer-events-none">
              <div className="inline-block px-4 py-2 rounded-2xl bg-[#1a1f36]/40 backdrop-blur-md border border-white/10 shadow-lg transform group-hover:scale-105 transition-transform duration-700">
                <h2 className="text-white text-[11px] font-black leading-tight uppercase tracking-[0.2em] drop-shadow-md">
                  Multiplica tus <span className="text-white underline decoration-1 underline-offset-2 decoration-white/30">Activos</span> con SAV
                </h2>
              </div>
            </div>

            {/* Indicadores */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
              {Array.isArray(banners) && banners.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx === slide ? 'w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'w-1.5 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Acciones Rápidas (Destacadas con Glow) */}
        <div className="px-4 mt-8 grid grid-cols-2 gap-4">
          <Link
            to="/recargar"
            className="relative flex items-center justify-between p-6 rounded-[2rem] bg-[#1a1f36] border border-white/10 shadow-[0_15px_35px_-5px_rgba(26,31,54,0.4)] active:scale-95 transition-all group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="flex flex-col gap-1 relative z-10">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Inversión</span>
              <span className="text-sm font-black text-white tracking-widest">RECARGAR</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10 group-hover:bg-white group-hover:text-[#1a1f36] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-500 relative z-10">
              <Wallet size={24} strokeWidth={2.5} />
            </div>
          </Link>
          <Link
            to="/retiro"
            className="relative flex items-center justify-between p-6 rounded-[2rem] bg-white border border-gray-100 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.08)] active:scale-95 transition-all group overflow-hidden"
          >
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#1a1f36]/5 rounded-full -ml-12 -mb-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="flex flex-col gap-1 relative z-10">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Retiros</span>
              <span className="text-sm font-black text-[#1a1f36] tracking-widest">COBRAR</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#1a1f36]/5 flex items-center justify-center text-[#1a1f36] border border-gray-100 group-hover:bg-[#1a1f36] group-hover:text-white group-hover:shadow-[0_10px_20px_rgba(26,31,54,0.2)] transition-all duration-500 relative z-10">
              <HandCoins size={24} strokeWidth={2.5} />
            </div>
          </Link>
        </div>

        {/* Grid de Servicios Principal (Premium Icons) */}
        <div className="px-4 mt-8">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-8 px-1">
              <div className="w-1.5 bg-[#1a1f36] h-5 rounded-full shadow-[0_0_10px_#1a1f36]" />
              <h3 className="text-xs font-black text-[#1a1f36] uppercase tracking-[0.25em]">Servicios Premium</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-y-10 gap-x-4">
              {gridItems.map((item) => {
                const { to, icon: GridIcon, label } = item;
                if (to === '/usuario' && user?.nivel_codigo === 'internar') return null;
                return (
                  <Link
                    key={label}
                    to={to}
                    className="flex flex-col items-center gap-3 active:scale-90 transition-all group"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#1a1f36]/20 rounded-2xl blur-lg scale-0 group-hover:scale-150 transition-transform duration-500" />
                      <div className="w-16 h-16 rounded-2xl bg-white text-[#1a1f36] flex items-center justify-center shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] border border-gray-100 group-hover:bg-[#1a1f36] group-hover:text-white group-hover:shadow-[0_15px_30px_-5px_rgba(26,31,54,0.3)] group-hover:border-[#1a1f36] transition-all duration-300 relative z-10">
                        <GridIcon size={28} strokeWidth={1.5} />
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-gray-400 text-center leading-tight uppercase tracking-widest group-hover:text-[#1a1f36] transition-colors">
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Noticia / Guía Estilo Marquee (Vibrant) */}
        <div className="px-4 mt-8">
          <div className="bg-gradient-to-r from-[#1a1f36] to-[#2a2f46] rounded-2xl p-4 shadow-2xl relative overflow-hidden flex items-center gap-4 border border-white/10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <Bell className="text-white" size={20} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black text-white/90 leading-snug whitespace-nowrap animate-marquee uppercase tracking-[0.2em]">
                {guideText} • {guideText}
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action: Upgrade VIP (Impactful) */}
        <div className="px-4 mt-8">
          <Link
            to="/vip"
            className="group relative w-full h-20 rounded-[1.5rem] bg-[#1a1f36] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(26,31,54,0.4)] active:scale-[0.98] transition-all overflow-hidden border border-white/10"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-[1500ms]" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <ShieldCheck className="text-white" size={24} />
              </div>
              <span className="text-sm font-black text-white uppercase tracking-[0.3em]">Mejorar Nivel VIP <span className="ml-2 group-hover:translate-x-2 transition-transform inline-block">→</span></span>
            </div>
          </Link>
        </div>

        {/* Footer Info sutil */}
        <div className="mt-12 pb-12 px-8 text-center">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
            SAV • Sistema de Activos Virtuales
          </p>
          <p className="text-[8px] text-gray-400 mt-1 opacity-40">
            © 2026 Todos los derechos reservados
          </p>
        </div>
      </div>

      {/* Popup de Aviso Dark */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] bg-[#1a1f36]/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] border border-gray-100 animate-scale-in">
            {/* Header del Popup */}
            <div className="pt-8 px-8 pb-4 text-center shrink-0">
              <div className="w-16 h-16 bg-[#1a1f36]/5 text-[#1a1f36] rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-inner">
                <Info size={32} />
              </div>
              <h3 className="text-xl font-black text-[#1a1f36] uppercase tracking-tighter leading-tight">
                {popup.popup_title || 'Aviso del Sistema'}
              </h3>
            </div>

            {/* Contenido con Scroll si es necesario */}
            <div className="px-8 py-2 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              <p className="text-sm text-gray-500 font-medium leading-relaxed text-center">
                {popup.popup_message || 'Bienvenido a la plataforma. Revisa tus tareas diarias.'}
              </p>
            </div>

            {/* Botón de acción fijo al final */}
            <div className="p-8 pt-4 shrink-0">
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="w-full py-5 rounded-2xl bg-[#1a1f36] text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-indigo-900/20 active:scale-95 transition-all whitespace-normal leading-relaxed"
              >
                ¡Entendido, Continuar!
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

