import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function CambiarContrasenaFondo() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const tieneFondo = !!user?.tiene_password_fondo;
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [nueva2, setNueva2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (nueva !== nueva2) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }
    if (tieneFondo && !actual) {
      setError('Debes escribir la contraseña actual del fondo');
      return;
    }
    setLoading(true);
    try {
      const body = { password_nueva: nueva };
      if (tieneFondo) body.password_actual = actual;
      await api.users.changeFundPassword(body);
      await refreshUser?.();
      alert('Contraseña del fondo actualizada');
      navigate('/seguridad');
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Header title={tieneFondo ? "Cambiar Contraseña de Fondo" : "Crear Contraseña de Fondo"} />
      <div className="p-4 space-y-6 bg-white min-h-screen">
        <div className="bg-[#1a1f36]/5 p-6 rounded-[2rem] border border-[#1a1f36]/10 shadow-inner">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#1a1f36] shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <h3 className="font-black text-[#1a1f36] text-xs uppercase tracking-widest">Seguridad de Fondos</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Es necesaria para tus retiros</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            {tieneFondo
              ? 'Para tu seguridad, debes ingresar tu contraseña actual antes de establecer una nueva.'
              : 'Esta contraseña es diferente a la de inicio de sesión. Asegúrate de recordarla para poder retirar tus ganancias.'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 animate-fade-in">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 text-xs font-bold text-center animate-shake">
              {error}
            </div>
          )}
          
          <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 space-y-5">
            {tieneFondo && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña Actual</label>
                <input
                  type="password"
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-gray-100 focus:border-[#1a1f36]/50 focus:outline-none transition-all text-sm font-black text-[#1a1f36] placeholder:text-gray-300"
                  required
                  placeholder="Tu contraseña actual"
                  autoComplete="current-password"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
              <input
                type="password"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-gray-100 focus:border-[#1a1f36]/50 focus:outline-none transition-all text-sm font-black text-[#1a1f36] placeholder:text-gray-300"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                value={nueva2}
                onChange={(e) => setNueva2(e.target.value)}
                className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-gray-100 focus:border-[#1a1f36]/50 focus:outline-none transition-all text-sm font-black text-[#1a1f36] placeholder:text-gray-300"
                required
                minLength={6}
                placeholder="Repite la contraseña"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-5 rounded-2xl bg-[#1a1f36] text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-[#1a1f36]/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Procesando...' : (tieneFondo ? 'Actualizar Contraseña' : 'Crear Contraseña de Fondo')}
          </button>
        </form>
      </div>
    </Layout>
  );
}
