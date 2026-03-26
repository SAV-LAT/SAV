import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [imagenBase64, setImagenBase64] = useState(null);
  const [orden, setOrden] = useState(0);
  const fileRef = useRef(null);

  useEffect(() => {
    api.admin.banners().then(setBanners).catch(console.error).finally(() => setLoading(false));
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
    reader.onload = () => setImagenBase64(reader.result);
    reader.onerror = () => alert('Error al leer el archivo');
    reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!url && !imagenBase64) return alert('Sube una imagen o ingresa una URL');
    try {
      const b = await api.admin.crearBanner({ 
        imagen_url: url, 
        imagen_base64: imagenBase64,
        orden 
      });
      setBanners((prev) => [...prev, b].sort((a, b) => a.orden - b.orden));
      setUrl('');
      setImagenBase64(null);
      setOrden(0);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este banner?')) return;
    try {
      await api.admin.eliminarBanner(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-gray-500 font-black uppercase tracking-widest text-[10px] text-center">Cargando banners...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Gestión de Banners</h1>
        <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px] mt-1">Imágenes del carrusel principal (Home)</p>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Agregar nuevo banner</h2>
        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-sav-primary/30 hover:bg-sav-primary/5 transition-all group"
              >
                <Upload size={20} className="text-gray-400 group-hover:text-sav-primary" />
                <span className="text-xs font-black uppercase tracking-widest text-gray-500 group-hover:text-sav-primary">
                  {imagenBase64 ? 'Cambiar imagen' : 'Subir Imagen'}
                </span>
              </button>
              
              <div className="w-full sm:w-px sm:h-8 bg-gray-100 hidden sm:block" />
              
              <input
                type="url"
                placeholder="O pega una URL externa"
                className="w-full sm:flex-1 px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
              <div className="w-full sm:w-32 space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Orden</label>
                <input
                  type="number"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 text-gray-800 font-black text-sm focus:border-sav-primary/20 transition-all outline-none"
                  value={orden}
                  onChange={(e) => setOrden(parseInt(e.target.value))}
                />
              </div>
              
              {(imagenBase64 || url) && (
                <div className="w-full sm:flex-1 bg-gray-50 rounded-2xl p-2 border border-gray-100">
                  <img 
                    src={imagenBase64 || url} 
                    alt="Preview" 
                    className="h-16 w-full object-cover rounded-xl" 
                    onError={(e) => e.target.src = 'https://placehold.co/600x200?text=Error+URL'}
                  />
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleAdd} 
            className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-[#1a1f36] text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#1a1f36]/20 active:scale-[0.98] transition-all"
          >
            <Plus size={18} /> Publicar Banner
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Banners activos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((b) => (
            <div key={b.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 group relative">
              <div className="aspect-[21/9] overflow-hidden bg-gray-50 flex items-center justify-center">
                <img src={b.imagen_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sav-primary/10 flex items-center justify-center text-sav-primary">
                    <ImageIcon size={16} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Orden: {b.orden}</span>
                </div>
                <button 
                  onClick={() => handleDelete(b.id)} 
                  className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {banners.length === 0 && (
        <div className="bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100 p-12 text-center">
          <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">No hay banners configurados en el sistema</p>
        </div>
      )}
    </div>
  );
}
