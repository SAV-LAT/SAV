import { Suspense, lazy } from 'react';
// SAV v4.2.0 - Despliegue Final
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Lazy Loading para optimizar carga inicial
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const TaskRoom = lazy(() => import('./pages/TaskRoom.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Withdrawal = lazy(() => import('./pages/Withdrawal.jsx'));
const Recharge = lazy(() => import('./pages/Recharge.jsx'));
const VIP = lazy(() => import('./pages/VIP.jsx'));
const Ganancias = lazy(() => import('./pages/Ganancias.jsx'));
const Movimientos = lazy(() => import('./pages/Movimientos.jsx'));
const NoticiasConferencia = lazy(() => import('./pages/NoticiasConferencia.jsx'));
const Team = lazy(() => import('./pages/Team.jsx'));
const Invite = lazy(() => import('./pages/Invite.jsx'));
const Security = lazy(() => import('./pages/Security.jsx'));
const VincularTarjeta = lazy(() => import('./pages/VincularTarjeta.jsx'));
const CambiarContrasena = lazy(() => import('./pages/CambiarContrasena.jsx'));
const CambiarContrasenaFondo = lazy(() => import('./pages/CambiarContrasenaFondo.jsx'));
const BillingRecord = lazy(() => import('./pages/BillingRecord.jsx'));
const Recompensas = lazy(() => import('./pages/Recompensas.jsx'));

// Admin
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminUsuarios = lazy(() => import('./pages/admin/AdminUsuarios.jsx'));
const AdminRecargas = lazy(() => import('./pages/admin/AdminRecargas.jsx'));
const AdminRetiros = lazy(() => import('./pages/admin/AdminRetiros.jsx'));
const AdminMetodosQr = lazy(() => import('./pages/admin/AdminMetodosQr.jsx'));
const AdminContenidoHome = lazy(() => import('./pages/admin/AdminContenidoHome.jsx'));
const AdminTareas = lazy(() => import('./pages/admin/AdminTareas.jsx'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners.jsx'));
const AdminNiveles = lazy(() => import('./pages/admin/AdminNiveles.jsx'));
const AdminRecompensas = lazy(() => import('./pages/admin/AdminRecompensas.jsx'));
const AdminAdmins = lazy(() => import('./pages/admin/AdminAdmins.jsx'));

const GlobalLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0c1a] space-y-6">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-white/5 border-t-emerald-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
    </div>
    <div className="text-center">
      <p className="text-white font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Cargando SAV</p>
      <p className="text-white/30 text-[8px] uppercase tracking-widest mt-2">Global Activos Virtuales</p>
    </div>
  </div>
);

function PrivateRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <GlobalLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.rol !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<PrivateRoute adminOnly><AdminLayout /></PrivateRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="niveles" element={<AdminNiveles />} />
          <Route path="recargas" element={<AdminRecargas />} />
          <Route path="retiros" element={<AdminRetiros />} />
          <Route path="tareas" element={<AdminTareas />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="metodos-qr" element={<AdminMetodosQr />} />
          <Route path="recompensas" element={<AdminRecompensas />} />
          <Route path="admins" element={<AdminAdmins />} />
          <Route path="contenido-home" element={<AdminContenidoHome />} />
        </Route>
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/recompensas" element={<PrivateRoute><Recompensas /></PrivateRoute>} />
        {/* Rutas Privadas */}
        <Route path="/tareas" element={<PrivateRoute><TaskRoom /></PrivateRoute>} />
        <Route path="/usuario" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/equipo" element={<PrivateRoute><Team /></PrivateRoute>} />
        <Route path="/invitar" element={<PrivateRoute><Invite /></PrivateRoute>} />
        <Route path="/vip" element={<PrivateRoute><VIP /></PrivateRoute>} />
        <Route path="/ganancias" element={<PrivateRoute><Ganancias /></PrivateRoute>} />
        <Route path="/movimientos" element={<PrivateRoute><Movimientos /></PrivateRoute>} />
        <Route path="/noticias-conferencia" element={<PrivateRoute><NoticiasConferencia /></PrivateRoute>} />
        <Route path="/retiro" element={<PrivateRoute><Withdrawal /></PrivateRoute>} />
        <Route path="/recargar" element={<PrivateRoute><Recharge /></PrivateRoute>} />
        <Route path="/seguridad" element={<PrivateRoute><Security /></PrivateRoute>} />
        <Route path="/vincular-tarjeta" element={<PrivateRoute><VincularTarjeta /></PrivateRoute>} />
        <Route path="/cambiar-contrasena" element={<PrivateRoute><CambiarContrasena /></PrivateRoute>} />
        <Route path="/cambiar-contrasena-fondo" element={<PrivateRoute><CambiarContrasenaFondo /></PrivateRoute>} />
        <Route path="/registro-tareas" element={<PrivateRoute><TaskRoom /></PrivateRoute>} />
        <Route path="/registro-facturacion" element={<PrivateRoute><BillingRecord /></PrivateRoute>} />
        
        {/* Ruta 404 por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
