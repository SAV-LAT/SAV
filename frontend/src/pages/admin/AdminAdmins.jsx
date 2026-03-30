import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { ShieldCheck, Save, Plus, Trash2, Clock, Bell, BellOff } from 'lucide-react';

export default function AdminAdmins() {
  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState('');
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
    recibe_notificaciones: true,
    qr_base64: ''
  });

  useEffect(() => {
    fetchAdmins();
    fetchUsers();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const pc = await api.get('/public-content');
      if (pc) {
        setNotifyGroupAlways(pc.notificar_grupo_recargas_siempre === 'true');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const toggleGroupNotify = async () => {
    try {
      const newValue = !notifyGroupAlways;
      await api.put('/admin/public-content', { 
        notificar_grupo_recargas_siempre: String(newValue) 
      });
      setNotifyGroupAlways(newValue);
    } catch (err) {
      alert('Error actualizando configuración: ' + err.message);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/admin/admins');
      setAdmins(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/usuarios');
      setUsers(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar tamaño máximo (2MB para QR)
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen es muy pesada. Máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData({ ...formData, qr_base64: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleUserSelect = (e) => {
    const userId = e.target.value;
    if (!userId) return;

    const selectedUser = users.find(u => u.id === userId);
    if (selectedUser) {
      setFormData({
        ...formData,
        nombre: selectedUser.nombre_usuario || selectedUser.nombre_real || '',
        telefono: selectedUser.telefono || '',
        telegram_user_id: selectedUser.telegram_user_id || '',
        telegram_username: selectedUser.telegram_username || ''
      });
    }
  };

  const toggleDia = (val) => {
    const current = (formData.dias_semana || '').split(',').filter(d => d);
    let next;
    if (current.includes(val)) {
      next = current.filter(d => d !== val);
    } else {
      next = [...current, val].sort();
    }
    setFormData({ ...formData, dias_semana: next.join(',') });
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
        recibe_notificaciones: true,
        qr_base64: '',
        dias_semana: '1,2,3,4,5'
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
      recibe_notificaciones: admin.recibe_notificaciones,
      qr_base64: admin.qr_base64 || '',
      dias_semana: admin.dias_semana || '1,2,3,4,5'
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
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1a1f36] flex items-center gap-3">
            <ShieldCheck className="text-sav-primary" />
            Admins y Turnos
          </h2>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Configura notificaciones de Telegram</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col items-start sm:items-end">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={notifyGroupAlways} onChange={toggleGroupNotify} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              <span className="ml-3 text-[10px] font-black uppercase tracking-tighter text-gray-500">Notificar Grupo Siempre</span>
            </label>
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
                recibe_notificaciones: true,
                qr_base64: '',
                dias_semana: '1,2,3,4,5'
              });
              setShowForm(!showForm);
            }}
            className="w-full sm:w-auto bg-sav-primary text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-sav-primary/20"
          >
            {showForm ? 'Cancelar' : <><Plus size={16} /> Nuevo Admin</>}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6 animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Seleccionar de Usuarios Registrados</label>
              <select 
                onChange={handleUserSelect}
                className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 text-sm focus:border-sav-primary/20 transition-all font-bold text-[#1a1f36] outline-none"
              >
                <option value="">-- Buscar un usuario --</option>
                {users
                  .filter(u => u.rol === 'admin' || u.rol === 'superadmin')
                  .map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nombre_usuario} ({u.nombre_real || 'Sin nombre real'})
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre (Confirmar)</label>
              <input
                required
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 text-sm focus:border-sav-primary/20 transition-all font-bold text-[#1a1f36] outline-none"
                placeholder="Ej: Moisés"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Teléfono</label>
              <input
                required
                value={formData.telefono}
                onChange={e => setFormData({...formData, telefono: e.target.value})}
                className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 text-sm focus:border-sav-primary/20 transition-all font-bold text-[#1a1f36] outline-none"
                placeholder="Ej: 67091817"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Telegram ID</label>
              <input
                required
                value={formData.telegram_user_id}
                onChange={e => setFormData({...formData, telegram_user_id: e.target.value})}
                className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 text-sm focus:border-sav-primary/20 transition-all font-bold text-[#1a1f36] outline-none"
                placeholder="Ej: 6896414316"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Telegram Username</label>
              <input
                value={formData.telegram_username}
                onChange={e => setFormData({...formData, telegram_username: e.target.value})}
                className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 text-sm focus:border-sav-primary/20 transition-all font-bold text-[#1a1f36] outline-none"
                placeholder="Ej: usuario_tg"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Inicio de Turno</label>
              <input
                type="time"
                value={formData.hora_inicio_turno}
                onChange={e => setFormData({...formData, hora_inicio_turno: e.target.value})}
                className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 text-sm focus:border-sav-primary/20 transition-all font-bold outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Fin de Turno</label>
              <input
                type="time"
                value={formData.hora_fin_turno}
                onChange={e => setFormData({...formData, hora_fin_turno: e.target.value})}
                className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 text-sm focus:border-sav-primary/20 transition-all font-bold outline-none"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Imagen QR de Cobro</label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 text-sm focus:border-sav-primary/20 transition-all font-bold outline-none"
                  />
                </div>
                {formData.qr_base64 && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-sm shrink-0">
                    <img src={formData.qr_base64} alt="QR Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
              <p className="text-[9px] text-gray-400 italic ml-2">* Este QR se mostrará a los usuarios cuando estés en turno.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <div className="flex-1 space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Días de Turno</label>
              <div className="flex flex-wrap gap-2">
                {diasOptions.map(d => {
                  const isSel = (formData.dias_semana || '').split(',').includes(d.val);
                  return (
                    <button
                      key={d.val}
                      type="button"
                      onClick={() => toggleDia(d.val)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${isSel ? 'bg-sav-primary text-white shadow-lg shadow-sav-primary/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                      {d.lab}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <label className="flex-1 flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={e => setFormData({...formData, activo: e.target.checked})}
                className="w-5 h-5 text-sav-primary rounded-lg focus:ring-sav-primary border-gray-300"
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">Admin Activo</span>
            </label>
            <label className="flex-1 flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={formData.recibe_notificaciones}
                onChange={e => setFormData({...formData, recibe_notificaciones: e.target.checked})}
                className="w-5 h-5 text-sav-primary rounded-lg focus:ring-sav-primary border-gray-300"
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">Recibe Notificaciones</span>
            </label>
          </div>

          <button type="submit" className="w-full bg-[#1a1f36] text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/20">
            <Save size={18} /> {editingId ? 'Actualizar' : 'Guardar'} Administrador
          </button>
        </form>
      )}

      {/* Lista de Admins - Desktop: Tabla, Mobile: Cards */}
      <div className="hidden md:block bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Administrador</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Telegram</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Horario</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Estado</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {Array.isArray(admins) && admins.filter(admin => (admin.nombre || '').toLowerCase().includes(search.toLowerCase())).map(admin => (
              <tr key={admin.id} className="hover:bg-gray-50/30 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sav-primary/10 flex items-center justify-center text-sav-primary font-black text-xs">
                      {admin.nombre?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-[#1a1f36] uppercase tracking-tighter">{admin.nombre}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{admin.telefono || 'Sin tel.'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-600">ID: {admin.telegram_user_id}</span>
                    <span className="text-[10px] text-blue-500 font-bold">@{admin.telegram_username || 'sin_username'}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-xs font-black text-gray-700">
                      {admin.hora_inicio_turno?.substring(0, 5)} - {admin.hora_fin_turno?.substring(0, 5)}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1.5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black text-center inline-block w-fit ${admin.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {admin.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                    {admin.recibe_notificaciones && (
                      <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-black uppercase">
                        <Bell size={10} /> Notif. On
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(admin)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                      <Clock size={16} />
                    </button>
                    <button onClick={() => handleDelete(admin.id)} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista Móvil: Cards */}
      <div className="md:hidden space-y-4">
        {Array.isArray(admins) && admins.filter(admin => (admin.nombre || '').toLowerCase().includes(search.toLowerCase())).map(admin => (
          <div key={admin.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sav-primary/10 flex items-center justify-center text-sav-primary font-black">
                  {admin.nombre?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1a1f36] uppercase tracking-tighter">{admin.nombre}</h3>
                  <p className="text-[10px] text-gray-400 font-bold">{admin.telefono}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[9px] font-black ${admin.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {admin.activo ? 'ACTIVO' : 'INACTIVO'}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
              <div className="space-y-1">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Telegram</p>
                <p className="text-[10px] font-bold text-gray-700">ID: {admin.telegram_user_id}</p>
                <p className="text-[10px] font-bold text-blue-500">@{admin.telegram_username || 'sin_user'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Horario Turno</p>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-700">
                  <Clock size={12} className="text-sav-primary" />
                  {admin.hora_inicio_turno?.substring(0, 5)} - {admin.hora_fin_turno?.substring(0, 5)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {admin.recibe_notificaciones && (
                  <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-black uppercase">
                    <Bell size={12} /> Notificaciones
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(admin)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl active:scale-90 transition-all">
                  <Clock size={16} />
                </button>
                <button onClick={() => handleDelete(admin.id)} className="p-3 bg-rose-50 text-rose-600 rounded-xl active:scale-90 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {admins.length === 0 && !loading && (
        <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-gray-200">
          <ShieldCheck size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No hay administradores configurados</p>
        </div>
      )}
    </div>
  );
}
