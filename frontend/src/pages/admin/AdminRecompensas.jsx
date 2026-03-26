import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { 
  Gift, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Star, 
  Trophy, 
  Sparkles,
  RefreshCw,
  Percent,
  DollarSign,
  Ticket,
  Users,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';

export default function AdminRecompensas() {
  const [premios, setPremios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [editingPremio, setEditingPremio] = useState(null);
  
  const [form, setForm] = useState({
    nombre: '',
    valor: '',
    probabilidad: '',
    color: '#1a1f36',
    activo: true,
    orden: 0
  });

  const [giftForm, setGiftGiftForm] = useState({
    tipo: 'todos', // todos, nivel, usuario
    targetId: '',
    cantidad: 1
  });

  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [p, u, n] = await Promise.all([
        api.admin.premiosRuleta(),
        api.admin.usuarios(),
        api.admin.niveles()
      ]);
      setPremios(p);
      setUsuarios(u);
      setNiveles(n);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPremio) {
        await api.admin.actualizarPremioRuleta(editingPremio.id, form);
      } else {
        await api.admin.crearPremioRuleta(form);
      }
      setShowModal(false);
      setEditingPremio(null);
      setForm({ nombre: '', valor: '', probabilidad: '', color: '#1a1f36', activo: true, orden: 0 });
      fetchData();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  };

  const handleGiftSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.admin.regalarTickets(giftForm);
      alert(res.message || 'Tickets regalados con éxito');
      setShowGiftModal(false);
      setGiftGiftForm({ tipo: 'todos', targetId: '', cantidad: 1 });
    } catch (err) {
      alert('Error al regalar tickets: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este premio?')) return;
    try {
      await api.admin.eliminarPremioRuleta(id);
      fetchData();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const openEdit = (p) => {
    setEditingPremio(p);
    setForm({
      nombre: p.nombre,
      valor: p.valor,
      probabilidad: p.probabilidad,
      color: p.color,
      activo: p.activo,
      orden: p.orden
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const totalProb = premios.reduce((acc, p) => acc + Number(p.probabilidad), 0);

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-2">
            Gestión de <span className="text-indigo-600">Ruleta</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Configura los premios y gestiona tickets para usuarios</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowGiftModal(true)}
            className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 border-indigo-100 hover:bg-indigo-100 transition-all active:scale-95"
          >
            <Ticket size={18} />
            Regalar Tickets
          </button>
          <button 
            onClick={() => { setEditingPremio(null); setForm({ nombre: '', valor: '', probabilidad: '', color: '#1a1f36', activo: true, orden: 0 }); setShowModal(true); }}
            className="flex items-center justify-center gap-2 bg-[#1a1f36] text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/10 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95"
          >
            <Plus size={18} />
            Nuevo Premio
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
              <RefreshCw size={24} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Premios</span>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-black text-gray-900">{premios.length}</span>
              <span className="text-xs font-bold text-gray-400 mb-2 uppercase">Configurados</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6">
              <Percent size={24} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Probabilidad Total</span>
            <div className="flex items-end gap-1">
              <span className={`text-3xl font-black ${totalProb > 100 ? 'text-rose-500' : 'text-gray-900'}`}>{totalProb}%</span>
              <span className="text-xs font-bold text-gray-400 mb-2 uppercase">/ 100%</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-6">
              <Trophy size={24} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Premio Mayor</span>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-black text-gray-900">
                {premios.length > 0 ? Math.max(...premios.map(p => Number(p.valor))) : 0}
              </span>
              <span className="text-xs font-bold text-gray-400 mb-2 uppercase">BOB</span>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Premios de la Ruleta</h2>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar premio..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 focus:border-indigo-100 focus:bg-white transition-all outline-none text-sm font-bold w-full md:w-80"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Probabilidad</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {premios.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg"
                        style={{ backgroundColor: p.color }}
                      >
                        <Gift size={20} />
                      </div>
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{p.nombre}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-black text-gray-900">{p.valor} BOB</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-black text-indigo-600">{p.probabilidad}%</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      p.activo ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEdit(p)}
                        className="p-3 rounded-xl hover:bg-white hover:shadow-lg transition-all text-gray-400 hover:text-indigo-600 border border-transparent hover:border-indigo-100"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="p-3 rounded-xl hover:bg-white hover:shadow-lg transition-all text-gray-400 hover:text-rose-600 border border-transparent hover:border-rose-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gift Tickets Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 bg-[#1a1f36]/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Ticket size={20} />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Regalar Tickets</h3>
              </div>
              <button onClick={() => setShowGiftModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleGiftSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Destinatarios</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'todos', label: 'Todos', icon: Users },
                    { id: 'nivel', label: 'Nivel', icon: Trophy },
                    { id: 'usuario', label: 'Usuario', icon: UserIcon },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setGiftGiftForm({ ...giftForm, tipo: t.id, targetId: '' })}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        giftForm.tipo === t.id 
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-600' 
                          : 'bg-gray-50 border-gray-50 text-gray-400 hover:bg-white hover:border-gray-200'
                      }`}
                    >
                      <t.icon size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {giftForm.tipo === 'nivel' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Seleccionar Nivel</label>
                  <select
                    required
                    value={giftForm.targetId}
                    onChange={(e) => setGiftGiftForm({ ...giftForm, targetId: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 focus:border-indigo-100 transition-all outline-none text-sm font-bold appearance-none cursor-pointer"
                  >
                    <option value="">Selecciona un nivel...</option>
                    {niveles.map(n => (
                      <option key={n.id} value={n.id}>{n.nombre} ({n.codigo})</option>
                    ))}
                  </select>
                </div>
              )}

              {giftForm.tipo === 'usuario' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Seleccionar Usuario</label>
                  
                  {/* Buscador de usuario */}
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Buscar por nombre o número..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-50 focus:border-indigo-100 transition-all outline-none text-xs font-bold"
                    />
                  </div>

                  <select
                    required
                    value={giftForm.targetId}
                    onChange={(e) => setGiftGiftForm({ ...giftForm, targetId: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 focus:border-indigo-100 transition-all outline-none text-sm font-bold appearance-none cursor-pointer"
                  >
                    <option value="">
                      {userSearch ? 'Resultados de búsqueda...' : 'Selecciona un usuario...'}
                    </option>
                    {usuarios
                      .filter(u => u.rol === 'usuario')
                      .filter(u => {
                        const search = userSearch.toLowerCase();
                        return (
                          u.nombre_usuario?.toLowerCase().includes(search) || 
                          u.telefono?.includes(search)
                        );
                      })
                      .map(u => (
                        <option key={u.id} value={u.id}>{u.nombre_usuario} ({u.telefono})</option>
                      ))
                    }
                  </select>
                  {userSearch && usuarios.filter(u => u.rol === 'usuario').filter(u => {
                    const search = userSearch.toLowerCase();
                    return u.nombre_usuario?.toLowerCase().includes(search) || u.telefono?.includes(search);
                  }).length === 0 && (
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1 ml-2">No se encontraron usuarios</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Cantidad de Tickets</label>
                <div className="relative">
                  <Ticket size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    required
                    type="number"
                    min="1"
                    value={giftForm.cantidad}
                    onChange={e => setGiftGiftForm({...giftForm, cantidad: e.target.value})}
                    className="w-full pl-10 pr-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 focus:border-indigo-100 transition-all outline-none text-sm font-bold"
                    placeholder="1"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
              >
                Confirmar Regalo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Prize Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#1a1f36]/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                {editingPremio ? 'Editar' : 'Nuevo'} Premio
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre del Premio</label>
                <input 
                  required
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({...form, nombre: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 focus:border-indigo-100 transition-all outline-none text-sm font-bold"
                  placeholder="Ej: Gran Premio"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Valor (BOB)</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      required
                      type="number"
                      step="0.01"
                      value={form.valor}
                      onChange={e => setForm({...form, valor: e.target.value})}
                      className="w-full pl-10 pr-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 focus:border-indigo-100 transition-all outline-none text-sm font-bold"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Probabilidad (%)</label>
                  <div className="relative">
                    <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      required
                      type="number"
                      step="0.1"
                      value={form.probabilidad}
                      onChange={e => setForm({...form, probabilidad: e.target.value})}
                      className="w-full pl-10 pr-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 focus:border-indigo-100 transition-all outline-none text-sm font-bold"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Color</label>
                  <input 
                    type="color"
                    value={form.color}
                    onChange={e => setForm({...form, color: e.target.value})}
                    className="w-full h-[54px] rounded-2xl border-none cursor-pointer bg-gray-50 p-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Estado</label>
                  <button
                    type="button"
                    onClick={() => setForm({...form, activo: !form.activo})}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                      form.activo ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-100' : 'bg-gray-50 text-gray-400 border-2 border-gray-100'
                    }`}
                  >
                    {form.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 rounded-2xl bg-[#1a1f36] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/10 hover:bg-indigo-700 transition-all active:scale-95"
              >
                {editingPremio ? 'Guardar Cambios' : 'Crear Premio'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
