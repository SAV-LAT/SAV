import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Eye, EyeOff, Lock, UserPlus } from 'lucide-react';
import Logo from '../components/Logo.jsx';

export default function Register() {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');

  const [data, setData] = useState({
    telefono: '+591',
    nombre_usuario: '',
    password: '',
    repeat_password: '',
    codigo_invitacion: refCode || '',
  });

  // Actualizar el código si cambia el parámetro de búsqueda
  useEffect(() => {
    if (refCode) {
      setData(prev => ({ ...prev, codigo_invitacion: refCode }));
    }
  }, [refCode]);

  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (data.password !== data.repeat_password) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      await register({
        telefono: data.telefono,
        nombre_usuario: data.nombre_usuario,
        password: data.password,
        codigo_invitacion: data.codigo_invitacion,
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al registrarse');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c1a] flex flex-col items-center justify-center p-4 sm:p-6 py-8 sm:py-12 relative overflow-hidden">
      {/* Elementos decorativos de fondo dinámicos */}
      <div className="absolute top-[-20%] -right-[10%] w-[120%] h-[60%] bg-[#1a1f36] rounded-[100%] blur-[80px] opacity-40 animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-20%] -left-[10%] w-[120%] h-[60%] bg-blue-900/20 rounded-[100%] blur-[80px] opacity-40 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />
      
      {/* Partículas decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white rounded-full animate-ping" />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-sm relative z-10 py-6">
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <div className="relative inline-block group">
            {/* Brillo exterior del logo */}
            <div className="absolute inset-[-15px] bg-gradient-to-tr from-blue-500/30 to-purple-500/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative z-10 inline-flex items-center justify-center p-4 sm:p-5 rounded-[2.2rem] bg-[#1a1f36] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:scale-105 group-hover:-rotate-3">
              <img src="/imag/logo.jpeg" alt="SAV" className="w-14 h-14 sm:w-20 sm:h-20 object-contain rounded-2xl shadow-2xl" />
            </div>
          </div>
          
          <div className="mt-8 space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter italic">
              ÚNETE A <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">SAV</span>
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/20" />
              <p className="text-[9px] sm:text-[11px] text-white/40 font-black uppercase tracking-[0.4em]">Nueva Cuenta</p>
              <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/20" />
            </div>
          </div>
        </div>

        <div className="bg-[#1a1f36]/40 backdrop-blur-3xl rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.4)] border border-white/5 relative overflow-hidden group animate-slideUp">
          {/* Brillo interno del formulario */}
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 relative z-10">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-500/20 animate-shake text-center backdrop-blur-md">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-4">Teléfono Móvil</label>
              <input
                type="tel"
                value={data.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                className="w-full px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm focus:border-blue-500/50 transition-all outline-none placeholder:text-white/10 shadow-inner hover:bg-white/10"
                placeholder="+591 70000000"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-4">Nombre de Usuario</label>
              <input
                type="text"
                value={data.nombre_usuario}
                onChange={(e) => handleChange('nombre_usuario', e.target.value)}
                className="w-full px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm focus:border-blue-500/50 transition-all outline-none placeholder:text-white/10 shadow-inner hover:bg-white/10"
                placeholder="Ej: usuario_pro"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-4">Contraseña</label>
              <div className="relative group">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={data.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="w-full px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm focus:border-blue-500/50 transition-all outline-none pr-14 placeholder:text-white/10 shadow-inner hover:bg-white/10"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-blue-400 transition-colors"
                >
                  {showPass ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-4">Repetir Contraseña</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={data.repeat_password}
                onChange={(e) => handleChange('repeat_password', e.target.value)}
                className="w-full px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm focus:border-blue-500/50 transition-all outline-none placeholder:text-white/10 shadow-inner hover:bg-white/10"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-4">Código de Invitación</label>
              <div className="relative group">
                <input
                  type="text"
                  value={data.codigo_invitacion}
                  onChange={(e) => handleChange('codigo_invitacion', e.target.value)}
                  className={`w-full px-6 py-3.5 rounded-2xl border transition-all outline-none font-black text-sm shadow-inner ${
                    refCode 
                    ? 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed' 
                    : 'bg-white/5 border-white/10 text-white focus:border-blue-500/50'
                  }`}
                  placeholder="CÓDIGO OBLIGATORIO"
                  required
                  readOnly={!!refCode}
                />
                {refCode && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400/40 flex items-center gap-2">
                    <Lock size={14} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Válido</span>
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-5 mt-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black uppercase tracking-[0.3em] text-xs shadow-[0_15px_30px_rgba(79,70,229,0.3)] active:scale-[0.98] transition-all relative overflow-hidden group hover:brightness-110"
            >
              <span className="relative z-10">Crear Cuenta VIP</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </button>
          </form>
        </div>

        <div className="mt-8 text-center animate-fade-in delay-700">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">
            ¿Ya tienes una cuenta?
          </p>
          <Link 
            to="/login" 
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 text-white font-black uppercase tracking-widest text-[10px] border border-white/10 hover:bg-white/10 transition-all overflow-hidden"
          >
            <span className="relative z-10">Volver al Login</span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </div>
    </div>
  );
}
