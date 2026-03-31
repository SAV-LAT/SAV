import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Users, Crown, Star, UserMinus, Search, Loader2, Trophy } from 'lucide-react';

export default function AdminRanking() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/ranking-invitados');
      setRanking(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error fetching ranking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTipoLider = async (userId, val) => {
    setUpdating(userId);
    try {
      await api.put(`/admin/usuarios/${userId}`, { tipo_lider: val });
      // Actualizar localmente para evitar recarga completa
      setRanking(prev => prev.map(u => u.id === userId ? { ...u, tipo_lider: val } : u));
    } catch (err) {
      alert('Error actualizando rol: ' + err.message);
    } finally {
      setUpdating(null);
    }
  };

  const filteredRanking = ranking.filter(u => 
    (u.nombre_usuario || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.telefono || '').includes(search)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-sav-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1a1f36] flex items-center gap-3">
            <Trophy className="text-amber-500" />
            Ranking de Invitados (Top 70)
          </h2>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">
            Usuarios con más invitados directos • Top 30 destacados para Líder Premium
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Buscar en el ranking..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-[#1a1f36] outline-none transition-all shadow-sm font-bold text-gray-700"
        />
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Pos.</th>
                <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Usuario</th>
                <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Teléfono</th>
                <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Cód. Inv</th>
                <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px] text-center">Invitados</th>
                <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Estado Actual</th>
                <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px] text-center">Asignar Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRanking.map((u, idx) => {
                const isTop30 = idx < 30;
                return (
                  <tr key={u.id} className={`hover:bg-gray-50/80 transition-colors group ${isTop30 ? 'bg-amber-50/20' : ''}`}>
                    <td className="p-6">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                        idx === 0 ? 'bg-amber-400 text-white shadow-lg shadow-amber-200' :
                        idx === 1 ? 'bg-slate-300 text-white shadow-lg shadow-slate-200' :
                        idx === 2 ? 'bg-orange-400 text-white shadow-lg shadow-orange-200' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${isTop30 ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {u.nombre_usuario?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-gray-800 text-sm uppercase tracking-tighter">{u.nombre_usuario}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{u.nivel || 'Sin Nivel'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-sm font-bold text-gray-600">{u.telefono}</td>
                    <td className="p-6 text-sm font-black text-indigo-600 tracking-widest">{u.codigo_invitacion}</td>
                    <td className="p-6 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-black text-xs">
                        <Users size={14} />
                        {u.invitados_count}
                      </div>
                    </td>
                    <td className="p-6">
                      {u.tipo_lider ? (
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          u.tipo_lider === 'lider_premium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {u.tipo_lider.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic">Usuario Base</span>
                      )}
                    </td>
                    <td className="p-6">
                      <div className="flex justify-center gap-2">
                        {updating === u.id ? (
                          <Loader2 className="w-5 h-5 text-sav-primary animate-spin" />
                        ) : (
                          <>
                            <button 
                              onClick={() => handleChangeTipoLider(u.id, 'lider_premium')}
                              disabled={u.tipo_lider === 'lider_premium'}
                              className={`p-2 rounded-lg transition-all ${u.tipo_lider === 'lider_premium' ? 'bg-amber-500 text-white shadow-lg' : 'bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white'}`}
                              title="Asignar Líder Premium"
                            >
                              <Crown size={16} />
                            </button>
                            <button 
                              onClick={() => handleChangeTipoLider(u.id, 'lider')}
                              disabled={u.tipo_lider === 'lider'}
                              className={`p-2 rounded-lg transition-all ${u.tipo_lider === 'lider' ? 'bg-blue-500 text-white shadow-lg' : 'bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white'}`}
                              title="Asignar Líder"
                            >
                              <Star size={16} />
                            </button>
                            <button 
                              onClick={() => handleChangeTipoLider(u.id, '')}
                              disabled={!u.tipo_lider}
                              className={`p-2 rounded-lg transition-all ${!u.tipo_lider ? 'bg-gray-100 text-gray-300' : 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white'}`}
                              title="Quitar Rol de Líder"
                            >
                              <UserMinus size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden p-4 space-y-4">
          {filteredRanking.map((u, idx) => {
            const isTop30 = idx < 30;
            return (
              <div key={u.id} className={`p-5 rounded-3xl border border-gray-100 space-y-4 ${isTop30 ? 'bg-amber-50/30' : 'bg-gray-50/50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] ${
                      idx === 0 ? 'bg-amber-400 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-black text-gray-800 text-xs uppercase">{u.nombre_usuario}</p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase">{u.telefono}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-gray-400 uppercase">Invitados</p>
                    <p className="text-xs font-black text-indigo-600">{u.invitados_count}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200/50">
                  <div>
                    {u.tipo_lider ? (
                      <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${
                        u.tipo_lider === 'lider_premium' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {u.tipo_lider.replace('_', ' ')}
                      </span>
                    ) : (
                      <span className="text-[8px] font-black text-gray-400 uppercase italic">Sin Rol</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleChangeTipoLider(u.id, 'lider_premium')}
                      className={`p-2 rounded-xl ${u.tipo_lider === 'lider_premium' ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-amber-600 shadow-sm'}`}
                    >
                      <Crown size={14} />
                    </button>
                    <button 
                      onClick={() => handleChangeTipoLider(u.id, 'lider')}
                      className={`p-2 rounded-xl ${u.tipo_lider === 'lider' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-blue-600 shadow-sm'}`}
                    >
                      <Star size={14} />
                    </button>
                    <button 
                      onClick={() => handleChangeTipoLider(u.id, '')}
                      className="p-2 rounded-xl bg-white border border-gray-200 text-rose-600 shadow-sm"
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
