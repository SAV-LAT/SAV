import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { api } from '../lib/api';
import { Wallet, HandCoins, Calendar, Clock, ArrowUpCircle, ArrowDownCircle, History } from 'lucide-react';

export default function Ganancias() {
  const [tab, setTab] = useState('todo');
  const [recargas, setRecargas] = useState([]);
  const [retiros, setRetiros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.recharges.list().catch(() => []),
      api.withdrawals.list().catch(() => [])
    ]).then(([rec, ret]) => {
      setRecargas(rec);
      setRetiros(ret);
    }).finally(() => setLoading(false));
  }, []);

  const combinedItems = [
    ...recargas.map(r => ({ ...r, tipo: 'recarga' })),
    ...retiros.map(r => ({ ...r, tipo: 'retiro' }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const items = tab === 'todo' ? combinedItems : (tab === 'recargas' ? recargas : retiros);

  const agruparPorFecha = (lista) => {
    const grupos = {};
    lista.forEach((i) => {
      const fecha = new Date(i.created_at).toLocaleDateString('es-BO', { month: 'long', year: 'numeric' });
      if (!grupos[fecha]) grupos[fecha] = [];
      grupos[fecha].push(i);
    });
    return Object.entries(grupos);
  };

  const grupos = agruparPorFecha(items);

  const formatearEstado = (e) => {
    const map = { 
      pendiente: { label: 'En revisión', color: 'text-amber-500', bg: 'bg-amber-50' }, 
      aprobada: { label: 'Completado', color: 'text-[#00C853]', bg: 'bg-[#00C853]/10' }, 
      rechazada: { label: 'Rechazado', color: 'text-rose-500', bg: 'bg-rose-50' }, 
      pagado: { label: 'Pagado', color: 'text-[#00C853]', bg: 'bg-[#00C853]/10' }, 
      rechazado: { label: 'Rechazado', color: 'text-rose-500', bg: 'bg-rose-50' } 
    };
    const info = map[e] || { label: e, color: 'text-gray-400', bg: 'bg-gray-50' };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${info.bg} ${info.color} border border-current/10`}>
        {info.label}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <Header title="Historial de Movimientos" />
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-white">
          <div className="w-12 h-12 border-4 border-[#1a1f36] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-medium animate-pulse uppercase tracking-widest text-[10px]">Cargando historial...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="Movimientos" />
      
      {/* Tabs Premium Dark */}
      <div className="px-4 mt-4">
        <div className="flex bg-gray-50 p-1.5 rounded-[1.5rem] border border-gray-100 shadow-inner">
          {[
            { id: 'todo', label: 'Todo', icon: History },
            { id: 'recargas', label: 'Recargas', icon: Wallet },
            { id: 'retiros', label: 'Retiros', icon: HandCoins }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t.id ? 'bg-[#1a1f36] text-white shadow-lg' : 'text-gray-400 hover:text-[#1a1f36]'}`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-8 pb-24 bg-white min-h-screen">
        {grupos.length === 0 ? (
          <div className="text-center py-20 opacity-30 grayscale">
            <Calendar size={64} className="mx-auto mb-4 text-[#1a1f36]" />
            <p className="font-black uppercase tracking-[0.2em] text-xs text-[#1a1f36]">Sin movimientos registrados</p>
          </div>
        ) : (
          grupos.map(([mes, lista]) => (
            <div key={mes} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <Clock size={14} className="text-[#1a1f36]" />
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{mes}</h3>
              </div>
              
              <div className="space-y-3">
                {lista.map((i) => {
                  const isRecarga = i.tipo === 'recarga';
                  return (
                    <div key={i.id} className="bg-white rounded-[2rem] p-5 shadow-xl border border-gray-100 flex items-center gap-4 group hover:border-[#1a1f36]/30 transition-all">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isRecarga ? 'bg-emerald-50 text-[#00C853]' : 'bg-orange-50 text-orange-500'} border border-gray-50 shadow-inner`}>
                        {isRecarga ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-black text-[#1a1f36] text-sm truncate uppercase tracking-tighter">
                            {isRecarga ? 'Recarga de Saldo' : 'Retiro de Fondos'}
                          </p>
                          <p className={`font-black text-sm ${isRecarga ? 'text-[#00C853]' : 'text-orange-500'}`}>
                            {isRecarga ? '+' : '-'}{i.monto?.toFixed(2)} <span className="text-[8px] opacity-50">BOB</span>
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col gap-1">
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                              {i.created_at ? new Date(i.created_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                            <p className="text-[8px] text-gray-300 font-mono">ID: {i.id?.slice(0, 12)}</p>
                          </div>
                          {formatearEstado(i.estado)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        
        {grupos.length > 0 && (
          <div className="pt-4 border-t border-dashed border-gray-100 text-center">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">Fin del historial</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
