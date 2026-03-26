import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { Send, CheckCircle2, XCircle, Clock, ExternalLink, QrCode } from 'lucide-react';

export default function AdminRecargas() {
  const [list, setList] = useState([]);
  const [rejectId, setRejectId] = useState(null);
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    api.admin.recargas().then(setList).catch(() => []);
  }, []);

  const handleAprobar = async (id) => {
    if (!confirm('¿Seguro que quieres aprobar esta recarga?')) return;
    try {
      await api.admin.aprobarRecarga(id);
      setList((l) => l.map((r) => (r.id === id ? { ...r, estado: 'aprobada' } : r)));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRechazarSubmit = async () => {
    if (!motivo.trim()) return alert('Por favor ingresa un motivo');
    try {
      await api.admin.rechazarRecarga(rejectId, motivo);
      setList((l) => l.map((r) => (r.id === rejectId ? { ...r, estado: 'rechazada' } : r)));
      setRejectId(null);
      setMotivo('');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Gestión de Recargas</h1>
          <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px] mt-1">Validación de depósitos de usuarios</p>
        </div>
        <a 
          href="https://t.me/BotFather" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-100"
        >
          <Send size={16} /> Configurar Bot Telegram
        </a>
      </div>

      {/* Vista de escritorio (Tabla) */}
      <div className="hidden md:block bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Usuario / ID</th>
              <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Monto</th>
              <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Comprobante</th>
              <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Estado</th>
              <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Fecha</th>
              <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px] text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6">
                  <p className="font-bold text-gray-800 text-sm uppercase tracking-tighter">{r.usuario?.nombre_usuario || 'Usuario'}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{r.modo}</p>
                </td>
                <td className="p-6">
                  <span className="text-lg font-black text-sav-primary">{r.monto?.toFixed(2)} BOB</span>
                </td>
                <td className="p-6">
                  {r.comprobante_url ? (
                    <a href={r.comprobante_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-500 hover:underline font-bold text-xs uppercase">
                      Ver Imagen <ExternalLink size={12} />
                    </a>
                  ) : <span className="text-gray-300 italic text-xs">Sin imagen</span>}
                </td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    r.estado === 'aprobada' ? 'bg-green-100 text-green-700' :
                    r.estado === 'rechazada' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {r.estado}
                  </span>
                </td>
                <td className="p-6 text-xs font-bold text-gray-500">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="p-6 text-center">
                  {r.estado === 'pendiente' && (
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleAprobar(r.id)} className="px-4 py-2 rounded-xl bg-green-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all">Aprobar</button>
                      <button onClick={() => setRejectId(r.id)} className="px-4 py-2 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all">Rechazar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Rechazo */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full space-y-4">
            <h3 className="text-xl font-black text-[#1a1f36] uppercase tracking-tighter">Rechazar Recarga</h3>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Motivo del rechazo</label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#1a1f36]/30 text-sm font-bold min-h-[100px]"
                placeholder="Ej: Comprobante ilegible"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setRejectId(null)} className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">Cancelar</button>
              <button onClick={handleRechazarSubmit} className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-100">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Vista de móvil (Tarjetas) */}
      <div className="md:hidden space-y-4">
        {list.map((r) => (
          <div key={r.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sav-primary/5 flex items-center justify-center text-sav-primary">
                  <QrCode size={20} />
                </div>
                <div>
                  <p className="font-black text-gray-800 text-sm uppercase tracking-tighter">{r.usuario?.nombre_usuario || 'Usuario'}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{r.modo}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                r.estado === 'aprobada' ? 'bg-green-100 text-green-700' :
                r.estado === 'rechazada' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {r.estado}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Monto Recibido</p>
                <p className="text-xl font-black text-sav-primary">{r.monto?.toFixed(2)} <span className="text-[10px] opacity-50">BOB</span></p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Fecha</p>
                <p className="text-[10px] font-bold text-gray-600">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {r.comprobante_url && (
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={r.comprobante_url} 
                    alt="Comprobante" 
                    className="w-12 h-12 rounded-lg object-cover bg-white border border-gray-100" 
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/100x100?text=Error';
                    }}
                  />
                  <span className="text-[10px] font-black text-gray-500 uppercase">Comprobante de Pago</span>
                </div>
                <a href={r.comprobante_url} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <ExternalLink size={16} />
                </a>
              </div>
            )}

            {r.estado === 'pendiente' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => handleAprobar(r.id)}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-green-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-200 active:scale-95 transition-all"
                >
                  <CheckCircle2 size={14} /> Aprobar
                </button>
                <button 
                  onClick={() => setRejectId(r.id)}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-200 active:scale-95 transition-all"
                >
                  <XCircle size={14} /> Rechazar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <div className="p-20 text-center flex flex-col items-center gap-4">
          <Clock size={48} className="text-gray-200" />
          <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">No hay recargas registradas</p>
        </div>
      )}
    </div>
  );
}
