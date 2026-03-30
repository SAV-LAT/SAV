import { useState, useEffect } from 'react';
import { HelpCircle, X, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { api } from '../lib/api';

export default function FloatingQuestionnaire() {
  const [showModal, setShowModal] = useState(false);
  const [cuestionario, setCuestionario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [respuestas, setRespuestas] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCuestionario();
  }, []);

  const fetchCuestionario = async () => {
    try {
      const res = await api.get('/users/cuestionario');
      if (res && res.activo && !res.ya_respondio) {
        setCuestionario(res.datos);
      } else {
        setCuestionario(null);
      }
    } catch (err) {
      console.error('Error fetching questionnaire:', err);
      setCuestionario(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(respuestas).length < cuestionario.preguntas.length) {
      alert('Por favor responde todas las preguntas');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/users/cuestionario/responder', { respuestas });
      alert('¡Cuestionario enviado con éxito!');
      setShowModal(false);
      setCuestionario(null);
    } catch (err) {
      alert('Error: ' + err.message);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !cuestionario) return null;

  return (
    <>
      {/* Botón Flotante */}
      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-6 z-[60] w-14 h-14 bg-amber-500 text-white rounded-full shadow-2xl shadow-amber-500/40 flex items-center justify-center animate-bounce hover:scale-110 active:scale-95 transition-all"
      >
        <HelpCircle size={30} />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black">1</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-[#0a0c1a]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-slideUp max-h-[90vh] flex flex-col">
            <div className="bg-amber-500 p-8 text-white relative">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-black uppercase tracking-tighter leading-none mb-2">{cuestionario.titulo}</h2>
              <p className="text-white/80 text-[10px] font-black uppercase tracking-widest">Responde antes de las 11:59 PM para evitar sanciones</p>
            </div>

            <div className="p-6 bg-rose-50 border-b border-rose-100 flex items-start gap-3">
              <AlertTriangle className="text-rose-600 shrink-0" size={18} />
              <p className="text-[10px] text-rose-700 font-bold uppercase leading-relaxed">
                ¡Atención! Si no envías este cuestionario hoy, mañana no podrás realizar tareas ni recibir comisiones de ningún tipo.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                {cuestionario.preguntas.map((p, pIndex) => (
                  <div key={p.id} className="space-y-4">
                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-black shrink-0">{pIndex + 1}</span>
                      <h3 className="text-sm font-black text-gray-800 leading-tight">{p.texto}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 ml-9">
                      {p.opciones.map((opt, oIndex) => (
                        <label 
                          key={oIndex}
                          className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${respuestas[p.id] === oIndex ? 'bg-amber-50 border-amber-500' : 'bg-gray-50 border-gray-50 hover:border-gray-200'}`}
                        >
                          <input 
                            type="radio"
                            name={`q-${p.id}`}
                            className="sr-only"
                            checked={respuestas[p.id] === oIndex}
                            onChange={() => setRespuestas({...respuestas, [p.id]: oIndex})}
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${respuestas[p.id] === oIndex ? 'border-amber-500 bg-amber-500' : 'border-gray-300'}`}>
                            {respuestas[p.id] === oIndex && <div className="w-2 h-2 bg-white rounded-full"></div>}
                          </div>
                          <span className={`text-xs font-bold ${respuestas[p.id] === oIndex ? 'text-amber-700' : 'text-gray-600'}`}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100">
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full py-5 rounded-[2rem] bg-amber-500 text-white font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? 'Enviando...' : <><Send size={18}/> Enviar Respuestas</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
