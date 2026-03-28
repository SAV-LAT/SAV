import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Wallet, HandCoins, Calendar, Clock, ArrowUpCircle, ArrowDownCircle, 
  History, TrendingUp, Sparkles, Filter, CheckCircle2, AlertCircle,
  Trophy, Users, UserPlus, FileText, ArrowRightLeft, MinusCircle
} from 'lucide-react';

/**
 * SAV v4.2.0 - SISTEMA INTEGRAL DE GANANCIAS
 * Unificado, auditable, moderno y en tiempo real.
 */

export default function Ganancias() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('todo');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.users.earnings();
      setData(res);
      setError(null);
    } catch (err) {
      console.error('Error cargando ganancias:', err);
      setError('No se pudo sincronizar el historial.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Suscripción en tiempo real a movimientos_saldo y usuarios
    if (user?.id) {
      console.log(`[GananciasRealtime] Suscribiendo para usuario: ${user.id}`);
      
      const channel = supabase.channel(`ganancias_realtime_${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'usuarios', 
          filter: `id=eq.${user.id}` 
        }, () => {
          console.log('[GananciasRealtime] Usuario actualizado, refrescando summary...');
          fetchData();
        })
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'movimientos_saldo', 
          filter: `usuario_id=eq.${user.id}` 
        }, (payload) => {
          console.log('[GananciasRealtime] Nuevo movimiento:', payload.new.tipo_movimiento);
          fetchData(); // Recargar datos si hay un nuevo movimiento
          refreshUser(); // Actualizar el perfil del usuario (saldos)
        })
        .subscribe((status) => {
          console.log(`[GananciasRealtime] Estado: ${status}`);
        });

      return () => {
        console.log('[GananciasRealtime] Desuscribiendo...');
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const getFilteredHistory = () => {
    if (!data?.history) return [];
    if (tab === 'todo') return data.history;
    
    const filters = {
      tareas: ['ganancia_tarea'],
      comisiones: ['comision_subordinado'],
      invitaciones: ['recompensa_invitacion'],
      recargas: ['recarga'],
      retiros: ['retiro'],
      otros: ['ajuste_admin']
    };

    return data.history.filter(item => filters[tab].includes(item.tipo_movimiento));
  };

  const history = getFilteredHistory();

  const getIcon = (tipo) => {
    switch (tipo) {
      case 'ganancia_tarea': return <Trophy className="text-amber-500" size={24} />;
      case 'comision_subordinado': return <Users className="text-blue-500" size={24} />;
      case 'recompensa_invitacion': return <UserPlus className="text-emerald-500" size={24} />;
      case 'recarga': return <ArrowUpCircle className="text-emerald-500" size={24} />;
      case 'retiro': return <ArrowDownCircle className="text-orange-500" size={24} />;
      default: return <FileText className="text-gray-500" size={24} />;
    }
  };

  const getLabel = (tipo) => {
    const labels = {
      ganancia_tarea: 'Ganancia por Tarea',
      comision_subordinado: 'Comisión de Red',
      recompensa_invitacion: 'Premio por Invitación',
      recarga: 'Recarga Aprobada',
      retiro: 'Retiro Solicitado',
      ajuste_admin: 'Ajuste Administrativo'
    };
    return labels[tipo] || tipo;
  };

  if (loading && !data) {
    return (
      <Layout>
        <Header title="CENTRO DE GANANCIAS" />
        <div className="p-8 flex flex-col items-center justify-center min-h-[70vh] space-y-4">
          <div className="w-16 h-16 border-4 border-[#1a1f36] border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-[#1a1f36] font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Sincronizando balances...</p>
        </div>
      </Layout>
    );
  }

  const summary = data?.summary || {};

  return (
    <Layout>
      <Header title="ESTADÍSTICAS DE INGRESOS" />
      
      <div className="bg-gray-50 min-h-screen pb-32">
        {/* Resumen Principal - Tarjetas Modernas */}
        <div className="px-5 pt-6 space-y-6">
          {/* Card de Balance Principal */}
          <div className="bg-[#1a1f36] rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden border border-white/5 group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl transition-transform group-hover:scale-110 duration-1000" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2 block">Saldo Principal</span>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-5xl font-black text-white tracking-tighter">
                      {Number(summary.saldo_principal || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </h2>
                    <span className="text-sm font-black text-white/40">BOB</span>
                  </div>
                </div>
                <div className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center border border-white/10 shadow-inner">
                  <Wallet className="text-emerald-400" size={32} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                  <span className="block text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Comisiones</span>
                  <span className="text-lg font-black text-blue-400">
                    {Number(summary.saldo_comisiones || 0).toFixed(2)} <span className="text-[8px] opacity-50">BOB</span>
                  </span>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                  <span className="block text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Total Ganado</span>
                  <span className="text-lg font-black text-emerald-400">
                    {Number(summary.total || 0).toFixed(2)} <span className="text-[8px] opacity-50">BOB</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Periodos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 flex flex-col justify-between h-40 group">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
                  <TrendingUp size={20} />
                </div>
                <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">Hoy</span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ingresos de Hoy</span>
                <p className="text-2xl font-black text-[#1a1f36] tracking-tighter">+{summary.hoy} <span className="text-[10px] opacity-30">BOB</span></p>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100">
                  <Clock size={20} />
                </div>
                <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-full border border-blue-100 uppercase tracking-widest">Ayer</span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ingresos de Ayer</span>
                <p className="text-2xl font-black text-[#1a1f36] tracking-tighter">+{summary.ayer} <span className="text-[10px] opacity-30">BOB</span></p>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center border border-purple-100">
                  <Calendar size={20} />
                </div>
                <span className="text-[8px] font-black text-purple-500 bg-purple-50 px-2 py-1 rounded-full border border-purple-100 uppercase tracking-widest">Semana</span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Esta Semana</span>
                <p className="text-2xl font-black text-[#1a1f36] tracking-tighter">+{summary.semana} <span className="text-[10px] opacity-30">BOB</span></p>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
                  <Sparkles size={20} />
                </div>
                <span className="text-[8px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-full border border-amber-100 uppercase tracking-widest">Mes</span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Este Mes</span>
                <p className="text-2xl font-black text-[#1a1f36] tracking-tighter">+{summary.mes} <span className="text-[10px] opacity-30">BOB</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Historial con Filtros */}
        <div className="px-5 mt-10 space-y-6">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 bg-[#1a1f36] h-5 rounded-full" />
              <h3 className="text-xs font-black text-[#1a1f36] uppercase tracking-[0.2em]">Registro Contable</h3>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              Realtime
            </div>
          </div>

          {/* Filtros Scrollables */}
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5">
            {[
              { id: 'todo', label: 'Todos', icon: History },
              { id: 'tareas', label: 'Tareas', icon: Trophy },
              { id: 'comisiones', label: 'Comisiones', icon: Users },
              { id: 'invitaciones', label: 'Invitados', icon: UserPlus },
              { id: 'recargas', label: 'Recargas', icon: ArrowUpCircle },
              { id: 'retiros', label: 'Retiros', icon: ArrowDownCircle },
              { id: 'otros', label: 'Otros', icon: Filter }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setTab(f.id)}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                  tab === f.id 
                    ? 'bg-[#1a1f36] text-white border-[#1a1f36] shadow-xl' 
                    : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                }`}
              >
                <f.icon size={14} />
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de Movimientos */}
          <div className="space-y-4">
            {history.length > 0 ? (
              history.map((m, idx) => (
                <div
                  key={m.id}
                  className="bg-white rounded-[2.5rem] p-5 shadow-xl border border-gray-100 flex items-center gap-5 hover:border-[#1a1f36]/30 transition-all group animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-gray-50 shadow-inner ${
                    m.monto > 0 ? 'bg-emerald-50' : 'bg-orange-50'
                  }`}>
                    {getIcon(m.tipo_movimiento)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-[#1a1f36] uppercase tracking-tighter truncate leading-none mb-1">
                          {getLabel(m.tipo_movimiento)}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[180px]">
                          {m.descripcion}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${m.monto > 0 ? 'text-emerald-500' : 'text-orange-500'} tracking-tighter`}>
                          {m.monto > 0 ? '+' : ''}{Number(m.monto).toFixed(2)}
                        </p>
                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">BOB</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-300 uppercase tracking-widest">
                          <Clock size={10} />
                          {new Date(m.fecha).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', timeZone: 'America/La_Paz' })}
                        </div>
                        <div className="w-1 h-1 bg-gray-200 rounded-full" />
                        <span className="text-[8px] font-mono text-gray-300 uppercase tracking-widest">
                          {new Date(m.fecha).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/La_Paz' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest">Auditable</span>
                        <CheckCircle2 size={10} className="text-emerald-500/50" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-24 bg-white rounded-[3.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                  <FileText size={40} />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">No hay registros en esta categoría</p>
                  <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest italic">Sincronizado en tiempo real</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
