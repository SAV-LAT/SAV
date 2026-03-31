import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Plus, Trash2, Upload, Eye, EyeOff, CheckCircle2, User, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function AdminMetodosQr() {
  const [metodos, setMetodos] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    imagen: null,
  });
  const [loadingId, setLoadingId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      const data = await api.request('/admin/metodos-qr-all');
      setMetodos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error al cargar metodos qr:', e);
      try {
        const list = await api.admin.metodosQr();
        setMetodos(Array.isArray(list) ? list : []);
      } catch (err) {
        setMetodos([]);
      }
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }
    
    setIsProcessing(true);
    try {
      // Opciones de compresión optimizadas para QR (mantener nitidez pero reducir peso)
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.85
      };

      console.log(`[QR] Comprimiendo imagen original: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      const compressedFile = await imageCompression(file, options);
      console.log(`[QR] Imagen optimizada: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);

      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, imagen: reader.result }));
        setIsProcessing(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error('Error procesando imagen:', err);
      alert('No se pudo procesar la imagen. Intenta con otra o una captura de pantalla.');
      setIsProcessing(false);
    }
  };

  const agregar = async () => {
    if (!selectedAdminId) return alert('Selecciona un administrador');
    if (!formData.nombre.trim()) return alert('Ingresa el nombre del titular o referencia');
    if (!formData.imagen) return alert('Sube una imagen QR');
    
    setIsSaving(true);
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
      // Reset input file
      if (fileRef.current) fileRef.current.value = '';
      await cargarMetodos();
      alert('¡QR subido exitosamente!');
    } catch (e) {
      alert(e.response?.data?.error || e.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
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
    if (!confirm('¿Eliminar este método definitivamente?')) return;
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
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">Gestión de QR Móvil</h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[9px] md:text-[10px] mt-2 bg-gray-100 inline-block px-3 py-1 rounded-full">Optimización automática para celulares activa</p>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-gray-200/50 border border-gray-100 mb-8">
        <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
          <Plus size={14} /> Nueva Imagen de Cobro
        </h2>
        
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">1. Administrador en Turno</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sav-primary transition-colors" size={18} />
                  <select 
                    value={selectedAdminId}
                    onChange={(e) => setSelectedAdminId(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] bg-gray-50 border-2 border-transparent focus:border-sav-primary/20 focus:bg-white text-gray-800 font-black text-xs uppercase tracking-tighter transition-all outline-none appearance-none shadow-inner"
                  >
                    <option value="">-- SELECCIONAR ADMIN --</option>
                    {admins.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">2. Nombre del titular / Banco</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej. MARIA LOPEZ - BANCO UNION"
                  className="w-full px-6 py-5 rounded-[1.5rem] bg-gray-50 border-2 border-transparent focus:border-sav-primary/20 focus:bg-white text-gray-800 font-black text-xs uppercase tracking-tighter transition-all outline-none shadow-inner placeholder:text-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">3. Imagen del Código QR</label>
              <div className="flex flex-col gap-4">
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    disabled={isProcessing || isSaving}
                    onClick={() => fileRef.current?.click()}
                    className={`h-40 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all active:scale-95 ${
                      formData.imagen 
                        ? 'border-emerald-200 bg-emerald-50/30 text-emerald-600' 
                        : 'border-gray-200 bg-gray-50/50 text-gray-400 hover:border-sav-primary/30 hover:bg-sav-primary/5'
                    }`}
                  >
                    {isProcessing ? (
                      <Loader2 size={32} className="animate-spin text-sav-primary" />
                    ) : (
                      <Upload size={32} className={formData.imagen ? 'text-emerald-500' : ''} />
                    )}
                    <span className="text-[9px] font-black uppercase tracking-widest text-center px-4">
                      {isProcessing ? 'Optimizando para móvil...' : formData.imagen ? 'Imagen Cargada ✓' : 'Tocar para subir foto o captura'}
                    </span>
                  </button>
                  
                  <div className="h-40 rounded-[2rem] bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden relative group shadow-inner">
                    {formData.imagen ? (
                      <>
                        <img src={formData.imagen} alt="Preview" className="w-full h-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[8px] font-black text-white uppercase tracking-widest bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">Vista Previa</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <ImageIcon size={32} />
                        <span className="text-[8px] font-black uppercase">Sin imagen</span>
                      </div>
                    )}
                  </div>
                </div>
                {formData.imagen && !isProcessing && (
                  <p className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-1 self-center">
                    <Sparkles size={10} /> Imagen optimizada lista para el servidor
                  </p>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={agregar} 
            disabled={isSaving || isProcessing || !formData.imagen || !selectedAdminId}
            className={`w-full flex items-center justify-center gap-3 py-6 rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl transition-all active:scale-95 ${
              isSaving || isProcessing || !formData.imagen || !selectedAdminId
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-[#1a1f36] text-white hover:bg-[#252b45] shadow-indigo-900/20'
            }`}
          >
            {isSaving ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Plus size={20} />
            )}
            {isSaving ? 'Guardando en la nube...' : 'Subir al Almacén del Admin'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 px-4">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-sav-primary rounded-full animate-pulse" />
            {selectedAdminId 
              ? `Galería de ${admins.find(a => a.id === selectedAdminId)?.nombre}` 
              : 'Repositorio Global de QRs'}
          </h2>
          <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Total: {filteredMetodos.length} imágenes</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMetodos.map((m) => {
            const admin = admins.find(a => a.id === m.admin_id);
            return (
              <div key={m.id} className={`bg-white rounded-[2.5rem] p-6 shadow-xl shadow-gray-200/30 border-2 transition-all relative group overflow-hidden ${m.seleccionada ? 'border-sav-primary ring-4 ring-sav-primary/5' : 'border-transparent hover:border-gray-100'}`}>
                {m.seleccionada && (
                  <div className="absolute top-0 right-0 bg-sav-primary text-white px-4 py-1.5 rounded-bl-2xl shadow-lg z-10">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span className="text-[8px] font-black uppercase tracking-widest">Activo Principal</span>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col gap-6">
                  <div className="w-full aspect-square bg-gray-50 rounded-[2rem] p-4 border border-gray-100 flex items-center justify-center relative overflow-hidden group/img shadow-inner">
                    {(m.imagen_base64 || m.imagen_qr_url) ? (
                      <img src={m.imagen_base64 || m.imagen_qr_url} alt="" className="w-full h-full object-contain group-hover/img:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="text-[10px] text-gray-300 font-black uppercase flex flex-col items-center gap-2">
                        <ImageIcon size={24} />
                        Sin Foto
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="min-w-0">
                      <p className="font-black text-gray-800 text-sm uppercase tracking-tighter truncate leading-none mb-1">{m.nombre_titular}</p>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                          <User size={10} className="text-gray-400" />
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest truncate max-w-[80px]">
                            {admin?.nombre || 'Global'}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${m.activo ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                          <div className={`w-1 h-1 rounded-full ${m.activo ? 'bg-green-500' : 'bg-rose-500'}`} />
                          <p className="text-[8px] font-black uppercase tracking-widest">
                            {m.activo ? 'Visible' : 'Oculto'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => toggleActivo(m.id, m.activo)}
                        disabled={loadingId === m.id}
                        className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 ${
                          m.activo 
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {loadingId === m.id ? <Loader2 size={12} className="animate-spin" /> : m.activo ? <EyeOff size={14} /> : <Eye size={14} />}
                        {m.activo ? 'Ocultar' : 'Mostrar'}
                      </button>
                      
                      {!m.seleccionada && m.admin_id && (
                        <button
                          onClick={() => toggleSeleccionada(m.id, m.admin_id)}
                          disabled={loadingId === m.id}
                          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-sav-primary/5 text-sav-primary hover:bg-sav-primary/10 font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 border border-sav-primary/10"
                        >
                          {loadingId === m.id ? <Loader2 size={12} className="animate-spin" /> : 'Usar Principal'}
                        </button>
                      )}
                      
                      {m.seleccionada && (
                        <div className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-sav-primary text-white font-black text-[9px] uppercase tracking-widest shadow-lg shadow-sav-primary/20">
                          Principal ✓
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => eliminar(m.id)} 
                  className="absolute bottom-6 right-6 p-2.5 rounded-xl text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-40 hover:opacity-100"
                  aria-label="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      {filteredMetodos.length === 0 && (
        <div className="bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200 p-16 text-center">
          <ImageIcon size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">
            {selectedAdminId ? `Este administrador (${admins.find(a => a.id === selectedAdminId)?.nombre}) no tiene fotos guardadas` : 'No hay imágenes en el sistema'}
          </p>
        </div>
      )}
    </div>
  );
}
