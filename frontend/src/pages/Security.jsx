import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { User, Phone, CreditCard, Lock, Trash2 } from 'lucide-react';

export default function Security() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tarjetas, setTarjetas] = useState([]);

  const load = () => {
    api.users.tarjetas().then(setTarjetas).catch(() => setTarjetas([]));
  };

  useEffect(() => {
    load();
  }, []);

  const eliminarTarjeta = async (id) => {
    if (!window.confirm('¿Eliminar esta cuenta bancaria?')) return;
    try {
      await api.users.deleteTarjeta(id);
      load();
    } catch (e) {
      alert(e.message || 'No se pudo eliminar');
    }
  };

  return (
    <Layout>
      <Header title="Seguridad de la Cuenta" />
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <User size={22} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">Avatares</p>
                <p className="text-sm text-gray-500">Próximamente</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Phone size={22} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">Número de teléfono</p>
                <p className="text-sm text-gray-500">{user?.telefono || '—'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <User size={22} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">Nombre real</p>
                <p className="text-sm text-gray-500">{user?.nombre_real || 'Haga clic para configurar'}</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <CreditCard size={22} className="text-gray-600" />
                <div>
                  <p className="font-medium text-gray-800">Cuentas para retiro</p>
                  <p className="text-sm text-gray-500">Cuentas vinculadas para tus cobros</p>
                </div>
              </div>
              <Link to="/vincular-tarjeta" className="text-sm text-[#1a1f36] font-black uppercase tracking-tighter">
                + Agregar
              </Link>
            </div>
            {tarjetas.length === 0 ? (
              <p className="text-sm text-gray-500 pl-9">Sin cuentas. Agrega una para retirar.</p>
            ) : (
              <ul className="space-y-2 pl-9">
                {tarjetas.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 py-2 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-sm text-gray-800">
                      {t.tipo === 'yape' ? 'Yape' : (t.nombre_banco || 'Cuenta')} ****{t.numero_masked}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            to="/cambiar-contrasena"
            className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Lock size={22} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">Contraseña de inicio de sesión</p>
                <p className="text-sm text-gray-500">Requiere la contraseña actual</p>
              </div>
            </div>
            <span className="text-gray-400">›</span>
          </Link>
          <Link
            to="/cambiar-contrasena-fondo"
            className="flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Lock size={22} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">Contraseña del fondo</p>
                <p className="text-sm text-gray-500">
                  {user?.tiene_password_fondo ? 'Cambiar (contraseña anterior requerida)' : 'Configurar por primera vez'}
                </p>
              </div>
            </div>
            <span className="text-gray-400">›</span>
          </Link>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full mt-4 py-4 rounded-xl bg-red-500 text-white font-semibold"
        >
          Cerrar sesión
        </button>
      </div>
    </Layout>
  );
}
