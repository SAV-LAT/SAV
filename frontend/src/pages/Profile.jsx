import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { 
  User, 
  Users, 
  UserPlus,
  FileText, 
  ClipboardList, 
  Gift, 
  ShieldCheck, 
  CreditCard, 
  ChevronRight, 
  UploadCloud,
  TrendingUp,
  Trophy,
  Copy,
  Check,
  Lock,
  Wallet
} from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchStats = () => api.users.stats().then(setStats).catch(() => {});
    
    fetchStats();
    // Actualización automática cada 5 segundos para mantener los "Ingresos de Hoy" frescos
    const interval = setInterval(fetchStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    if (!user?.codigo_invitacion) return;
    navigator.clipboard.writeText(user.codigo_invitacion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const menuItems = [
    { to: '/vip', icon: TrendingUp, label: 'Subir de Nivel VIP', color: 'bg-sav-accent', isHot: true },
    { to: '/invitar', icon: UserPlus, label: 'Invitar amigos', color: 'bg-orange-500' },
    { to: '/equipo', icon: Users, label: 'Informe del equipo', color: 'bg-blue-500' },
    { to: '/registro-facturacion', icon: FileText, label: 'Registro de facturación', color: 'bg-emerald-500' },
    { to: '/registro-tareas', icon: ClipboardList, label: 'Registro de tareas', color: 'bg-purple-500' },
    { to: '/recompensas', icon: Gift, label: 'Premios y Recompensas', color: 'bg-rose-500' },
    { to: '/seguridad', icon: ShieldCheck, label: 'Seguridad de la cuenta', color: 'bg-amber-500' },
    { to: '/vincular-tarjeta', icon: CreditCard, label: 'Vincular tarjeta bancaria', color: 'bg-cyan-500' },
  ];

  return (
    <Layout>
      <div className="bg-gradient-to-br from-[#1a1f36] to-[#2a2f46] text-white pt-12 pb-20 px-6 rounded-b-[3rem] shadow-[0_20px_50px_-15px_rgba(26,31,54,0.4)] relative overflow-hidden border-b border-white/10">
        {/* Decoraciones de fondo dinámicas */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full -ml-24 -mb-24 blur-3xl" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-pulse" />
            <div className="w-24 h-24 rounded-full bg-white/10 p-1.5 border-2 border-white/30 shadow-2xl relative z-10 backdrop-blur-md">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center border-4 border-white/10 shadow-inner">
                <User className="text-[#1a1f36]" size={40} strokeWidth={2.5} />
              </div>
            </div>
            {/* Badge VIP Flotante en Avatar */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#00C853] rounded-full border-4 border-[#1a1f36] flex items-center justify-center shadow-lg z-20">
              <TrendingUp size={14} className="text-white" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-3xl font-black tracking-tighter uppercase drop-shadow-lg">{user?.nombre_usuario}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 shadow-lg">
                {user?.nivel_codigo === 'internar' ? 'PASANTE' : user?.nivel_codigo || user?.nivel}
              </div>
              <div className="px-3 py-1.5 rounded-full bg-black/20 text-white/60 text-[10px] font-black uppercase tracking-widest border border-white/5">
                ID: {user?.id?.slice(0, 8)}
              </div>
            </div>
          </div>
        </div>

        {/* Balance Cards con Estilo Premium */}
        <div className="grid grid-cols-3 gap-3 mt-10 relative z-10">
          <div className="bg-white/10 border border-white/20 p-4 rounded-3xl backdrop-blur-xl group hover:bg-white/15 transition-all">
            <div className="flex items-center gap-2 mb-2 opacity-60">
              <Wallet size={10} className="text-white" />
              <p className="text-[8px] font-black uppercase tracking-[0.1em]">Activos</p>
            </div>
            <p className="text-lg font-black text-white tracking-tight">
              {(user?.saldo_principal || 0).toFixed(1)} 
            </p>
          </div>
          <div className="bg-white/10 border border-white/20 p-4 rounded-3xl backdrop-blur-xl group hover:bg-white/15 transition-all">
            <div className="flex items-center gap-2 mb-2 opacity-60">
              <TrendingUp size={10} className="text-white" />
              <p className="text-[8px] font-black uppercase tracking-[0.1em]">Comisión</p>
            </div>
            <p className="text-lg font-black text-white tracking-tight">
              {(user?.saldo_comisiones || 0).toFixed(1)} 
            </p>
          </div>
          <div className="bg-indigo-500/20 border border-indigo-400/30 p-4 rounded-3xl backdrop-blur-xl group hover:bg-indigo-500/30 transition-all">
            <div className="flex items-center gap-2 mb-2 opacity-60">
              <Trophy size={10} className="text-indigo-300" />
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-indigo-200">Tickets</p>
            </div>
            <p className="text-lg font-black text-white tracking-tight">
              {user?.tickets_ruleta || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-10 relative z-20 space-y-6 pb-28 bg-transparent">
        {/* Estadísticas de Ganancias - Estilo Glassmorphism sobre Blanco */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] border border-gray-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-8 px-1">
            <div className="w-1.5 bg-[#1a1f36] h-5 rounded-full shadow-[0_0_10px_rgba(26,31,54,0.3)]" />
            <h3 className="font-black text-[#1a1f36] uppercase text-[11px] tracking-[0.25em]">Resumen de ingresos</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Ingresos hoy', value: stats?.ingresos_hoy, color: 'text-[#00C853]', bg: 'bg-[#00C853]/5' },
              { label: 'Ingresos ayer', value: stats?.ingresos_ayer, color: 'text-gray-500', bg: 'bg-gray-50' },
              { label: 'Esta semana', value: stats?.ingresos_semana, color: 'text-gray-500', bg: 'bg-gray-50' },
              { label: 'Este mes', value: stats?.ingresos_mes, color: 'text-gray-500', bg: 'bg-gray-50' },
            ].map((s, i) => (
              <div key={i} className={`p-5 rounded-3xl ${s.bg} border border-gray-100/50 shadow-sm transition-transform hover:scale-[1.02]`}>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{s.label}</p>
                <p className={`text-xl font-black ${s.color}`}>{(s.value || 0).toFixed(2)}</p>
              </div>
            ))}
            <div className="p-7 rounded-[2rem] bg-gradient-to-br from-[#1a1f36] to-[#2a2f46] text-white col-span-2 flex justify-between items-center border border-white/10 shadow-[0_15px_30px_-5px_rgba(26,31,54,0.3)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl transition-transform group-hover:scale-150 duration-700" />
              <div className="relative z-10">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-2">Ingresos acumulados</p>
                <p className="text-3xl font-black tracking-tighter">{(stats?.ingresos_totales || 0).toFixed(2)} <span className="text-xs font-normal text-white/40 ml-1.5">BOB</span></p>
              </div>
              <TrendingUp size={40} className="text-white opacity-10 relative z-10 transform group-hover:scale-125 transition-transform duration-500" />
            </div>
          </div>
        </div>

        {/* Menú de Opciones - Estilo Moderno y Espaciado */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] border border-gray-50 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {menuItems.filter(i => !i.isHot).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center justify-between p-6 hover:bg-gray-50 active:bg-gray-100 transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-[#1a1f36] group-hover:text-white group-hover:shadow-[0_10px_20px_rgba(26,31,54,0.2)] transition-all duration-300`}>
                    <item.icon size={22} strokeWidth={1.5} className="text-[#1a1f36] group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-[11px] font-black text-gray-500 group-hover:text-[#1a1f36] transition-colors uppercase tracking-[0.15em]">{item.label}</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#1a1f36] transition-all transform group-hover:translate-x-1.5" />
              </Link>
            ))}
          </div>
        </div>

        <button
          onClick={() => { if(confirm('¿Cerrar sesión?')) { logout(); navigate('/login'); } }}
          className="w-full py-6 rounded-3xl bg-rose-50 text-rose-500 font-black text-[11px] uppercase tracking-[0.4em] active:scale-[0.98] border border-rose-100 hover:bg-rose-500 hover:text-white shadow-sm hover:shadow-rose-500/20 transition-all duration-300"
        >
          Cerrar Sesión Segura
        </button>
      </div>
    </Layout>
  );
}
