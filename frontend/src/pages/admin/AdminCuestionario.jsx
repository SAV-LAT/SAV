import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Save, Plus, Trash2, HelpCircle, CheckCircle2, AlertTriangle, Users } from 'lucide-react';

export default function AdminCuestionario() {
  const [config, setConfig] = useState({
    cuestionario_activo: false,
    cuestionario_data: {
      titulo: 'Cuestionario Diario Obligatorio',
      preguntas: [
        {
          id: 1,
          texto: '¿Cuál es la regla principal de la plataforma?',
          opciones: ['No compartir cuenta', 'Invertir todo', 'Invitar 100 personas'],
          respuesta_correcta: 0
        }
      ]
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [punishing, setPunishing] = useState(false);
  const [punishedUsers, setPunishedUsers] = useState([]);

  useEffect(() => {
    fetchConfig();
    fetchPunished();
  }, []);

  const fetchPunished = async () => {
    try {
      const res = await api.get('/admin/cuestionario/castigados');
      setPunishedUsers(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setPunishedUsers([]);
    }
  };

  const handleUnpunish = async (id) => {
    if (!confirm('¿Desbloquear a este usuario?')) return;
    try {
      await api.post(`/admin/cuestionario/desbloquear/${id}`);
      fetchPunished();
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await api.admin.publicContent();
      setConfig({
        cuestionario_activo: res.cuestionario_activo === true || res.cuestionario_activo === 'true',
        cuestionario_data: res.cuestionario_data || config.cuestionario_data
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.admin.updatePublicContent({
        cuestionario_activo: config.cuestionario_activo,
        cuestionario_data: config.cuestionario_data
      });
      alert('Configuración guardada correctamente');
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCastigar = async () => {
    if (!confirm('Esto bloqueará las tareas y comisiones de MAÑANA para todos los usuarios que NO hayan respondido el cuestionario de HOY. ¿Continuar?')) return;
    setPunishing(true);
    try {
      const res = await api.post('/admin/cuestionario/castigar');
      alert(`Proceso completado. Usuarios castigados: ${res.punished}`);
      fetchPunished();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setPunishing(false);
    }
  };

  const addPregunta = () => {
    const newPregunta = {
      id: Date.now(),
      texto: '',
      opciones: ['', ''],
      respuesta_correcta: 0
    };
    setConfig({
      ...config,
      cuestionario_data: {
        ...config.cuestionario_data,
        preguntas: [...config.cuestionario_data.preguntas, newPregunta]
      }
    });
  };

  const removePregunta = (id) => {
    setConfig({
      ...config,
      cuestionario_data: {
        ...config.cuestionario_data,
        preguntas: config.cuestionario_data.preguntas.filter(p => p.id !== id)
      }
    });
  };

  const updatePregunta = (id, fields) => {
    setConfig({
      ...config,
      cuestionario_data: {
        ...config.cuestionario_data,
        preguntas: config.cuestionario_data.preguntas.map(p => p.id === id ? { ...p, ...fields } : p)
      }
    });
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-black uppercase tracking-widest text-[10px]">Cargando...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Gestión de Cuestionarios</h1>
          <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px] mt-1">Configura evaluaciones diarias y castigos</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCastigar}
            disabled={punishing || !config.cuestionario_activo}
            className="bg-rose-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 disabled:opacity-50"
          >
            <Users size={16}/> Aplicar Castigos
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1a1f36] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
          >
            <Save size={16}/> Guardar Cambios
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <AlertTriangle size={24} />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-amber-800 font-black uppercase tracking-widest">Información Importante</p>
          <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed">
            Si activas el cuestionario, aparecerá un botón flotante para todos los usuarios solo en la página de Inicio. Tienen hasta las 11:59 PM para responder. 
            Al final del día, debes pulsar "Aplicar Castigos" para bloquear a quienes no respondieron.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Estado del Cuestionario</h2>
              <label className="flex items-center gap-3 cursor-pointer group">
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${config.cuestionario_activo ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {config.cuestionario_activo ? 'Activo (Visible)' : 'Inactivo (Oculto)'}
                </span>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={config.cuestionario_activo}
                    onChange={e => setConfig({...config, cuestionario_activo: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
              </label>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Título del Cuestionario</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-black text-gray-800"
                  value={config.cuestionario_data.titulo}
                  onChange={e => setConfig({...config, cuestionario_data: {...config.cuestionario_data, titulo: e.target.value}})}
                />
              </div>

              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                    <HelpCircle size={14} className="text-sav-primary" /> Preguntas ({config.cuestionario_data.preguntas.length})
                  </h3>
                  <button 
                    onClick={addPregunta}
                    className="text-[9px] font-black text-sav-primary uppercase tracking-widest hover:underline flex items-center gap-1"
                  >
                    <Plus size={14}/> Añadir Pregunta
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {Array.isArray(config.cuestionario_data?.preguntas) && config.cuestionario_data.preguntas.map((p, index) => (
                    <div key={p.id} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 space-y-6 relative group">
                      <button 
                        onClick={() => removePregunta(p.id)}
                        className="absolute top-4 right-4 text-gray-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      
                      <div className="space-y-1 pr-8">
                        <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Pregunta {index + 1}</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-100 text-sm font-black text-gray-800"
                          value={p.texto}
                          onChange={e => updatePregunta(p.id, { texto: e.target.value })}
                          placeholder="Escribe la pregunta aquí..."
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Array.isArray(p.opciones) && p.opciones.map((opt, oIndex) => (
                          <div key={oIndex} className="space-y-1">
                            <div className="flex items-center justify-between px-2">
                              <label className="text-[9px] font-black text-gray-400 uppercase">Opción {oIndex + 1}</label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input 
                                  type="radio" 
                                  name={`correcta-${p.id}`}
                                  checked={p.respuesta_correcta === oIndex}
                                  onChange={() => updatePregunta(p.id, { respuesta_correcta: oIndex })}
                                  className="w-3 h-3 text-emerald-500"
                                />
                                <span className="text-[8px] font-black uppercase text-gray-400">Correcta</span>
                              </label>
                            </div>
                            <input
                              type="text"
                              className={`w-full px-4 py-3 rounded-xl border text-xs font-bold transition-all ${p.respuesta_correcta === oIndex ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-100 text-gray-600'}`}
                              value={opt}
                              onChange={e => {
                                const newOpts = [...p.opciones];
                                newOpts[oIndex] = e.target.value;
                                updatePregunta(p.id, { opciones: newOpts });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-start">
                        <button 
                          onClick={() => {
                            const newOpts = [...(p.opciones || []), ''];
                            updatePregunta(p.id, { opciones: newOpts });
                          }}
                          className="text-[8px] font-black text-gray-400 uppercase tracking-widest hover:text-sav-primary transition-colors"
                        >
                          + Añadir Opción
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4 mb-4">Usuarios Castigados ({punishedUsers?.length || 0})</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar">
              {Array.isArray(punishedUsers) && punishedUsers.map(u => (
                <div key={u.id} className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between group">
                  <div>
                    <p className="text-xs font-black text-rose-900 uppercase tracking-tight">{u.nombre_usuario}</p>
                    <p className="text-[9px] text-rose-600 font-bold">{u.telefono}</p>
                  </div>
                  <button 
                    onClick={() => handleUnpunish(u.id)}
                    className="p-2 rounded-xl bg-white text-rose-600 shadow-sm opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                    title="Desbloquear usuario"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                </div>
              ))}
              {punishedUsers.length === 0 && (
                <p className="text-[10px] text-gray-400 text-center font-bold py-10 uppercase tracking-widest">No hay usuarios castigados</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
