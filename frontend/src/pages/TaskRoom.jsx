import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Layout from '../components/Layout.jsx';
import Header from '../components/Header.jsx';
import { api } from '../lib/api.js';
import { TrendingUp, Info, ShieldCheck, Play, Check, Clock, Wallet, ArrowRight, X, Sparkles, AlertCircle, ClipboardList } from 'lucide-react';

/**
 * SAV v4.1.0 - RECONSTRUCCIÓN INTEGRAL Y MODERNA
 * Una sola vista, experiencia tipo app móvil, animaciones fluidas.
 */

export default function TaskRoom() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  
  // Estados de Sala
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de Ejecución
  const [activeTask, setActiveTask] = useState(null);
  const [timer, setTimer] = useState(10);
  const [surveyVisible, setSurveyVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showResult, setShowResult] = useState(false);

  const videoRef = useRef(null);

  const fetchTasks = () => {
    setLoading(true);
    setError(null);
    api.tasks.list()
      .then(res => {
        setData(res);
        // Si hay un mensaje de fin de semana o error de nivel, mostrarlo
        if (res.error) setError(res.error);
      })
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
    } else if (timer === 0 && activeTask && !surveyVisible) {
      setSurveyVisible(true);
    }
    return () => clearInterval(interval);
  }, [activeTask, surveyVisible, timer]);

  // Manejo de Inicio de Tarea
  const startTask = async (task) => {
    if (data.tareas_restantes <= 0) {
      alert("Has alcanzado tu límite diario de tareas.");
      return;
    }
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
      setShowResult(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Error al abrir tarea:", err);
      alert("Error al cargar el detalle de la tarea.");
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
      setShowResult(true);
      if (res.correcta) {
        setIsCorrect(true);
        refreshUser();
      } else {
        setIsCorrect(false);
        setErrorMessage('Respuesta incorrecta. Tarea registrada sin recompensa.');
      }
      
      // Auto-regreso después de mostrar el resultado
      setTimeout(() => {
        setActiveTask(null);
        fetchTasks();
        refreshUser();
      }, 3500);

    } catch (err) {
      setErrorMessage(err.message || 'Error al validar la respuesta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !activeTask) {
    return (
      <Layout>
        <Header title="SALA DE TAREAS" />
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-16 h-16 border-4 border-[#1a1f36] border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-[#1a1f36] font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Sincronizando con SAV Cloud...</p>
        </div>
      </Layout>
    );
  }

  if (error && !activeTask) {
    return (
      <Layout>
        <Header title="SALA DE TAREAS" />
        <div className="p-8 text-center space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl border-2 border-rose-100">
            <AlertCircle size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#1a1f36] uppercase tracking-tighter">Acceso Restringido</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed max-w-[250px] mx-auto">
              {error}
            </p>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="px-10 py-4 rounded-2xl bg-[#1a1f36] text-white font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all"
          >
            Volver al Inicio
          </button>
        </div>
      </Layout>
    );
  }

  // --- VISTA BLOQUEADO (PASANTE 3 DÍAS) ---
  if (data?.bloqueado) {
    return (
      <Layout>
        <Header title="SALA DE TAREAS" />
        <div className="p-8 text-center space-y-8 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="relative">
            <div className="absolute -inset-4 bg-rose-500/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-32 h-32 bg-white text-rose-500 rounded-[3rem] flex items-center justify-center shadow-2xl border-4 border-rose-50">
              <ShieldCheck size={64} strokeWidth={1.5} />
            </div>
          </div>
          
          <div className="space-y-4 max-w-xs mx-auto">
            <h2 className="text-3xl font-black text-[#1a1f36] uppercase tracking-tighter leading-none">Periodo Finalizado</h2>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] leading-relaxed">
              {data.mensaje}
            </p>
          </div>

          <div className="w-full max-w-[280px] bg-[#1a1f36] p-8 rounded-[2.5rem] shadow-2xl border border-white/5 space-y-6">
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Sparkles size={20} />
              </div>
              <div>
                <span className="block text-[8px] font-black text-white/40 uppercase tracking-widest">Beneficio VIP</span>
                <span className="block text-xs font-bold text-white">Tareas ilimitadas por un año</span>
              </div>
            </div>
            <Link 
              to="/vip" 
              className="block w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Mejorar a S1 ahora
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // --- VISTA DE EJECUCIÓN (MODERNA Y FLUIDA) ---
  if (activeTask) {
    const options = activeTask.opciones || [];
    return (
      <Layout hideNav={true}>
        <div className="bg-gray-50 min-h-screen pb-20 animate-fade-in">
          {/* Header de Ejecución */}
          <header className="sticky top-0 z-40 bg-[#1a1f36] flex items-center justify-between px-6 py-5 border-b border-white/10 shadow-2xl backdrop-blur-md">
            <button 
              onClick={() => {
                if (window.confirm("¿Deseas abandonar la tarea? El progreso se perderá.")) {
                  setActiveTask(null);
                }
              }} 
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white active:scale-90 transition-all border border-white/10"
            >
              <X size={20} />
            </button>
            <div className="text-center">
              <h1 className="font-black text-white text-[10px] uppercase tracking-[0.3em]">Módulo de Publicidad</h1>
              <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Verificación en Curso</span>
            </div>
            <div className="w-10" />
          </header>

          <div className="max-w-xl mx-auto px-5 py-8 space-y-8">
            {/* VIDEO SECTION */}
            <section className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-[3rem] blur-xl opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              <div className="relative aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-white ring-1 ring-black/5">
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover" 
                  src={api.getMediaUrl(activeTask.video_url)} 
                  controls={videoFinished}
                  autoPlay 
                  playsInline 
                  onEnded={() => setVideoFinished(true)} 
                  onCanPlay={(e) => { e.target.muted = false; e.target.play().catch(()=>{}); }} 
                />
                
                {/* Timer Overlay sutil */}
                {!surveyVisible && !showResult && (
                  <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                    <span className="text-white font-black text-xs tabular-nums">{timer}s</span>
                  </div>
                )}
              </div>
            </section>

            {/* CONTENIDO PRINCIPAL DINÁMICO */}
            <div className="space-y-6">
              {!showResult ? (
                <>
                  {/* Info de la Tarea */}
                  <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a1f36] to-[#2a2f46] flex items-center justify-center shrink-0 shadow-lg shadow-[#1a1f36]/20">
                      <Sparkles className="text-amber-400" size={28} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Campaña Publicitaria</h3>
                      <p className="text-sm font-black text-[#1a1f36] uppercase tracking-tight">{activeTask.nombre}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Recompensa</span>
                      <span className="text-sm font-black text-emerald-500">+{activeTask.recompensa} BOB</span>
                    </div>
                  </div>

                  {/* ENCUESTA O ESPERA */}
                  {!surveyVisible ? (
                    <div className="bg-[#1a1f36] rounded-[2.5rem] p-8 text-center space-y-4 shadow-2xl border border-white/5">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl mx-auto flex items-center justify-center">
                        <Clock className="text-white animate-spin-slow" size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-white font-black uppercase tracking-widest text-[10px]">Analizando Video</h4>
                        <p className="text-white/40 text-[9px] font-medium uppercase tracking-[0.2em]">La encuesta se activará en {timer} segundos</p>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-400 to-blue-400 transition-all duration-1000 ease-linear" 
                          style={{ width: `${(10 - timer) * 10}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <section className="bg-white rounded-[3rem] p-10 shadow-2xl border-2 border-emerald-50 animate-slideUp overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                      
                      <div className="text-center mb-8 relative z-10">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-[0.3em] mb-4 border border-emerald-100">Pregunta de Verificación</span>
                        <h3 className="text-xl font-black text-[#1a1f36] uppercase tracking-tighter leading-tight">
                          {activeTask.pregunta || '¿Cuál es la marca del video?'}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 gap-4 mb-10 relative z-10">
                        {options.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedOption(opt)}
                            className={`group w-full py-6 px-8 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between border-2 ${
                              selectedOption === opt 
                                ? 'bg-[#1a1f36] text-white border-[#1a1f36] shadow-xl translate-x-2' 
                                : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-emerald-200 hover:bg-white hover:text-[#1a1f36]'
                            }`}
                          >
                            <span>{opt}</span>
                            <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${selectedOption === opt ? 'border-emerald-400 bg-emerald-400/20' : 'border-gray-200'}`}>
                              {selectedOption === opt && <Check size={14} className="text-white" />}
                            </div>
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={onConfirmResponse}
                        disabled={!selectedOption || isSubmitting}
                        className="w-full py-6 rounded-[2rem] bg-[#1a1f36] text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4 relative z-10 overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity" />
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            Confirmar y Cobrar
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </section>
                  )}
                </>
              ) : (
                /* VISTA DE RESULTADO FINAL */
                <section className="bg-white p-12 rounded-[3.5rem] border-4 border-white text-center animate-scale-in shadow-2xl relative overflow-hidden">
                  {isCorrect ? (
                    <>
                      <div className="absolute top-0 left-0 w-full h-3 bg-emerald-500" />
                      <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/40 border-4 border-white rotate-6">
                        <Trophy className="text-white" size={48} strokeWidth={2.5} />
                      </div>
                      <h3 className="font-black text-[#1a1f36] text-3xl uppercase mb-3 tracking-tighter">¡ÉXITO TOTAL!</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.25em] mb-10">Recompensa acreditada al instante</p>
                      
                      <div className="bg-emerald-50 py-8 px-10 rounded-[2.5rem] border border-emerald-100 inline-flex flex-col items-center gap-2 mb-10 shadow-inner">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ganancia Obtenida</span>
                        <div className="flex items-center gap-3">
                          <span className="text-5xl font-black text-[#1a1f36] tracking-tighter">+{activeTask.recompensa}</span>
                          <span className="text-sm font-black text-[#1a1f36]/40 uppercase tracking-widest">BOB</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute top-0 left-0 w-full h-3 bg-rose-500" />
                      <div className="w-24 h-24 bg-rose-500 rounded-[2.5rem] mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-rose-500/40 border-4 border-white -rotate-6">
                        <X className="text-white" size={48} strokeWidth={4} />
                      </div>
                      <h3 className="font-black text-[#1a1f36] text-3xl uppercase mb-3 tracking-tighter">FALLASTE</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.25em] mb-10">{errorMessage}</p>
                      <div className="bg-rose-50 py-6 px-10 rounded-[2.5rem] border border-rose-100 inline-flex items-center gap-4 mb-10">
                        <span className="text-xl font-black text-rose-600 tracking-tighter">0.00 BOB</span>
                      </div>
                    </>
                  )}
                  
                  <div className="pt-4">
                    <p className="text-[9px] font-black text-[#1a1f36]/30 uppercase tracking-[0.4em] animate-pulse">Regresando a la sala de tareas...</p>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // --- VISTA DE SALA (LISTA MODERNA) ---
  const total = (data.tareas_completadas || 0) + (data.tareas_restantes || 0);
  const progress = total > 0 ? (data.tareas_completadas / total) * 100 : 0;

  return (
    <Layout>
      <Header title="SALA DE TAREAS" />
      <div className="bg-gray-50 min-h-screen pb-32">
        {/* Estadísticas de Nivel */}
        <div className="px-5 pt-6">
          <div className="bg-[#1a1f36] rounded-[2.5rem] p-8 shadow-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />
            
            <div className="relative z-10 flex justify-between items-start mb-8">
              <div>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2 block">Nivel Actual</span>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{data.nivel}</h2>
              </div>
              <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Activo</span>
              </div>
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex gap-6">
                  <div className="text-left">
                    <span className="block text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Completadas</span>
                    <span className="text-xl font-black text-white">{data.tareas_completadas}</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-left">
                    <span className="block text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Disponibles</span>
                    <span className="text-xl font-black text-emerald-400">{data.tareas_restantes}</span>
                  </div>
                </div>
                <span className="text-[10px] font-black text-white/60 uppercase tracking-tighter">{Math.round(progress)}% Realizado</span>
              </div>
              
              <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de Mejora VIP si aplica */}
        {data.tareas_restantes === 0 && (
          <div className="px-5 mt-8">
            <div className="bg-white rounded-[2rem] p-6 border-2 border-amber-100 shadow-xl flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shadow-inner">
                <TrendingUp size={28} />
              </div>
              <div className="flex-1">
                <h4 className="text-[11px] font-black text-[#1a1f36] uppercase tracking-widest mb-1">¡Límite Alcanzado!</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Sube de nivel para ganar más hoy.</p>
              </div>
              <Link to="/vip" className="bg-[#1a1f36] text-white px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Mejorar</Link>
            </div>
          </div>
        )}

        {/* Grid de Tareas */}
        <div className="px-5 mt-8 space-y-4">
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className="w-1.5 bg-[#1a1f36] h-5 rounded-full" />
            <h3 className="text-xs font-black text-[#1a1f36] uppercase tracking-[0.2em]">Tareas del Día</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {data.tareas && data.tareas.length > 0 ? (
              data.tareas.map((t, idx) => (
                <div
                  key={t.id}
                  onClick={() => startTask(t)}
                  className="group relative bg-white rounded-[2rem] p-4 border border-gray-100 shadow-xl shadow-black/5 active:scale-[0.98] transition-all cursor-pointer overflow-hidden flex items-center gap-5"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-lg border border-gray-50 shrink-0">
                    <img src="/imag/logo.jpeg" alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-[#1a1f36]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                        <Play size={20} className="text-white fill-white ml-1" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[8px] font-black text-[#1a1f36]/40 uppercase tracking-[0.25em]">Brand Promotion</span>
                      <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                        <span className="text-xs font-black text-emerald-600">+{t.recompensa}</span>
                        <span className="text-[8px] font-black text-emerald-400">BOB</span>
                      </div>
                    </div>
                    <h4 className="text-sm font-black text-[#1a1f36] uppercase tracking-tighter truncate mb-1">{t.nombre}</h4>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest line-clamp-1 mb-4 italic">Verifica contenido publicitario</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Disponible</span>
                      </div>
                      <ArrowRight size={14} className="text-[#1a1f36]/20 group-hover:text-[#1a1f36] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 border border-gray-100">
                  <ClipboardList size={40} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">No hay tareas disponibles</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
