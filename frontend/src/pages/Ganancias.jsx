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
  const [punished, setPunished] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [res, statusRes] = await Promise.all([
        api.users.earnings(),
        api.get('/users/status-castigo')
      ]);
      if (isMounted) {
        setData(res);
        setPunished(statusRes.castigado);
        setError(null);
      }
    } catch (err) {
      console.error('Error cargando ganancias:', err);
      if (isMounted) setError('No se pudo sincronizar el historial.');
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    fetchData();

    // Polling de respaldo para ganancias cada 15 segundos
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    }, 15000);

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
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }
    return () => clearInterval(interval);
  }, [user?.id, isMounted]);

  const getFilteredHistory = () => {
    const historyData = Array.isArray(data?.history) ? data.history : [];
    if (tab === 'todo') return historyData;
    
    // Normalizar tipos para evitar errores por cambios menores en backend
    const filters = {
      tareas: ['ganancia_tarea', 'tarea_completada'],
      comisiones: ['comision_subordinado', 'comision_red'],
      invitaciones: ['recompensa_invitacion', 'bono_invitado'],
      recargas: ['recarga', 'deposito'],
      retiros: ['retiro', 'extraccion'],
      otros: ['ajuste_admin', 'bono_manual', 'premio_ruleta']
    };

    return historyData.filter(item => {
      const tipo = item.tipo_movimiento?.toLowerCase() || '';
      return filters[tab]?.some(f => tipo.includes(f));
    });
  };

  const historyList = getFilteredHistory();

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

  if (punished) {
    return (
      <Layout>
        <Header title="Ganancias Bloqueadas" />
        <div className="p-8 text-center space-y-6 flex flex-col items-center justify-center min-h-[70vh] bg-white">
          <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-[2.5rem] flex items-center justify-center shadow-xl border border-rose-100 animate-pulse">
            <AlertCircle size={48} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#1a1f36] uppercase tracking-tighter">Acceso Restringido</h2>
            <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-xs mx-auto">
              Tu sistema de ganancias ha sido <span className="text-rose-600 font-bold uppercase">bloqueado por hoy</span> como castigo por no responder el cuestionario obligatorio de ayer.
            </p>
          </div>
          <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 text-left w-full shadow-inner">
            <p className="text-[10px] text-amber-700 font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <AlertCircle size={14} /> Nota:
            </p>
            <p className="text-xs text-amber-600 leading-relaxed font-medium">
              Asegúrate de responder el cuestionario de hoy para evitar ser sancionado nuevamente mañana.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="Historial de Ganancias" />
      <div className="p-5 space-y-8 pb-24 bg-gray-50/30 min-h-screen relative overflow-hidden">
        {/* Glow Effects de fondo */}
        <div className="absolute top-20 -left-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-40 -right-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Card Principal de Balance */}
        <div className="bg-gradient-to-br from-[#1a1f36] to-[#2a2f46] rounded-[2.5rem] p-10 text-white shadow-[0_20px_50px_-15px_rgba(26,31,54,0.4)] relative overflow-hidden group border border-white/10">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full -ml-16 -mb-16 blur-2xl" />
          
          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/50">Balance Acumulado</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-5xl font-black tracking-tighter uppercase drop-shadow-lg">{(data?.summary?.total || 0).toFixed(2)}</h2>
                  <span className="text-sm font-black text-white/40 tracking-widest">BOB</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl group-hover:rotate-6 transition-transform">
                <TrendingUp className="text-white" size={28} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 backdrop-blur-sm group-hover:bg-white/10 transition-colors">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">Ganancias Hoy</p>
                <p className="text-xl font-black tracking-tight">+{(data?.summary?.hoy || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 backdrop-blur-sm group-hover:bg-white/10 transition-colors text-right">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">Saldo de Comisiones</p>
                <p className="text-xl font-black tracking-tight">{(user?.saldo_comisiones || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros de Categoría */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className="w-1.5 bg-[#1a1f36] h-5 rounded-full" />
            <h3 className="text-xs font-black text-[#1a1f36] uppercase tracking-[0.2em]">Categorías</h3>
          </div>
          
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1">
            {[
              { id: 'todo', label: 'Todo', icon: History },
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
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl whitespace-nowrap font-black uppercase tracking-widest text-[9px] transition-all border shadow-sm ${
                  tab === f.id 
                    ? 'bg-[#1a1f36] text-white border-[#1a1f36] shadow-indigo-900/20 scale-105' 
                    : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                }`}
              >
                <f.icon size={14} strokeWidth={2.5} />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listado de Movimientos */}
        <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-[#1a1f36] uppercase tracking-[0.2em]">Registros</h3>
            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">{historyList.length} Items</span>
          </div>

          <div className="space-y-4">
            {Array.isArray(historyList) && historyList.length > 0 ? (
              historyList.map((item, idx) => (
                <div 
                  key={item.id || idx}
                  className="bg-white rounded-[2rem] p-6 shadow-xl shadow-black/5 border border-gray-100 flex items-center gap-5 hover:border-[#1a1f36]/20 transition-all group animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${
                    item.monto > 0 ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'
                  }`}>
                    {item.monto > 0 ? <TrendingUp size={24} /> : <ArrowDownCircle size={24} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1.5">
                      <p className="text-[11px] font-black text-[#1a1f36] uppercase tracking-tighter truncate leading-none">
                        {item.descripcion || 'Movimiento de saldo'}
                      </p>
                      <span className={`text-sm font-black tracking-tight ${item.monto > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.monto > 0 ? '+' : ''}{item.monto?.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Clock size={10} className="text-gray-300" />
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(item.fecha).toLocaleDateString()}</span>
                        </div>
                        <div className="w-1 h-1 bg-gray-200 rounded-full" />
                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">REF: {item.referencia?.slice(0, 10).toUpperCase() || 'N/A'}</span>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{item.tipo_movimiento?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 border border-gray-100">
                  <FileText size={40} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">No hay registros en esta categoría</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
