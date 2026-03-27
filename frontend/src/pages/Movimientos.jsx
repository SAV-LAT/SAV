import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Wallet, HandCoins, Calendar, Clock, ArrowUpCircle, ArrowDownCircle, 
  History, TrendingUp, Sparkles, Filter, CheckCircle2, AlertCircle,
  Trophy, Users, UserPlus, Receipt, ArrowRightLeft, MinusCircle
} from 'lucide-react';

/**
 * SAV v4.3.0 - HISTORIAL FINANCIERO (MOVIMIENTOS)
 * Recargas, retiros y ajustes de saldo.
 */

export default function Movimientos() {
  const { user } = useAuth();
  const [tab, setTab] = useState('todo');
  const [data, setData] = useState({ recargas: [], retiros: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recargas, retiros] = await Promise.all([
        api.recharges.list(),
        api.withdrawals.list()
      ]);
      setData({ recargas, retiros });
      setError(null);
    } catch (err) {
      console.error('Error cargando movimientos:', err);
      setError('No se pudo sincronizar el historial financiero.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Suscripción Realtime para recargas y retiros
    if (user?.id) {
      const recargasChannel = supabase.channel(`public:recargas:usuario_id=eq.${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'recargas', filter: `usuario_id=eq.${user.id}` }, () => fetchData())
        .subscribe();

      const retirosChannel = supabase.channel(`public:retiros:usuario_id=eq.${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'retiros', filter: `usuario_id=eq.${user.id}` }, () => fetchData())
        .subscribe();

      return () => {
        supabase.removeChannel(recargasChannel);
        supabase.removeChannel(retirosChannel);
      };
    }
  }, [user?.id]);

  const combinedItems = [
    ...data.recargas.map(r => ({ ...r, tipo_visual: 'recarga' })),
    ...data.retiros.map(r => ({ ...r, tipo_visual: 'retiro' }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filteredItems = tab === 'todo' ? combinedItems : (tab === 'recargas' ? data.recargas.map(r => ({ ...r, tipo_visual: 'recarga' })) : data.retiros.map(r => ({ ...r, tipo_visual: 'retiro' })));

  const formatearEstado = (e) => {
    const map = { 
      pendiente: { label: 'En revisión', color: 'text-amber-500', bg: 'bg-amber-50' }, 
      aprobada: { label: 'Completado', color: 'text-[#00C853]', bg: 'bg-[#00C853]/10' }, 
      aprobado: { label: 'Completado', color: 'text-[#00C853]', bg: 'bg-[#00C853]/10' }, 
      rechazada: { label: 'Rechazado', color: 'text-rose-500', bg: 'bg-rose-50' }, 
      rechazado: { label: 'Rechazado', color: 'text-rose-500', bg: 'bg-rose-50' },
      pagado: { label: 'Pagado', color: 'text-[#00C853]', bg: 'bg-[#00C853]/10' }
    };
    const info = map[e?.toLowerCase()] || { label: e, color: 'text-gray-400', bg: 'bg-gray-50' };
    return (
      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${info.bg} ${info.color} border border-current/10 shadow-sm`}>
        {info.label}
      </span>
    );
  };

  if (loading && combinedItems.length === 0) {
    return (
      <Layout>
        <Header title="HISTORIAL FINANCIERO" />
        <div className="p-8 flex flex-col items-center justify-center min-h-[70vh] space-y-4">
          <div className="w-16 h-16 border-4 border-[#1a1f36] border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-[#1a1f36] font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Cargando movimientos...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="MOVIMIENTOS" />
      
      <div className="bg-gray-50 min-h-screen pb-32">
        {/* Selector de Tipo */}
        <div className="px-5 pt-6">
          <div className="flex bg-white p-2 rounded-[2rem] border-2 border-gray-100 shadow-xl overflow-hidden">
            {[
              { id: 'todo', label: 'Todos', icon: History },
              { id: 'recargas', label: 'Recargas', icon: ArrowUpCircle },
              { id: 'retiros', label: 'Retiros', icon: ArrowDownCircle }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  tab === t.id 
                    ? 'bg-[#1a1f36] text-white shadow-2xl scale-[1.02]' 
                    : 'text-gray-400 hover:text-[#1a1f36] hover:bg-gray-50'
                }`}
              >
                <t.icon size={16} />
                <span className="hidden xs:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Movimientos */}
        <div className="px-5 mt-8 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                <Receipt size={40} />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Sin movimientos financieros</p>
                <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest italic">Tus transacciones aparecerán aquí</p>
              </div>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isRecarga = item.tipo_visual === 'recarga';
              return (
                <div 
                  key={item.id} 
                  className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-100 flex items-center gap-5 hover:border-[#1a1f36]/30 transition-all group animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-gray-50 shadow-inner ${
                    isRecarga ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'
                  }`}>
                    {isRecarga ? <ArrowUpCircle size={28} /> : <ArrowDownCircle size={28} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0">
                        <p className="text-[12px] font-black text-[#1a1f36] uppercase tracking-tighter truncate leading-none mb-1">
                          {isRecarga ? 'Recarga de Saldo' : 'Retiro de Fondos'}
                        </p>
                        <p className="text-[8px] text-gray-300 font-mono tracking-widest">
                          REF: {item.id?.slice(0, 13).toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-base font-black ${isRecarga ? 'text-emerald-500' : 'text-orange-500'} tracking-tighter leading-none mb-1`}>
                          {isRecarga ? '+' : '-'}{Number(item.monto).toFixed(2)}
                        </p>
                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">BOB</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          <Clock size={10} />
                          {new Date(item.created_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}
                        </div>
                        <div className="w-1 h-1 bg-gray-200 rounded-full" />
                        <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">
                          {new Date(item.created_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {formatearEstado(item.estado)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
