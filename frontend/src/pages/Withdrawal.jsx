import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Check, Upload, Info } from 'lucide-react';
import { isScheduleOpen } from '../lib/schedule';

export default function Withdrawal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [montos, setMontos] = useState([25, 100, 500, 1500, 5000, 10000]);
  const [tarjetas, setTarjetas] = useState([]);
  const [tarjetaId, setTarjetaId] = useState('');
  const [tipoBilletera, setTipoBilletera] = useState('principal');
  const [monto, setMonto] = useState(500);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pc, setPc] = useState(null);

  useEffect(() => {
    // Flujo de validación: Contraseña de fondo -> Vincular tarjeta
    if (user && !user.tiene_password_fondo) {
      navigate('/cambiar-contrasena-fondo');
      return;
    }

    api.withdrawals.montos().then(setMontos).catch(() => {});
    api.users.tarjetas().then((list) => {
      setTarjetas(list);
      if (list.length === 0) {
        navigate('/vincular-tarjeta');
        return;
      }
      if (list[0]) setTarjetaId(list[0].id);
    }).catch(() => setTarjetas([]));
    api.publicContent().then(setPc).catch(() => {});
  }, [user, navigate]);

  const saldoPrincipal = user?.saldo_principal ?? 0;
  const saldoComisiones = user?.saldo_comisiones ?? 0;
  const horarioRet = pc?.horario_retiro;
  const schedRet = horarioRet ? isScheduleOpen(horarioRet) : { ok: true };
  const fueraHorario = horarioRet?.enabled && !schedRet.ok;
  const msgHorario = !schedRet.ok ? schedRet.message : '';

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    // Limitar tamaño a 2MB para evitar errores de red
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen es muy pesada. Máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setQrImage(reader.result);
      setError(''); // Limpiar error si se sube correctamente
    };
    reader.onerror = () => setError('Error al leer el archivo.');
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (tarjetas.length === 0) {
      setError('Agrega una cuenta bancaria en Seguridad de la cuenta antes de retirar.');
      return;
    }
    setLoading(true);
    try {
      await api.withdrawals.create({
        monto,
        tipo_billetera: tipoBilletera,
        password_fondo: password,
        qr_retiro: qrImage,
        tarjeta_id: tarjetaId || undefined,
      });
      navigate('/ganancias');
    } catch (err) {
      setError(err.message || 'Error al solicitar retiro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Header title="Retiro" rightAction={<Link to="/ganancias" className="text-[#1a1f36] text-[10px] font-black uppercase tracking-widest">registro</Link>} />
      <div className="bg-white min-h-screen">
        <form onSubmit={handleSubmit} className="p-4 space-y-6 pb-24">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 text-xs font-bold text-center animate-shake">
              {error}
            </div>
          )}
          
          {horarioRet?.enabled && fueraHorario && (
            <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 text-center animate-pulse shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1">Horario Cerrado</p>
              <p className="text-xs font-bold leading-relaxed">{msgHorario || 'El sistema de retiros no está disponible ahora.'}</p>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest ml-1">Selecciona el Monedero</p>
            <div className="space-y-3">
              {[
                { id: 'comisiones', label: 'Saldo de Comisiones', value: saldoComisiones },
                { id: 'principal', label: 'Saldo Principal', value: saldoPrincipal }
              ].map((b) => (
                <label 
                  key={b.id}
                  className={`block p-4 rounded-2xl border transition-all cursor-pointer group ${tipoBilletera === b.id ? 'border-[#1a1f36] bg-[#1a1f36]/5 shadow-md' : 'border-gray-100 bg-gray-50/30 hover:border-[#1a1f36]/30'}`}
                >
                  <input
                    type="radio"
                    name="tipoBilletera"
                    className="hidden"
                    value={b.id}
                    checked={tipoBilletera === b.id}
                    onChange={(e) => setTipoBilletera(e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className={`text-[10px] font-black uppercase tracking-tight ${tipoBilletera === b.id ? 'text-[#1a1f36]' : 'text-gray-400 group-hover:text-[#1a1f36]'}`}>{b.label}</span>
                      <p className={`text-lg font-black ${tipoBilletera === b.id ? 'text-[#1a1f36]' : 'text-gray-600 group-hover:text-[#1a1f36]'}`}>
                        {b.value.toFixed(2)} <span className="text-[10px] opacity-50">BOB</span>
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${tipoBilletera === b.id ? 'border-[#1a1f36] bg-[#1a1f36]' : 'border-gray-200'}`}>
                      {tipoBilletera === b.id && <Check className="text-white" size={14} strokeWidth={4} />}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest ml-1">Monto a Retirar</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {montos.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonto(m)}
                  className={`py-4 rounded-2xl border transition-all text-xs font-black shadow-sm ${monto === m ? 'bg-[#1a1f36] border-[#1a1f36] text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-[#1a1f36]/30 hover:text-[#1a1f36]'}`}
                >
                  {m} BOB
                </button>
              ))}
            </div>
            <div className="relative group">
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(parseFloat(e.target.value))}
                className="w-full bg-gray-50 px-5 py-5 rounded-2xl border border-gray-100 focus:border-[#1a1f36]/50 focus:outline-none transition-all text-xl font-black text-[#1a1f36] placeholder:text-gray-300 shadow-inner"
                placeholder="Monto personalizado"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs uppercase tracking-widest">BOB</span>
            </div>
          </div>

          {tarjetas.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest ml-1">Cuenta de Destino</p>
              <div className="relative">
                <select
                  value={tarjetaId}
                  onChange={(e) => setTarjetaId(e.target.value)}
                  className="w-full bg-gray-50 px-5 py-5 rounded-2xl border border-gray-100 focus:border-[#1a1f36]/50 focus:outline-none appearance-none transition-all text-sm font-black text-[#1a1f36] shadow-inner"
                >
                  {tarjetas.map((t) => (
                    <option key={t.id} value={t.id} className="bg-white">
                      {t.nombre_banco} - {t.numero_masked}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#1a1f36] font-black text-xs">▼</div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest ml-1">Contraseña de Fondo</p>
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Info size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest">Información de retiro</p>
                  <p className="text-xs text-amber-600 font-bold mt-0.5">Se aplicará un cargo del 10% sobre el monto total de cada retiro solicitado.</p>
                </div>
              </div>

              <div className="relative group">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 px-5 py-5 rounded-2xl border border-gray-100 focus:border-[#1a1f36]/50 focus:outline-none transition-all text-sm font-black text-[#1a1f36] placeholder:text-gray-300 shadow-inner"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a1f36] transition-colors"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 mb-5 uppercase tracking-widest ml-1">QR de Cobro (Opcional)</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`w-full min-h-[10rem] rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 overflow-hidden group ${qrImage ? 'border-[#00C853] bg-[#00C853]/5' : 'border-gray-100 bg-gray-50/50 hover:border-[#1a1f36]/50'}`}
            >
              {qrImage ? (
                <>
                  <img src={qrImage} alt="QR" className="max-h-32 object-contain rounded-xl shadow-lg" />
                  <span className="text-[10px] font-black text-[#00C853] uppercase tracking-widest">QR Listo</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#1a1f36] group-hover:scale-110 transition-transform border border-gray-100 shadow-sm">
                    <Upload size={24} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-[#1a1f36] transition-colors">Subir código QR</span>
                </>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || fueraHorario}
            className="w-full py-5 rounded-2xl bg-[#1a1f36] text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-[#1a1f36]/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale mt-4"
          >
            {loading ? 'Procesando Retiro...' : 'Solicitar Retiro Ahora'}
          </button>
        </form>

        <p className="text-[9px] text-gray-400 pb-10 text-center uppercase font-black tracking-[0.2em] leading-relaxed px-8">
          {msgHorario || 'Sistema de retiros disponible las 24 horas.'}
          <br />
          <span className="opacity-40 italic mt-2 block text-gray-500">Los retiros pueden tardar hasta 24 horas en procesarse.</span>
        </p>
      </div>
    </Layout>
  );
}
