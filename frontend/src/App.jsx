import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TaskRoom from './pages/TaskRoom.jsx';
import Profile from './pages/Profile.jsx';
import Withdrawal from './pages/Withdrawal.jsx';
import Recharge from './pages/Recharge.jsx';
import VIP from './pages/VIP.jsx';
import Ganancias from './pages/Ganancias.jsx';
import NoticiasConferencia from './pages/NoticiasConferencia.jsx';
import Team from './pages/Team.jsx';
import Invite from './pages/Invite.jsx';
import Security from './pages/Security.jsx';
import VincularTarjeta from './pages/VincularTarjeta.jsx';
import CambiarContrasena from './pages/CambiarContrasena.jsx';
import CambiarContrasenaFondo from './pages/CambiarContrasenaFondo.jsx';
import BillingRecord from './pages/BillingRecord.jsx';
import Recompensas from './pages/Recompensas.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsuarios from './pages/admin/AdminUsuarios.jsx';
import AdminRecargas from './pages/admin/AdminRecargas.jsx';
import AdminRetiros from './pages/admin/AdminRetiros.jsx';
import AdminMetodosQr from './pages/admin/AdminMetodosQr.jsx';
import AdminContenidoHome from './pages/admin/AdminContenidoHome.jsx';
import AdminTareas from './pages/admin/AdminTareas.jsx';
import AdminBanners from './pages/admin/AdminBanners.jsx';
import AdminNiveles from './pages/admin/AdminNiveles.jsx';
import AdminRecompensas from './pages/admin/AdminRecompensas.jsx';

function PrivateRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.rol !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
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
        <Route path="contenido-home" element={<AdminContenidoHome />} />
      </Route>
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/recompensas" element={<PrivateRoute><Recompensas /></PrivateRoute>} />
      <Route path="/tareas" element={<PrivateRoute><TaskRoom /></PrivateRoute>} />
      <Route path="/usuario" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/equipo" element={<PrivateRoute><Team /></PrivateRoute>} />
      <Route path="/invitar" element={<PrivateRoute><Invite /></PrivateRoute>} />
      <Route path="/vip" element={<PrivateRoute><VIP /></PrivateRoute>} />
      <Route path="/ganancias" element={<PrivateRoute><Ganancias /></PrivateRoute>} />
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
