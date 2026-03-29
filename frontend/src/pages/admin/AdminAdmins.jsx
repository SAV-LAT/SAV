import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { ShieldCheck, Save, Plus, Trash2, Clock, Bell, BellOff } from 'lucide-react';

export default function AdminAdmins() {
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notifyGroupAlways, setNotifyGroupAlways] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    telegram_user_id: '',
    telegram_username: '',
    hora_inicio_turno: '00:00',
    hora_fin_turno: '23:59',
    activo: true,
    recibe_notificaciones: true
  });

  useEffect(() => {
    fetchAdmins();
    fetchUsers();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const pc = await api.get('/public-content');
      setNotifyGroupAlways(pc.notificar_grupo_recargas_siempre === 'true');
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const toggleGroupNotify = async () => {
    try {
      const newValue = !notifyGroupAlways;
      await api.put('/admin/contenido-home', { 
        notificar_grupo_recargas_siempre: String(newValue) 
      });
      setNotifyGroupAlways(newValue);
    } catch (err) {
      alert('Error actualizando configuración');
    }
  };

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

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/usuarios');
      // Solo nos interesan los que tienen rol admin para el selector, 
      // pero el usuario pidió poder seleccionar de los guardados.
      // Si el backend ya filtra por admin en /admin/usuarios (o si queremos todos), 
      // lo manejamos aquí. Por ahora traemos todos para que el admin elija.
      setUsers(res);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleUserSelect = (e) => {
    const userId = e.target.value;
    if (!userId) return;

    const selectedUser = users.find(u => u.id === userId);
    if (selectedUser) {
      const existingAdmin = admins.find(a => a.nombre === selectedUser.nombre_usuario || a.telefono === selectedUser.telefono);
      setFormData({
        ...formData,
        nombre: selectedUser.nombre_usuario || selectedUser.nombre_real || '',
        telefono: selectedUser.telefono || '',
        telegram_user_id: existingAdmin?.telegram_user_id || selectedUser.telegram_user_id || ''
      });
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
        telefono: '',
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
    setEditingId(admin.id);
    setFormData({
      nombre: admin.nombre,
      telefono: admin.telefono || '',
      telegram_user_id: admin.telegram_user_id,
      telegram_username: admin.telegram_username || '',
      hora_inicio_turno: admin.hora_inicio_turno?.substring(0, 5) || '00:00',
      hora_fin_turno: admin.hora_fin_turno?.substring(0, 5) || '23:59',
      activo: admin.activo,
      recibe_notificaciones: admin.recibe_notificaciones
    });
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
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={notifyGroupAlways} onChange={toggleGroupNotify} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              <span className="ml-3 text-xs font-black uppercase tracking-tighter text-gray-500">Notificar Grupo Siempre</span>
            </label>
            <p className="text-[9px] text-gray-400 italic">Si está activo, las recargas llegarán al admin en turno Y al grupo.</p>
          </div>
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({
                nombre: '',
                telefono: '',
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
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Seleccionar de Usuarios Registrados</label>
              <select 
                onChange={handleUserSelect}
                className="w-full bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sav-primary/20 transition-all font-bold text-[#1a1f36]"
              >
                <option value="">-- Buscar un usuario --</option>
                {users
                  .filter(u => u.rol === 'admin' || u.rol === 'superadmin')
                  .map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nombre_usuario} ({u.nombre_real || 'Sin nombre real'}) - {u.rol}
                    </option>
                  ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1 italic">* Solo se muestran usuarios con rol de administrador o superior.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre (Confirmar)</label>
              <input
                required
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sav-primary/20 transition-all font-bold text-[#1a1f36]"
                placeholder="Ej: Moisés"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
              <input
                required
                value={formData.telefono}
                onChange={e => setFormData({...formData, telefono: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sav-primary/20 transition-all font-bold text-[#1a1f36]"
                placeholder="Ej: 67091817"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telegram ID</label>
              <input
                required
                value={formData.telegram_user_id}
                onChange={e => setFormData({...formData, telegram_user_id: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sav-primary/20 transition-all font-bold text-[#1a1f36]"
                placeholder="Ej: 6896414316"
              />
              <p className="text-[9px] text-blue-500 mt-1">Obtén el ID enviando /id al bot @userinfobot</p>
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
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#1a1f36]">{admin.nombre}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{admin.telefono || 'Sin tel.'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-600">ID: {admin.telegram_user_id}</span>
                    {admin.telegram_username && (
                      <span className="text-[10px] text-blue-500">@{admin.telegram_username}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-700">
                      {admin.hora_inicio_turno?.substring(0, 5)} - {admin.hora_fin_turno?.substring(0, 5)}
                    </span>
                  </div>
                  {admin.en_turno_recarga && (
                    <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-tighter">
                      ⚡ En Turno (QR)
                    </span>
                  )}
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
