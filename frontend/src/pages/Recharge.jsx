import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { isScheduleOpen } from '../lib/schedule';
import { Upload, CheckCircle2, Lock } from 'lucide-react';

export default function Recharge() {
  const { user } = useAuth();
  const location = useLocation();
  const fileRef = useRef(null);
  const [metodos, setMetodos] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [monto, setMonto] = useState('');
  const [modo, setModo] = useState('Recarga Saldo');
  const [comprobante, setComprobante] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pc, setPc] = useState(null);
  const [success, setSuccess] = useState(false);
  const [lastRechargeTime, setLastRechargeTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [teamStats, setTeamStats] = useState(null);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('last_recharge_time');
    if (saved && !isNaN(parseInt(saved))) {
      setLastRechargeTime(saved);
    }
  }, []);

  useEffect(() => {
    if (user && isMounted) {
      api.users.team().then(setTeamStats).catch(() => setTeamStats(null));
    }
  }, [user, isMounted]);

  useEffect(() => {
    if (!isMounted || !lastRechargeTime) {
      setTimeLeft(0);
      return;
    }
    
    const calculateRemaining = () => {
      const now = Date.now();
      const timestamp = parseInt(lastRechargeTime);
      
      if (isNaN(timestamp)) {
        localStorage.removeItem('last_recharge_time');
        setLastRechargeTime(null);
        return 0;
      }

      const diff = now - timestamp;
      const remaining = Math.max(0, (25 * 60 * 1000) - diff);
      
      if (remaining <= 0) {
        setLastRechargeTime(null);
        localStorage.removeItem('last_recharge_time');
        setTimeLeft(0);
        return 0;
      }
      return remaining;
    };

    // Calcular inmediatamente
    const initialRemaining = calculateRemaining();
    setTimeLeft(initialRemaining);

    if (initialRemaining <= 0) return;

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [isMounted, lastRechargeTime]);

  useEffect(() => {
    if (!isMounted) return;
    
    const loadData = async () => {
      try {
        const list = await api.recharges.metodos();
        setMetodos(list);
      } catch (err) {
        console.error('Error cargando métodos:', err);
        setMetodos([]);
      }
    };

    loadData();
    api.levels.list().then(setNiveles).catch(() => []);
    api.publicContent().then(setPc).catch(() => {});

    if (location.state?.monto) {
      setMonto(location.state.monto.toString());
    }
    if (location.state?.modo) {
      setModo(location.state.modo);
    }
  }, [isMounted, location.state]);

  const selectLevel = (nivel) => {
    setMonto((nivel.deposito || nivel.costo).toString());
    setModo('Compra VIP');
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    // Limitar tamaño a 2MB para evitar errores de red en móviles
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen es muy pesada. Máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setComprobante(reader.result);
      setError('');
    };
    reader.onerror = () => setError('Error al leer el archivo');
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comprobante) {
      setError('Por favor sube el comprobante de pago');
      return;
    }
    
    if (!monto || parseFloat(monto) <= 0) {
      setError('Por favor selecciona un nivel superior');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.recharges.create({
        monto: parseFloat(monto) || 0,
        comprobante_url: comprobante,
        modo: modo,
      });
      const now = Date.now().toString();
      localStorage.setItem('last_recharge_time', now);
      setLastRechargeTime(now);
      setSuccess(true);
      setMonto('');
      setComprobante(null);
    } catch (err) {
      console.error('[Recharge] Error:', err);
      setError(err.message || 'Error al enviar la recarga');
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <Layout>
        <Header title="Cargando..." />
        <div className="p-8 flex items-center justify-center min-h-[50vh]">
          <div className="w-10 h-10 border-4 border-[#1a1f36] border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (success || timeLeft > 0) {
    const totalSeconds = Math.max(0, Math.floor(timeLeft / 1000));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    const displayMins = isNaN(mins) ? '00' : String(mins).padStart(2, '0');
    const displaySecs = isNaN(secs) ? '00' : String(secs).padStart(2, '0');

    return (
      <Layout>
        <Header title="Validación" />
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[80vh] bg-white">
          <div className="w-24 h-24 bg-amber-500/10 text-amber-500 rounded-[2.5rem] flex items-center justify-center shadow-xl border border-amber-100 animate-pulse mb-6">
            <CheckCircle2 size={48} />
          </div>
          
          <div className="space-y-6 max-w-xs w-full">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[#1a1f36] uppercase tracking-tighter">
                {success ? '¡Solicitud Enviada!' : 'Validación en curso'}
              </h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                {success 
                  ? 'Tu comprobante ha sido enviado correctamente.' 
                  : 'Ya tienes una solicitud enviada previamente.'}
                {" "}Por favor, espera a que el gerente revise y valide tu ascenso.
              </p>
            </div>

            <div className="bg-[#1a1f36] text-white p-6 rounded-[2rem] shadow-2xl shadow-[#1a1f36]/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-xl" />
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Tiempo de Espera</p>
              <div className="text-4xl font-black tabular-nums tracking-tighter">
                {displayMins}:{displaySecs}
              </div>
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-3">Procesando solicitud...</p>
            </div>

            <div className="pt-4 space-y-3">
              <button 
                onClick={() => {
                  if (timeLeft <= 0) setSuccess(false);
                }}
                disabled={timeLeft > 0}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg ${
                  timeLeft > 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                  : 'bg-[#1a1f36] text-white shadow-[#1a1f36]/20 active:scale-95'
                }`}
              >
                {timeLeft > 0 ? 'Botón bloqueado temporalmente' : 'Hacer otra recarga'}
              </button>
              
              <Link 
                to="/" 
                className="block w-full py-5 rounded-2xl bg-gray-50 text-[#1a1f36] font-black uppercase tracking-widest text-[10px] border border-gray-100 active:scale-95 transition-all"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const saldo = (user?.saldo_principal ?? 0) + (user?.saldo_comisiones ?? 0);
  const horarioRec = pc?.horario_recharge;
  const schedRec = horarioRec ? isScheduleOpen(horarioRec) : { ok: true };
  const fueraHorario = horarioRec?.enabled && !schedRec.ok;

  const currentLevel = (niveles || []).find(n => n.id === user?.nivel_id || n.codigo === user?.nivel_codigo);
  const currentLevelOrder = currentLevel ? (currentLevel.orden ?? 0) : 0;

  const s3Count = (() => {
    if (!teamStats?.niveles || !Array.isArray(teamStats.niveles)) return 0;
    const nivelA = teamStats.niveles.find(n => n.nivel === 'A');
    if (!nivelA || !nivelA.miembros_detalle || !Array.isArray(nivelA.miembros_detalle)) return 0;
    return nivelA.miembros_detalle.filter(m => m.nivel_codigo === 'S3').length;
  })();

  return (
    <Layout>
      <Header title="Subir de Nivel" />
      <div className="p-4 space-y-4 pb-24 bg-white min-h-screen">
        {/* Banner de Información Informativa */}
        <div className="bg-[#1a1f36] rounded-[2rem] p-8 text-white shadow-xl border border-white/10 relative overflow-hidden group text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">Nivel Actual</p>
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase">
              {currentLevel?.nombre || user?.nivel || 'Pasante'}
            </h2>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-2 max-w-[200px] mx-auto leading-relaxed">
              Las recargas son exclusivamente para solicitar el ascenso a un nivel superior.
            </p>
          </div>
        </div>

        {fueraHorario && (
          <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 text-center animate-pulse shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1">Horario Cerrado</p>
            <p className="text-xs font-bold leading-relaxed">{schedRec.message || 'El sistema de recargas no está disponible ahora.'}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest ml-1">Monto para el Ascenso (BOB)</label>
            <div className="relative">
              <input
                type="number"
                value={monto}
                readOnly
                className="w-full bg-gray-50 px-5 py-5 rounded-2xl border border-gray-100 focus:outline-none transition-all text-xl font-black text-[#1a1f36] placeholder:text-gray-300 shadow-inner"
                placeholder="Selecciona un nivel inferior"
                required
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs uppercase tracking-widest">BOB</span>
            </div>
            
            <div className="mt-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Selecciona el Nivel al que deseas ascender:</p>
              <div className="grid grid-cols-2 gap-3">
                {(niveles || [])
                  .filter(n => (n.orden ?? 0) > currentLevelOrder)
                  .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
                  .map((nivel) => {
                    const valor = nivel.deposito || nivel.costo;
                    const isSelected = monto === valor.toString();
                    const estaBloqueado = nivel.activo === false;
                    const esS4oS5 = ['S4', 'S5'].includes(nivel.codigo);
                    const cumpleRequisitoSubordinados = !esS4oS5 || s3Count >= 20;
                    const deshabilitado = estaBloqueado || !cumpleRequisitoSubordinados;

                    return (                    
                      <button key={nivel.id} type="button" disabled={deshabilitado} onClick={() => selectLevel(nivel)} className={`py-4 px-2 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 shadow-sm relative ${isSelected ? 'border-[#1a1f36] bg-[#1a1f36] text-white shadow-lg' : deshabilitado ? 'border-gray-50 bg-gray-50/50 text-gray-300 cursor-not-allowed opacity-60' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-[#1a1f36]/30'}`}>
                        <span className="text-[10px] font-black uppercase tracking-tighter">{nivel.nombre}</span>
                        <span className={`text-xs font-black ${isSelected ? 'text-white' : deshabilitado ? 'text-gray-300' : 'text-[#1a1f36]'}`}>{estaBloqueado ? 'BLOQUEADO' : !cumpleRequisitoSubordinados ? 'REQ. 20 S3' : `${valor} BOB`}</span>
                        {deshabilitado && <div className="absolute top-1 right-2"><Lock size={10} className="text-gray-300" /></div>}
                      </button>
                    );
                  })
                }
              </div>
              {niveles.filter(n => n.orden > currentLevelOrder).length === 0 && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest text-center">Ya te encuentras en el nivel máximo disponible.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 mb-5 uppercase tracking-widest ml-1">Paso 1: Escanea el QR</p>
            {metodos.length > 0 ? (
              <div className="space-y-6">
                {metodos.map((m) => (
                  <div key={m.id} className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1a1f36]/5 flex items-center justify-center text-[#1a1f36] font-black text-xs border border-gray-100 shadow-inner">1</div>
                      <p className="text-sm font-black text-[#1a1f36] uppercase tracking-tight">{m.nombre_titular}</p>
                    </div>
                    {/* Contenedor del QR dinámico */}
                    <div className="bg-gray-50 p-6 rounded-[2rem] flex flex-col items-center justify-center border border-gray-100 shadow-inner min-h-[16rem]">
                      {(m.imagen_base64 || m.imagen_qr_url) ? (
                        <img src={m.imagen_base64 || m.imagen_qr_url} alt={`QR de ${m.nombre_titular}`} className="w-64 h-64 object-contain rounded-xl shadow-lg border border-white" />
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse flex items-center justify-center"><Upload className="text-gray-300" size={24} /></div>
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Esperando imagen QR del administrador...</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-10 h-10 border-4 border-[#1a1f36] border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando métodos de pago...</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-[#1a1f36]/5 flex items-center justify-center text-[#1a1f36] font-black text-xs border border-gray-100 shadow-inner">2</div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paso 2: Sube el comprobante</p>
            </div>
            
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`w-full min-h-[12rem] rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 overflow-hidden group ${
                comprobante ? 'border-[#00C853] bg-[#00C853]/5' : 'border-gray-100 bg-gray-50 hover:border-[#1a1f36]/50'
              }`}
            >
              {comprobante ? (
                <>
                  <img src={comprobante} alt="Comprobante" className="max-h-40 object-contain rounded-xl shadow-lg" />
                  <span className="text-[10px] font-black text-[#00C853] uppercase tracking-widest animate-pulse">¡Captura lista!</span>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center text-[#1a1f36] group-hover:scale-110 transition-transform border border-gray-100 shadow-sm">
                    <Upload size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-[#1a1f36] transition-colors">Sube tu captura de pantalla</p>
                    <p className="text-[8px] text-gray-300 font-bold uppercase mt-1">Máximo 5MB • Formatos JPG, PNG</p>
                  </div>
                </>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || (horarioRec?.enabled && fueraHorario)}
            className="w-full py-5 rounded-2xl bg-[#1a1f36] text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-[#1a1f36]/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Subiendo Comprobante...' : 'Enviar Recarga para Revisión'}
          </button>
        </form>

        <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50 text-center">
          <p className="text-[9px] text-[#1a1f36] font-black leading-relaxed uppercase tracking-[0.15em]">
            Tu recarga será verificada por nuestro equipo en un plazo de 15 a 30 minutos. 
            Asegúrate de que el monto y la captura coincidan.
          </p>
        </div>
      </div>
    </Layout>
  );
}
