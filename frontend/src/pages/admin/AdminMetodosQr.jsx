import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Plus, Trash2, Upload, Eye, EyeOff, CheckCircle2, User } from 'lucide-react';

export default function AdminMetodosQr() {
  const [metodos, setMetodos] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    imagen: null,
  });
  const [loadingId, setLoadingId] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    cargarAdmins();
    cargarMetodos();
  }, []);

  const cargarAdmins = async () => {
    try {
      const res = await api.get('/admin/admins');
      setAdmins(res || []);
    } catch (e) {
      console.error('Error al cargar admins:', e);
    }
  };

  const cargarMetodos = async () => {
    try {
      const { data, error } = await api.request('/admin/metodos-qr-all');
      if (!error) setMetodos(data || []);
      else {
        const list = await api.admin.metodosQr();
        setMetodos(list);
      }
    } catch (e) {
      const list = await api.admin.metodosQr();
      setMetodos(list);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen es muy pesada. Máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, imagen: reader.result }));
    };
    reader.onerror = () => alert('Error al leer el archivo');
    reader.readAsDataURL(file);
  };

  const agregar = async () => {
    if (!selectedAdminId) return alert('Selecciona un administrador');
    if (!formData.nombre.trim()) return alert('Ingresa el nombre del titular');
    if (!formData.imagen) return alert('Sube una imagen QR');
    try {
      await api.admin.crearMetodoQr({ 
        nombre_titular: formData.nombre, 
        imagen_base64: formData.imagen,
        admin_id: selectedAdminId
      });
      setFormData({
        nombre: '',
        imagen: null,
      });
      await cargarMetodos();
    } catch (e) {
      alert(e.message || 'Error');
    }
  };

  const toggleActivo = async (id, actualActivo) => {
    setLoadingId(id);
    try {
      await api.admin.actualizarMetodoQr(id, { activo: !actualActivo });
      setMetodos(prev => prev.map(m => m.id === id ? { ...m, activo: !actualActivo } : m));
    } catch (e) {
      alert('Error al actualizar estado');
    } finally {
      setLoadingId(null);
    }
  };

  const toggleSeleccionada = async (id, adminId) => {
    setLoadingId(id);
    try {
      await api.admin.actualizarMetodoQr(id, { seleccionada: true });
      // Actualizar localmente: desmarcar otras del mismo admin
      setMetodos(prev => prev.map(m => {
        if (m.admin_id === adminId) {
          return { ...m, seleccionada: m.id === id };
        }
        return m;
      }));
    } catch (e) {
      alert('Error al seleccionar como principal');
    } finally {
      setLoadingId(null);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este método?')) return;
    try {
      await api.admin.eliminarMetodoQr(id);
      setMetodos((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      alert('Error al eliminar');
    }
  };

  const filteredMetodos = selectedAdminId 
    ? metodos.filter(m => m.admin_id === selectedAdminId)
    : metodos;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Gestión de QR por Administrador</h1>
        <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px] mt-1">Sube y gestiona los códigos de pago de cada administrador</p>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Agregar Nueva Imagen</h2>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Seleccionar Administrador</label>
                <select 
                  value={selectedAdminId}
                  onChange={(e) => setSelectedAdminId(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
                >
                  <option value="">-- Elegir Admin --</option>
                  {admins.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre del titular / Referencia</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej. Juan Pérez - Banco Unión"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Seleccionar Foto</label>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-sav-primary/30 hover:bg-sav-primary/5 transition-all group"
                  >
                    <Upload size={20} className="text-gray-400 group-hover:text-sav-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-gray-500 group-hover:text-sav-primary">
                      {formData.imagen ? 'Cambiar foto' : 'Seleccionar archivo'}
                    </span>
                  </button>
                  
                  {formData.imagen && (
                    <div className="relative group shrink-0">
                      <img src={formData.imagen} alt="Preview" className="w-24 h-24 object-contain rounded-2xl bg-gray-50 p-2 border border-gray-100" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={agregar} 
            className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-[#1a1f36] text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#1a1f36]/20 active:scale-[0.98] transition-all mt-2"
          >
            <Plus size={18} /> Subir al Almacén del Admin
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">
            {selectedAdminId 
              ? `Fotos de ${admins.find(a => a.id === selectedAdminId)?.nombre}` 
              : 'Todas las fotos en el sistema'}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMetodos.map((m) => {
            const admin = admins.find(a => a.id === m.admin_id);
            return (
              <div key={m.id} className={`bg-white rounded-[2rem] p-5 shadow-sm border ${m.seleccionada ? 'border-sav-primary' : 'border-gray-100'} flex flex-col gap-4 relative group transition-all`}>
                {m.seleccionada && (
                  <div className="absolute -top-2 -right-2 bg-sav-primary text-white p-1.5 rounded-full shadow-lg">
                    <CheckCircle2 size={16} />
                  </div>
                )}
                
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl p-2 border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                    {(m.imagen_base64 || m.imagen_qr_url) ? (
                      <img src={m.imagen_base64 || m.imagen_qr_url} alt="" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="text-[10px] text-gray-300 font-black uppercase">Sin Foto</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 text-sm uppercase tracking-tighter truncate">{m.nombre_titular}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <User size={10} className="text-gray-400" />
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">
                        {admin?.nombre || 'Global'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${m.activo ? 'bg-green-500' : 'bg-rose-500'}`} />
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${m.activo ? 'text-green-600' : 'text-rose-500'}`}>
                        {m.activo ? 'Visible' : 'Oculto'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => toggleActivo(m.id, m.activo)}
                    disabled={loadingId === m.id}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                      m.activo 
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {m.activo ? <EyeOff size={14} /> : <Eye size={14} />}
                    {m.activo ? 'Ocultar' : 'Mostrar'}
                  </button>
                  
                  {!m.seleccionada && m.admin_id && (
                    <button
                      onClick={() => toggleSeleccionada(m.id, m.admin_id)}
                      disabled={loadingId === m.id}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-sav-primary/5 text-sav-primary hover:bg-sav-primary/10 font-black text-[9px] uppercase tracking-widest transition-all"
                    >
                      Usar este
                    </button>
                  )}
                  
                  {m.seleccionada && (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-sav-primary text-white font-black text-[9px] uppercase tracking-widest">
                      Principal
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => eliminar(m.id)} 
                  className="absolute bottom-5 right-5 p-2 rounded-xl text-gray-300 hover:text-rose-500 transition-colors"
                  aria-label="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      {filteredMetodos.length === 0 && (
        <div className="bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100 p-12 text-center">
          <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">
            {selectedAdminId ? 'Este administrador no tiene fotos guardadas' : 'No hay imágenes en el sistema'}
          </p>
        </div>
      )}
    </div>
  );
}
