import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Eye, EyeOff, Zap, ChevronRight } from 'lucide-react';
import Logo from '../components/Logo.jsx';

const PAISES = [
  { codigo: '+591', pais: '🇧🇴 Bolivia' },
  { codigo: '+52', pais: '🇲🇽 México' },
  { codigo: '+54', pais: '🇦🇷 Argentina' },
  { codigo: '+57', pais: '🇨🇴 Colombia' },
  { codigo: '+51', pais: '🇵🇪 Perú' },
  { codigo: '+56', pais: '🇨🇱 Chile' },
  { codigo: '+58', pais: '🇻🇪 Venezuela' },
  { codigo: '+593', pais: '🇪🇨 Ecuador' },
  { codigo: '+595', pais: '🇵🇾 Paraguay' },
  { codigo: '+598', pais: '🇺🇾 Uruguay' },
];

export default function Login() {
  const [pais, setPais] = useState('+591');
  const [numero, setNumero] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const telefono = pais + numero.replace(/\D/g, '').trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(telefono, password);
      navigate(user?.rol === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c1a] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Elementos decorativos de fondo dinámicos */}
      <div className="absolute top-[-20%] -left-[10%] w-[120%] h-[60%] bg-[#1a1f36] rounded-[100%] blur-[80px] opacity-40 animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-20%] -right-[10%] w-[120%] h-[60%] bg-blue-900/20 rounded-[100%] blur-[80px] opacity-40 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />
      
      {/* Partículas decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping" />
        <div className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-sm relative z-10 py-8">
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <div className="relative inline-block group">
            {/* Brillo exterior del logo */}
            <div className="absolute inset-[-15px] bg-gradient-to-tr from-blue-500/30 to-purple-500/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative z-10 inline-flex items-center justify-center p-4 sm:p-5 rounded-[2.2rem] bg-[#1a1f36] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:scale-105 group-hover:rotate-3">
              <img src="/imag/logo.jpeg" alt="SAV" className="w-14 h-14 sm:w-20 sm:h-20 object-contain rounded-2xl shadow-2xl" />
            </div>
          </div>
          
          <div className="mt-8 space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter italic">
              SAV <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">GLOBAL</span>
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/20" />
              <p className="text-[9px] sm:text-[11px] text-white/40 font-black uppercase tracking-[0.4em]">Activos Virtuales</p>
              <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/20" />
            </div>
          </div>
        </div>

        <div className="bg-[#1a1f36]/40 backdrop-blur-3xl rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.4)] border border-white/5 relative overflow-hidden group animate-slideUp">
          {/* Brillo interno del formulario */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 relative z-10">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-500/20 animate-shake text-center backdrop-blur-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-4">Acceso Móvil</label>
              <div className="flex gap-2">
                <div className="relative flex-shrink-0">
                  <select
                    value={pais}
                    onChange={(e) => setPais(e.target.value)}
                    className="appearance-none w-20 px-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-blue-500/50 text-white font-black text-xs transition-all outline-none cursor-pointer hover:bg-white/10"
                  >
                    {PAISES.map((p) => (
                      <option key={p.codigo} value={p.codigo} className="bg-[#1a1f36]">{p.codigo}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 text-[8px]">▼</div>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm focus:border-blue-500/50 transition-all outline-none placeholder:text-white/10 shadow-inner hover:bg-white/10"
                  placeholder="Número de teléfono"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-4">Contraseña Segura</label>
              <div className="relative group">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm focus:border-blue-500/50 transition-all outline-none pr-14 placeholder:text-white/10 shadow-inner hover:bg-white/10"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-blue-400 transition-colors"
                >
                  {showPass ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-5 mt-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-[0.3em] text-xs shadow-[0_15px_30px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-all relative overflow-hidden group hover:brightness-110"
            >
              <span className="relative z-10">Entrar al Sistema</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </button>
          </form>
        </div>

        <div className="mt-12 text-center animate-fade-in delay-700">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">
            ¿No tienes una cuenta?
          </p>
          <Link 
            to="/registro" 
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 text-white font-black uppercase tracking-widest text-[10px] border border-white/10 hover:bg-white/10 transition-all overflow-hidden"
          >
            <span className="relative z-10">Registrarme Ahora</span>
            <ChevronRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </div>
    </div>
  );
}
