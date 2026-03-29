import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { ShieldCheck, Save, Plus, Trash2, Clock, Bell, BellOff } from 'lucide-react';

export default function AdminAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    telegram_user_id: '',
    telegram_username: '',
    hora_inicio_turno: '00:00',
    hora_fin_turno: '23:59',
    activo: true,
    recibe_notificaciones: true
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/admin/admins');
      setAdmins(res);
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/admins/${editingId}`, formData);
      } else {
        await api.post('/admin/admins', formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        nombre: '',
        telegram_user_id: '',
        telegram_username: '',
        hora_inicio_turno: '00:00',
        hora_fin_turno: '23:59',
        activo: true,
        recibe_notificaciones: true
      });
      fetchAdmins();
    } catch (err) {
      alert('Error guardando administrador: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (admin) => {
    setFormData({
      nombre: admin.nombre,
      telegram_user_id: admin.telegram_user_id,
      telegram_username: admin.telegram_username || '',
      hora_inicio_turno: admin.hora_inicio_turno?.substring(0, 5) || '00:00',
      hora_fin_turno: admin.hora_fin_turno?.substring(0, 5) || '23:59',
      activo: admin.activo,
      recibe_notificaciones: admin.recibe_notificaciones
    });
    setEditingId(admin.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este administrador?')) return;
    try {
      await api.delete(`/admin/admins/${id}`);
      fetchAdmins();
    } catch (err) {
      alert('Error eliminando admin');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#1a1f36] flex items-center gap-3">
            <ShieldCheck className="text-sav-primary" />
            Gestión de Admins y Turnos
          </h2>
          <p className="text-sm text-gray-500">Configura quién y en qué horario recibe notificaciones.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({
              nombre: '',
              telegram_user_id: '',
              telegram_username: '',
              hora_inicio_turno: '00:00',
              hora_fin_turno: '23:59',
              activo: true,
              recibe_notificaciones: true
            });
            setShowForm(!showForm);
          }}
          className="bg-sav-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all"
        >
          {showForm ? 'Cancelar' : <><Plus size={20} /> Nuevo Admin</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
              <input
                required
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sav-primary/20 transition-all"
                placeholder="Ej: Moisés"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telegram ID</label>
              <input
                required
                value={formData.telegram_user_id}
                onChange={e => setFormData({...formData, telegram_user_id: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sav-primary/20 transition-all"
                placeholder="Ej: 6896414316"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio de Turno (Bolivia)</label>
              <input
                type="time"
                value={formData.hora_inicio_turno}
                onChange={e => setFormData({...formData, hora_inicio_turno: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sav-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fin de Turno</label>
              <input
                type="time"
                value={formData.hora_fin_turno}
                onChange={e => setFormData({...formData, hora_fin_turno: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sav-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={e => setFormData({...formData, activo: e.target.checked})}
                className="w-4 h-4 text-sav-primary rounded focus:ring-sav-primary"
              />
              <span className="text-sm font-medium text-gray-700">Admin Activo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.recibe_notificaciones}
                onChange={e => setFormData({...formData, recibe_notificaciones: e.target.checked})}
                className="w-4 h-4 text-sav-primary rounded focus:ring-sav-primary"
              />
              <span className="text-sm font-medium text-gray-700">Recibe Notificaciones</span>
            </label>
          </div>

          <button type="submit" className="w-full bg-[#1a1f36] text-white py-3 rounded-xl font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2">
            <Save size={20} /> {editingId ? 'Actualizar' : 'Guardar'} Administrador
          </button>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Admin</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Telegram</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Horario Turno</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Estado</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {admins.map(admin => (
              <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-800">{admin.nombre}</p>
                  <p className="text-[10px] text-gray-400">{admin.rol}</p>
                </td>
                <td className="px-6 py-4">
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs text-sav-primary">{admin.telegram_user_id}</code>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} className="text-gray-400" />
                    {admin.hora_inicio_turno?.substring(0, 5)} - {admin.hora_fin_turno?.substring(0, 5)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black text-center ${admin.activo ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {admin.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                    {admin.recibe_notificaciones ? (
                      <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold">
                        <Bell size={10} /> NOTIF. ON
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] text-gray-400 font-bold">
                        <BellOff size={10} /> NOTIF. OFF
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(admin)} className="p-2 hover:bg-sav-primary/10 text-sav-primary rounded-lg transition-colors">
                      <Clock size={18} />
                    </button>
                    <button onClick={() => handleDelete(admin.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
