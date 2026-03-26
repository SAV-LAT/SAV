import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Layout from '../components/Layout.jsx';
import Header from '../components/Header.jsx';
import { api } from '../lib/api.js';
import { TrendingUp, Info, ShieldCheck, Play, Check, Clock, Wallet, ArrowRight, X } from 'lucide-react';

/**
 * SAV v4.0.0 - RECONSTRUCCIÓN INTEGRAL
 * Una sola vista, sin rutas de detalle, lógica de video + encuesta.
 */

export default function TaskRoom() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  
  // Estados de Sala
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de Ejecución (Nueva Lógica v4)
  const [activeTask, setActiveTask] = useState(null);
  const [timer, setTimer] = useState(10);
  const [surveyVisible, setSurveyVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const videoRef = useRef(null);

  const fetchTasks = () => {
    setLoading(true);
    setError(null);
    api.tasks.list()
      .then(res => setData(res))
      .catch((err) => {
        console.error('Error cargando tareas:', err);
        setError(err.message || 'Error de conexión.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Lógica del Temporizador de 10s
  useEffect(() => {
    let interval;
    if (activeTask && !surveyVisible && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && activeTask) {
      setSurveyVisible(true);
    }
    return () => clearInterval(interval);
  }, [activeTask, surveyVisible, timer]);

  // Manejo de Inicio de Tarea
  const startTask = async (task) => {
    setLoading(true);
    try {
      const fullTask = await api.tasks.get(task.id);
      setActiveTask(fullTask);
      setTimer(10);
      setSurveyVisible(false);
      setSelectedOption('');
      setIsCorrect(false);
      setVideoFinished(false);
      setErrorMessage('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Error al abrir tarea:", err);
    } finally {
      setLoading(false);
    }
  };

  // Manejo de Confirmación de Encuesta
  const onConfirmResponse = async () => {
    if (!selectedOption || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await api.tasks.responder(activeTask.id, selectedOption);
      if (res.correcta) {
        setIsCorrect(true);
        refreshUser();
      } else {
        setErrorMessage('Respuesta incorrecta. Analiza el video.');
        setSelectedOption('');
      }
    } catch (err) {
      setErrorMessage('Error al validar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Finalización y Salida
  useEffect(() => {
    if (videoFinished && isCorrect) {
      const timeout = setTimeout(() => {
        setActiveTask(null);
        fetchTasks();
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [videoFinished, isCorrect]);

  if (loading && !activeTask) {
    return (
      <Layout>
        <Header title="sala de tareas" />
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-white">
          <div className="w-12 h-12 border-4 border-[#1a1f36] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">SAV Engine v4.0...</p>
        </div>
      </Layout>
    );
  }

  if ((error || !data) && !activeTask) {
    return (
      <Layout>
        <Header title="sala de tareas" />
        <div className="p-8 text-center space-y-6 flex flex-col items-center justify-center min-h-[60vh] bg-white">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center shadow-xl border border-rose-100">
            <Info size={40} />
          </div>
          <h2 className="text-xl font-black text-[#1a1f36] uppercase tracking-tighter">Ocurrió un error</h2>
          <p className="text-sm text-gray-400 font-medium">{error}</p>
          <button onClick={fetchTasks} className="px-8 py-4 rounded-2xl bg-[#1a1f36] text-white font-black uppercase text-[10px]">Reintentar</button>
        </div>
      </Layout>
    );
  }

  // --- VISTA DE EJECUCIÓN (TODO EN UNO) ---
  if (activeTask) {
    const options = activeTask.opciones || [];
    return (
      <Layout hideNav={true}>
        <div className="bg-[#f8f9fc] min-h-screen pb-40">
          <header className="sticky top-0 z-30 bg-[#1a1f36] flex items-center justify-between px-5 py-4 border-b border-white/5 shadow-lg">
            <button onClick={() => setActiveTask(null)} className="p-2 -ml-2 rounded-xl bg-white/10 text-white active:scale-90 transition-transform">
              <X size={20} />
            </button>
            <h1 className="font-black text-white text-xs uppercase tracking-[0.2em]">Ejecución v4.0.1</h1>
            <div className="w-10" />
          </header>

          <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
            {/* VIDEO (SIN OVERLAYS) */}
            <section className="w-full aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-white relative">
              <video 
                ref={videoRef}
                className="w-full h-full object-cover" 
                src={api.getMediaUrl(activeTask.video_url)} 
                controls 
                autoPlay 
                playsInline 
                onEnded={() => setVideoFinished(true)} 
                onCanPlay={(e) => { e.target.muted = false; e.target.play().catch(()=>{}); }} 
              />
            </section>

            {/* ESTADO DE VALIDACIÓN */}
            {!isCorrect && !surveyVisible && (
              <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100 flex items-center justify-between shadow-sm animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#00C853]/10 flex items-center justify-center border border-[#00C853]/20">
                    <Clock size={20} className="text-[#00C853]" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Validación de Visualización</span>
                    <span className="block text-xs text-[#1a1f36] font-bold">Observa para activar encuesta...</span>
                  </div>
                </div>
                <div className="bg-[#1a1f36] text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">
                  {timer}
                </div>
              </div>
            )}

            {/* DESCRIPCIÓN (INGLÉS) */}
            <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-[#1a1f36] flex items-center justify-center shrink-0 shadow-lg rotate-3">
                <ShieldCheck className="text-white" size={28} />
              </div>
              <div>
                <h3 className="text-[11px] font-black text-[#1a1f36] uppercase tracking-[0.2em] mb-1">Video Content</h3>
                <p className="text-[12px] text-gray-500 font-medium italic border-l-2 border-[#1a1f36] pl-3">
                  "{activeTask.descripcion}"
                </p>
              </div>
            </section>

            {/* ENCUESTA (DEBAJO DEL VIDEO) */}
            {surveyVisible && !isCorrect && (
              <section className="bg-white rounded-[3rem] p-10 shadow-2xl border-2 border-[#1a1f36]/5 animate-slideUp">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-black text-[#1a1f36] uppercase tracking-tighter mb-1">
                    {activeTask.pregunta_real || 'Identify the Brand'}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">Responde para recibir tu pago</p>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-10">
                  {options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(opt)}
                      className={`group w-full py-6 px-8 rounded-[1.8rem] text-xs font-black uppercase tracking-widest transition-all text-left flex items-center justify-between border-2 ${
                        selectedOption === opt ? 'bg-[#1a1f36] text-white border-[#1a1f36] shadow-xl translate-x-3' : 'bg-white text-gray-400 border-gray-100 hover:border-[#1a1f36]/20 hover:text-[#1a1f36]'
                      }`}
                    >
                      <span>{opt}</span>
                      <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${selectedOption === opt ? 'border-white bg-white/20' : 'border-gray-200'}`}>
                        {selectedOption === opt && <Check size={14} className="text-white" />}
                      </div>
                    </button>
                  ))}
                </div>

                {errorMessage && (
                  <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-[1.5rem] text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">
                    {errorMessage}
                  </div>
                )}

                <button
                  onClick={onConfirmResponse}
                  disabled={!selectedOption || isSubmitting}
                  className="w-full py-6 rounded-[2rem] bg-[#1a1f36] text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                >
                  {isSubmitting ? 'Verificando...' : 'Confirmar y Cobrar'}
                </button>
              </section>
            )}

            {/* ÉXITO */}
            {isCorrect && (
              <section className="bg-white p-12 rounded-[3.5rem] border-4 border-[#00C853]/20 text-center animate-fade-in shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-3 bg-[#00C853]" />
                <div className="w-24 h-24 bg-[#00C853] rounded-[2.5rem] mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-[#00C853]/40 border-4 border-white rotate-6">
                  <Check className="text-white" size={48} strokeWidth={4} />
                </div>
                <h3 className="font-black text-[#1a1f36] text-2xl uppercase mb-3 tracking-tighter">¡Pago Verificado!</h3>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.25em] mb-10 italic">Acreditado en Billetera de Activos</p>
                <div className="bg-[#f8f9fc] py-6 px-10 rounded-[2.5rem] border border-gray-100 inline-flex items-center gap-4 mb-10 shadow-inner">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-md"><Wallet size={20} className="text-[#1a1f36]" /></div>
                  <div className="text-left">
                    <span className="block text-[36px] font-black text-[#1a1f36] leading-none tracking-tighter">+{activeTask.recompensa}</span>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Moneda: BOB</span>
                  </div>
                </div>
                {!videoFinished && (
                  <p className="text-[10px] font-black text-[#1a1f36]/40 uppercase tracking-[0.3em] animate-pulse italic">
                    Espera a que el video finalice para salir...
                  </p>
                )}
              </section>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // --- VISTA DE SALA (LISTA) ---
  const total = data.tareas_completadas + data.tareas_restantes || 1;
  const progress = (data.tareas_completadas / total) * 100;

  return (
    <Layout>
      <Header title="sala de tareas" />
      <div className="p-4 space-y-4 bg-white min-h-screen">
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black text-[#1a1f36] uppercase tracking-tight">{data.nivel}</h2>
            <div className="px-3 py-1 bg-[#00C853]/10 text-[#00C853] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#00C853]/10">Estado: Activo</div>
          </div>
          <div className="flex justify-between text-[10px] font-black text-gray-400 mb-2 px-1 uppercase tracking-widest">
            <span>completadas {data.tareas_completadas}</span>
            <span>restantes {data.tareas_restantes}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
            <div className="h-full bg-gradient-to-r from-[#1a1f36] to-[#2a2f46] rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          {data.mensaje && (
            <div className="mt-6 p-5 bg-gray-50 text-[#1a1f36] rounded-2xl border border-gray-100 flex flex-col gap-4">
              <p className="text-sm font-medium text-gray-600">{data.mensaje}</p>
              <Link to="/vip" className="w-full py-4 bg-[#1a1f36] text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center gap-2">Subir de Nivel Ahora</Link>
            </div>
          )}
        </div>

        <div className="space-y-3 pb-24">
          {data.tareas && data.tareas.length > 0 ? (
            data.tareas.map((t) => (
              <div
                key={t.id}
                onClick={() => startTask(t)}
                className="flex gap-4 p-3 bg-white rounded-[1.5rem] border border-gray-100 shadow-lg active:scale-[0.98] transition-all group cursor-pointer"
              >
                <div className="w-24 h-24 rounded-2xl bg-gray-50 flex-shrink-0 overflow-hidden relative border border-gray-100">
                  <img src="/imag/logo.jpeg" alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1a1f36]/20 group-hover:bg-[#1a1f36]/40 transition-colors z-20">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                      <Play className="text-white ml-1" size={24} fill="white" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 py-1 flex flex-col justify-between overflow-hidden">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-block px-3 py-1 rounded-full bg-[#1a1f36]/5 text-[#1a1f36] text-[9px] font-black uppercase tracking-widest border border-[#1a1f36]/10">{t.nivel || data.nivel}</span>
                      <p className="text-[#1a1f36] font-black text-sm tracking-tight">+{t.recompensa} BOB</p>
                    </div>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-tight truncate">{t.nombre}</p>
                    <p className="text-gray-400 text-[9px] font-medium line-clamp-1 italic leading-tight">Video publicitario verificado</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-gray-400 text-[8px] font-black uppercase tracking-[0.2em]">Realizar ahora</p>
                    <ArrowRight size={14} className="text-[#1a1f36]/30 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            !data.mensaje && (
              <div className="text-center p-12 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No hay tareas disponibles hoy.</p>
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  );
}
