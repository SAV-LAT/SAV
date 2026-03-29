import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api.js';
import { User, Shield, ArrowUpCircle, Search, Key, Lock, X } from 'lucide-react';

export default function AdminUsuarios() {
  const [users, setUsers] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [passwords, setPasswords] = useState({ login: '', fondo: '' });

  const fetchData = useCallback(async () => {
    try {
      const [u, n, c] = await Promise.all([
        api.admin.usuarios(), 
        api.levels.list(),
        api.publicContent()
      ]);
      setUsers(u);
      setNiveles(n);
      setPublicConfig(c);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const [publicConfig, setPublicConfig] = useState({});

  const handleToggleTaskDay = async (day) => {
    const currentDays = publicConfig.task_allowed_days || '1,2,3,4,5';
    const daysArray = currentDays.split(',').filter(d => d);
    let newDays;
    if (daysArray.includes(day.toString())) {
      newDays = daysArray.filter(d => d !== day.toString()).join(',');
    } else {
      newDays = [...daysArray, day.toString()].sort().join(',');
    }
    
    try {
      await api.admin.updatePublicContent({ task_allowed_days: newDays });
      setPublicConfig({ ...publicConfig, task_allowed_days: newDays });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleWeekendUser = async (user) => {
    try {
      const newValue = !user.allow_weekend_tasks;
      await api.admin.updateUsuario(user.id, { allow_weekend_tasks: newValue });
      setUsers(users.map(u => u.id === user.id ? { ...u, allow_weekend_tasks: newValue } : u));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangeTipoLider = async (userId, nuevoTipo) => {
    try {
      await api.admin.updateUsuario(userId, { tipo_lider: nuevoTipo });
      setUsers(users.map(u => u.id === userId ? { ...u, tipo_lider: nuevoTipo } : u));
    } catch (err) {
      alert(err.message);
    }
  };

  const days = [
    { id: 1, label: 'L' },
    { id: 2, label: 'M' },
    { id: 3, label: 'X' },
    { id: 4, label: 'J' },
    { id: 5, label: 'V' },
    { id: 6, label: 'S', weekend: true },
    { id: 0, label: 'D', weekend: true },
  ];

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChangeNivel = async (userId, nuevoNivelId) => {
    if (!confirm(`¿Estás seguro de cambiar el nivel del usuario a ${nuevoNivelId}?`)) return;
    try {
      await api.admin.updateUsuario(userId, { nivel_id: nuevoNivelId });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.admin.changePassword(selectedUser.id, {
        password: passwords.login,
        password_fondo: passwords.fondo
      });
      alert('Contraseñas actualizadas con éxito');
      setSelectedUser(null);
      setPasswords({ login: '', fondo: '' });
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.nombre_usuario?.toLowerCase().includes(search.toLowerCase()) ||
    u.telefono?.includes(search)
  );

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Gestión de Usuarios</h1>
          <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px] mt-1">Control total de miembros y niveles</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Configuración Global de Días */}
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Días de Tareas Globales</span>
            <div className="flex gap-1.5">
              {days.map(day => {
                const isSelected = (publicConfig.task_allowed_days || '1,2,3,4,5').split(',').includes(day.id.toString());
                return (
                  <button
                    key={day.id}
                    onClick={() => handleToggleTaskDay(day.id)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${
                      isSelected 
                        ? 'bg-[#1a1f36] text-white shadow-lg shadow-[#1a1f36]/20' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    } ${day.weekend ? 'border-b-2 border-amber-400' : ''}`}
                    title={day.weekend ? 'Fin de semana' : ''}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="bg-[#1a1f36] text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3">
            <User size={20} className="text-white/60" />
            <span className="font-bold">{users.length} Miembros</span>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-[#1a1f36] outline-none transition-all shadow-sm font-bold text-gray-700"
        />
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Info Usuario</th>
                <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Teléfono</th>
                <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Nivel</th>
                <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Liderazgo</th>
                <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Fines de Semana</th>
                <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Saldos (T/C)</th>
                <th className="p-6 font-black text-gray-400 uppercase tracking-widest text-[10px] text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#1a1f36]/5 flex items-center justify-center text-[#1a1f36] font-black group-hover:bg-[#1a1f36] group-hover:text-white transition-all">
                        {u.nombre_usuario?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-gray-800 text-sm uppercase tracking-tighter">{u.nombre_usuario}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{u.rol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-sm font-bold text-gray-600">{u.telefono}</span>
                  </td>
                  <td className="p-6">
                    <select 
                      value={u.nivel_id} 
                      onChange={(e) => handleChangeNivel(u.id, e.target.value)}
                      className="bg-gray-50 border-2 border-gray-100 text-gray-700 text-[9px] font-black uppercase tracking-widest rounded-xl px-3 py-2 focus:border-[#1a1f36] outline-none transition-all cursor-pointer"
                    >
                      {niveles.map(n => (
                        <option key={n.id} value={n.id}>{n.nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-6">
                    <select 
                      value={u.tipo_lider || ''} 
                      onChange={(e) => handleChangeTipoLider(u.id, e.target.value)}
                      className={`border-2 text-[9px] font-black uppercase tracking-widest rounded-xl px-3 py-2 focus:border-[#1a1f36] outline-none transition-all cursor-pointer ${
                        u.tipo_lider === 'lider_premium' 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' 
                          : u.tipo_lider === 'lider' 
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' 
                          : 'bg-gray-50 border-gray-100 text-gray-400'
                      }`}
                    >
                      <option value="">Ninguno</option>
                      <option value="lider">Líder</option>
                      <option value="lider_premium">Líder Premium</option>
                    </select>
                  </td>
                  <td className="p-6">
                    <button
                      onClick={() => handleToggleWeekendUser(u)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        u.allow_weekend_tasks 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {u.allow_weekend_tasks ? 'Habilitado' : 'Deshabilitado'}
                    </button>
                  </td>
                  <td className="p-6">
                    <p className="text-[10px] font-black text-emerald-600">{(u.saldo_principal || 0).toFixed(2)}</p>
                    <p className="text-[10px] font-black text-blue-600">{(u.saldo_comisiones || 0).toFixed(2)}</p>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => setSelectedUser(u)}
                        className="p-3 rounded-xl bg-[#1a1f36]/5 text-[#1a1f36] hover:bg-[#1a1f36] hover:text-white transition-all"
                        title="Cambiar Contraseñas"
                      >
                        <Key size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-20 text-center">
            <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-xs">No se encontraron usuarios</p>
          </div>
        )}
      </div>

      {/* Modal Cambio de Contraseña */}
      {selectedUser && (
        <div className="fixed inset-0 bg-[#1a1f36]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-slideUp">
            <div className="bg-[#1a1f36] p-8 text-white flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Seguridad</h2>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Usuario: {selectedUser.nombre_usuario}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Nueva Contraseña de Login</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="text" 
                      placeholder="Dejar vacío para no cambiar"
                      value={passwords.login}
                      onChange={(e) => setPasswords({...passwords, login: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 focus:border-[#1a1f36] outline-none font-bold text-gray-700 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Nueva Contraseña de Fondos</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="text" 
                      placeholder="Dejar vacío para no cambiar"
                      value={passwords.fondo}
                      onChange={(e) => setPasswords({...passwords, fondo: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 focus:border-[#1a1f36] outline-none font-bold text-gray-700 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 rounded-[2rem] bg-[#1a1f36] text-white font-black uppercase tracking-widest shadow-xl shadow-[#1a1f36]/20 active:scale-[0.98] transition-all"
              >
                Actualizar Seguridad
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
