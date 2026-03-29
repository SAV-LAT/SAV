import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { api } from '../lib/api';

export default function CambiarContrasena() {
  const navigate = useNavigate();
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
    setLoading(true);
    try {
      await api.users.changePassword({ password_actual: actual, password_nueva: nueva });
      alert('Contraseña de inicio de sesión actualizada');
      navigate('/seguridad');
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Header title="Contraseña de inicio" />
      <form onSubmit={submit} className="p-4 space-y-4">
        {error && <div className="p-3 rounded-xl bg-red-50 text-red-800 text-sm">{error}</div>}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-sm text-gray-600">Debes escribir tu contraseña actual para poder cambiarla.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
            <input
              type="password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña (mín. 6 caracteres)</label>
            <input
              type="password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva</label>
            <input
              type="password"
              value={nueva2}
              onChange={(e) => setNueva2(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full py-4 rounded-full bg-[#1a1f36] text-white font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all disabled:opacity-50">
          {loading ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </Layout>
  );
}
