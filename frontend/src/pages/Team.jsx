import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import Header from '../components/Header.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Users, TrendingUp, UserPlus, ShieldAlert, ChevronRight, PieChart, Info, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Team() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user?.nivel_codigo !== 'internar') {
      api.users.team().then(setData).catch(() => setData(null));
    }
  }, [user]);

  const handleCopy = () => {
    if (!user?.codigo_invitacion) return;
    navigator.clipboard.writeText(user.codigo_invitacion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (user?.nivel_codigo === 'internar') {
    return (
      <Layout>
        <Header title="Informe del equipo" />
        <div className="p-8 text-center space-y-6 flex flex-col items-center justify-center min-h-[70vh] bg-white">
          <div className="w-24 h-24 bg-gray-50 text-[#1a1f36] rounded-[2.5rem] flex items-center justify-center shadow-xl border border-gray-100 animate-bounce">
            <ShieldAlert size={48} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#1a1f36] uppercase tracking-tighter">Función Bloqueada</h2>
            <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-xs mx-auto">
              Como <span className="text-[#1a1f36] font-bold uppercase tracking-widest">Pasante</span>, aún no puedes invitar a otras personas.
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-left">
            <p className="text-xs text-[#1a1f36] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Info size={14} /> Requisito:
            </p>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Sube a nivel <span className="text-[#1a1f36] font-bold">S1</span> o superior para desbloquear el sistema de referidos y empezar a ganar comisiones por cada tarea de tu equipo.
            </p>
          </div>
          <Link 
            to="/vip"
            className="w-full py-5 rounded-[2rem] bg-[#1a1f36] text-white font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
          >
            Subir de Nivel Ahora
          </Link>
        </div>
      </Layout>
    );
  }

  const resumen = data?.resumen || {};
  const niveles = data?.niveles || [];

  return (
    <Layout>
      <Header title="Mi Equipo" />
      <div className="p-5 space-y-8 pb-24 bg-gray-50/30 min-h-screen relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-20 -left-20 w-64 h-64 bg-[#1a1f36]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-40 -right-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Banner de Invitación Rápida con Estilo Premium */}
        <div className="bg-gradient-to-br from-[#1a1f36] to-[#2a2f46] rounded-[2.5rem] p-10 text-white shadow-[0_20px_50px_-15px_rgba(26,31,54,0.4)] relative overflow-hidden group border border-white/10">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -ml-16 -mb-16 blur-2xl" />
          
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-md animate-pulse" />
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border-2 border-white/30 shadow-2xl relative z-10">
                  <UserPlus className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" size={32} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">Crecimiento de Red</p>
                <h3 className="text-2xl font-black tracking-tighter uppercase drop-shadow-lg">Gana Comisiones</h3>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 flex items-center justify-between shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] backdrop-blur-xl group/code transition-all hover:bg-white/15">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-0.5">Código Único</span>
                  <span className="text-lg font-black text-white tracking-[0.2em]">
                    {user?.nivel_codigo === 'internar' ? '**********' : (user?.codigo_invitacion || '---')}
                  </span>
                </div>
                <button 
                  onClick={handleCopy} 
                  disabled={user?.nivel_codigo === 'internar'}
                  className="p-3 hover:bg-white/20 rounded-xl transition-all disabled:opacity-30 active:scale-90"
                >
                  {copied ? <Check size={20} className="text-[#00C853]" /> : <Copy size={20} className="text-white/60" />}
                </button>
              </div>
              <Link to="/invitar" className="p-5 rounded-2xl bg-white text-[#1a1f36] active:scale-90 transition-all shadow-[0_10px_25px_rgba(255,255,255,0.3)] hover:shadow-[0_15px_30px_rgba(255,255,255,0.4)]">
                <ChevronRight size={28} strokeWidth={3} />
              </Link>
            </div>
          </div>
        </div>

        {/* Estadísticas de Ingresos de Equipo con Glow */}
        <div className="grid grid-cols-2 gap-5 relative z-10">
          <div className="p-7 rounded-[2.5rem] bg-white border border-gray-100 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.05)] group hover:border-[#1a1f36]/20 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gray-50 rounded-full -mr-8 -mt-8 blur-xl pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-[#1a1f36]/5 flex items-center justify-center text-[#1a1f36] mb-5 border border-[#1a1f36]/10 shadow-inner group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Ganancia Total</p>
            <p className="text-2xl font-black text-[#1a1f36] tracking-tight">{(resumen.ingresos_totales || 0).toFixed(2)} <span className="text-xs text-gray-400 font-bold ml-1">BOB</span></p>
          </div>
          <div className="p-7 rounded-[2.5rem] bg-white border border-gray-100 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.05)] group hover:border-[#00C853]/20 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#00C853]/5 rounded-full -mr-8 -mt-8 blur-xl pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-[#00C853]/5 flex items-center justify-center text-[#00C853] mb-5 border border-[#00C853]/10 shadow-inner group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Miembros</p>
            <p className="text-2xl font-black text-[#1a1f36] tracking-tight">{resumen.total_miembros || 0} <span className="text-xs text-gray-400 font-bold ml-1 uppercase">Pers.</span></p>
          </div>
        </div>

        {/* Desglose por Niveles con Estilo Glassmorphism */}
        <div className="bg-white rounded-[3rem] p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] border border-gray-50 relative overflow-hidden z-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-10 px-1">
            <div className="w-1.5 bg-[#1a1f36] h-6 rounded-full shadow-[0_0_10px_rgba(26,31,54,0.3)]" />
            <h3 className="font-black text-[#1a1f36] uppercase tracking-[0.2em] text-sm">Estructura de Red</h3>
          </div>
          
          <div className="space-y-5">
            {niveles.map((n) => (
              <div key={n.nivel} className="p-7 rounded-[2.5rem] bg-gray-50 border border-gray-100/50 hover:border-[#1a1f36]/20 transition-all group shadow-inner relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#1a1f36] text-white flex items-center justify-center text-xs font-black shadow-lg group-hover:rotate-[360deg] transition-transform duration-700">
                      {n.nivel}
                    </div>
                    <span className="text-sm font-black text-gray-700 uppercase tracking-tighter group-hover:text-[#1a1f36] transition-colors">Nivel {n.nivel}</span>
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-[#00C853]/10 text-[#00C853] text-[10px] font-black tracking-[0.2em] uppercase border border-[#00C853]/20">
                    +{n.porcentaje}%
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Activos</p>
                    <div className="bg-white/50 backdrop-blur-md rounded-2xl px-4 py-2 border border-white">
                      <p className="text-lg font-black text-gray-700 tracking-tight">{n.total_miembros}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Comisión</p>
                    <div className="bg-white/50 backdrop-blur-md rounded-2xl px-4 py-2 border border-white">
                      <p className="text-lg font-black text-[#00C853] tracking-tight">{(n.monto_recarga || 0).toFixed(2)} <span className="text-[10px] font-bold">BOB</span></p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección Informativa con Estilo Moderno */}
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-white to-gray-50 border-l-8 border-[#1a1f36] shadow-[0_10px_30px_rgba(0,0,0,0.03)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#1a1f36]/5 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-sm font-black text-[#1a1f36] leading-relaxed uppercase tracking-[0.15em] flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#1a1f36]/5 flex items-center justify-center">
                <Info size={18} />
              </div>
              Sistema de Comisiones
            </p>
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed tracking-wide">
              Maximiza tus ganancias construyendo una red sólida. Cada tarea completada por tus invitados genera beneficios automáticos en tu monedero de comisiones. <span className="text-[#1a1f36] font-black underline decoration-2 decoration-[#1a1f36]/20 underline-offset-4">¡Tu equipo es tu activo más valioso!</span>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
