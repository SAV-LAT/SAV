import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

export default function AdminTareas() {
  const [tareas, setTareas] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nombre: '',
    nivel_id: '',
    video_url: '',
    respuesta_correcta: '',
    opciones: '',
    recompensa: 0
  });

  useEffect(() => {
    Promise.all([
      api.admin.tareas(),
      api.levels.list()
    ]).then(([t, n]) => {
      setTareas(t.map(item => ({ ...item, opciones: Array.isArray(item.opciones) ? item.opciones.join(', ') : item.opciones })));
      setNiveles(n);
      if (n.length > 0) setForm(f => ({ ...f, nivel_id: n[0].id }));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...form, 
        opciones: form.opciones.split(',').map(o => o.trim()).filter(o => o) 
      };
      const nueva = await api.admin.crearTarea(payload);
      setTareas([...tareas, { ...nueva, opciones: nueva.opciones.join(', ') }]);
      setForm({ ...form, nombre: '', video_url: '', respuesta_correcta: '', opciones: '', recompensa: 0 });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await api.admin.eliminarTarea(id);
      setTareas(tareas.filter(t => t.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = { 
        ...editing, 
        opciones: typeof editing.opciones === 'string' ? editing.opciones.split(',').map(o => o.trim()).filter(o => o) : editing.opciones 
      };
      const updated = await api.admin.actualizarTarea(editing.id, payload);
      setTareas(tareas.map(t => t.id === updated.id ? { ...updated, opciones: updated.opciones.join(', ') } : t));
      setEditing(null);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Gestión de Tareas</h1>
        <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px] mt-1">Crea y edita las tareas diarias por nivel</p>
      </div>

      {/* Formulario Crear */}
      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Nueva Tarea</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre de la tarea</label>
            <input
              type="text"
              placeholder="Ej. Ver video Lamborghini"
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
              value={form.nombre}
              onChange={e => setForm({...form, nombre: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nivel requerido</label>
            <select
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none appearance-none"
              value={form.nivel_id}
              onChange={e => setForm({...form, nivel_id: e.target.value})}
            >
              {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">URL del Video</label>
            <input
              type="url"
              placeholder="Enlace de video"
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
              value={form.video_url}
              onChange={e => setForm({...form, video_url: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Opciones (separadas por coma)</label>
            <input
              type="text"
              placeholder="Opción 1, Opción 2..."
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
              value={form.opciones}
              onChange={e => setForm({...form, opciones: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Respuesta Correcta</label>
            <input
              type="text"
              placeholder="Debe ser idéntica a una opción"
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
              value={form.respuesta_correcta}
              onChange={e => setForm({...form, respuesta_correcta: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Recompensa (BOB)</label>
            <input
              type="number"
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 text-gray-800 font-black text-sm focus:border-sav-primary/20 transition-all outline-none"
              value={form.recompensa}
              onChange={e => setForm({...form, recompensa: parseFloat(e.target.value)})}
              required
            />
          </div>

          <div className="lg:col-span-3">
            <button type="submit" className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-[#1a1f36] text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#1a1f36]/20 active:scale-[0.98] transition-all">
              <Plus size={18} /> Crear Nueva Tarea
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Tareas */}
      <div className="space-y-4">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Tareas registradas</h2>
        <div className="grid grid-cols-1 gap-4">
          {tareas.map(t => (
            <div key={t.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
              {editing?.id === t.id ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold"
                    value={editing.nombre}
                    onChange={e => setEditing({...editing, nombre: e.target.value})}
                  />
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold"
                    value={editing.nivel_id}
                    onChange={e => setEditing({...editing, nivel_id: e.target.value})}
                  >
                    {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                  </select>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold"
                    value={editing.video_url}
                    onChange={e => setEditing({...editing, video_url: e.target.value})}
                  />
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold"
                    value={editing.opciones}
                    onChange={e => setEditing({...editing, opciones: e.target.value})}
                  />
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold"
                    value={editing.respuesta_correcta}
                    onChange={e => setEditing({...editing, respuesta_correcta: e.target.value})}
                  />
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-black"
                    value={editing.recompensa}
                    onChange={e => setEditing({...editing, recompensa: parseFloat(e.target.value)})}
                  />
                  <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                    <button onClick={handleUpdate} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-green-100"><Save size={18}/> Guardar</button>
                    <button onClick={() => setEditing(null)} className="flex-1 bg-gray-400 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-gray-100"><X size={18}/> Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5 w-full">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                      <img src={t.video_url} alt="" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://placehold.co/100x100?text=Video'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-gray-800 text-sm uppercase tracking-tighter truncate">{t.nombre}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-sav-primary/10 text-sav-primary px-3 py-1 rounded-full">
                          {niveles.find(n => n.id === t.nivel_id)?.nombre || 'Nivel'}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                          +{t.recompensa} BOB
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-gray-50">
                    <div className="text-left sm:text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Respuesta</p>
                      <p className="text-[11px] font-bold text-gray-600 truncate max-w-[120px]">{t.respuesta_correcta}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(t)} className="p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
                        <Edit2 size={20} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {tareas.length === 0 && (
        <div className="bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100 p-12 text-center">
          <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">No hay tareas configuradas en este nivel</p>
        </div>
      )}
    </div>
  );
}
