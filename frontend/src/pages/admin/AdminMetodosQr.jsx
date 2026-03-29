import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Plus, Trash2, Upload } from 'lucide-react';

export default function AdminMetodosQr() {
  const [metodos, setMetodos] = useState([]);
  const [nombre, setNombre] = useState('');
  const [imagen, setImagen] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    api.admin.metodosQr().then(setMetodos).catch(() => []);
  }, []);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    
    // Limitar tamaño a 2MB para evitar errores de red en móviles
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen es muy pesada. Máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagen(reader.result);
    };
    reader.onerror = () => alert('Error al leer el archivo');
    reader.readAsDataURL(file);
  };

  const agregar = async () => {
    if (!nombre.trim()) return alert('Ingresa el nombre del titular');
    if (!imagen) return alert('Sube una imagen QR');
    try {
      await api.admin.crearMetodoQr({ nombre_titular: nombre, imagen_base64: imagen });
      // Refrescar lista completa desde el servidor para asegurar sincronización
      const list = await api.admin.metodosQr();
      setMetodos(list);
      setNombre('');
      setImagen(null);
    } catch (e) {
      alert(e.message || 'Error');
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este método?')) return;
    await api.admin.eliminarMetodoQr(id);
    setMetodos((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Imágenes de Recarga (QR)</h1>
        <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px] mt-1">Configura los métodos de pago para usuarios</p>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Agregar nuevo método</h2>
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre del titular</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Imagen del código QR</label>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-sav-primary/30 hover:bg-sav-primary/5 transition-all group"
              >
                <Upload size={20} className="text-gray-400 group-hover:text-sav-primary" />
                <span className="text-xs font-black uppercase tracking-widest text-gray-500 group-hover:text-sav-primary">
                  {imagen ? 'Cambiar imagen' : 'Seleccionar QR'}
                </span>
              </button>
              
              {imagen && (
                <div className="relative group shrink-0">
                  <img src={imagen} alt="Preview" className="w-24 h-24 object-contain rounded-2xl bg-gray-50 p-2 border border-gray-100" />
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-[8px] text-white font-black uppercase">Vista previa</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={agregar} 
            className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-[#1a1f36] text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#1a1f36]/20 active:scale-[0.98] transition-all mt-2"
          >
            <Plus size={18} /> Confirmar y Guardar
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Métodos actuales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metodos.map((m) => (
            <div key={m.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex flex-col gap-4 relative group">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-50 rounded-2xl p-2 border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                  {(m.imagen_base64 || m.imagen_qr_url) ? (
                    <img src={m.imagen_base64 || m.imagen_qr_url} alt="" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-[10px] text-gray-300 font-black uppercase">Sin QR</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-800 text-sm uppercase tracking-tighter truncate">{m.nombre_titular}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${m.activo ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{m.activo ? 'En línea' : 'Inactivo'}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => eliminar(m.id)} 
                className="absolute top-4 right-4 p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                aria-label="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {metodos.length === 0 && (
        <div className="bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100 p-12 text-center">
          <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">No hay métodos de recarga configurados</p>
        </div>
      )}
    </div>
  );
}
