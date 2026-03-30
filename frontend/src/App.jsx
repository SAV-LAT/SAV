import { Suspense, lazy, useState, useEffect } from 'react';
// SAV v4.2.0 - Despliegue Final
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { useAndroidBackHandler } from './hooks/useAndroidBackHandler.js';

/**
 * NavigationGuard: Maneja el comportamiento del botón atrás del celular.
 * Asegura que el usuario regrese paso a paso y no salga de la app
 * hasta estar en la pantalla de inicio.
 */
function NavigationGuard({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [initialized, setInitialized] = useState(false);

  // Activar el manejador de botón físico de Android
  useAndroidBackHandler();

  useEffect(() => {
    if (loading) return;

    // Si el usuario entra directamente a una subpágina (por ejemplo /ganancias)
    // el historial del navegador está vacío. Al apretar "atrás", el celular cierra la app.
    // Esta lógica inyecta el "Inicio" en el stack si no existe.
    if (!initialized && user) {
      const currentPath = location.pathname + location.search;
      
      // Si no estamos en el inicio, inyectamos el inicio antes de la página actual
      if (currentPath !== '/' && currentPath !== '/admin') {
        console.log('[NavigationGuard] Inyectando ruta base en el historial...');
        navigate(user.rol === 'admin' ? '/admin' : '/', { replace: true });
        
        // Usamos un pequeño delay para que el historial registre el cambio
        setTimeout(() => {
          navigate(currentPath);
          setInitialized(true);
        }, 10);
      } else {
        setInitialized(true);
      }
    }
  }, [location.pathname, user, loading, initialized, navigate]);

  return children;
}

/**
 * Helper para manejar errores de carga de módulos dinámicos (Chunks).
 * Esto ocurre cuando se despliega una nueva versión y el navegador intenta
 * cargar un archivo .js que ya no existe en el servidor.
 */
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error('Error cargando componente:', error);
      // Solo recargar si es un error de carga de módulo
      if (error.message?.includes('Failed to fetch dynamically imported module') || 
          error.message?.includes('Importing a module script failed')) {
        window.location.reload();
      }
      throw error;
    }
  });

// Lazy Loading para optimizar carga inicial con reintento automático
const Login = lazyWithRetry(() => import('./pages/Login.jsx'));
const Register = lazyWithRetry(() => import('./pages/Register.jsx'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard.jsx'));
const TaskRoom = lazyWithRetry(() => import('./pages/TaskRoom.jsx'));
const Profile = lazyWithRetry(() => import('./pages/Profile.jsx'));
const Withdrawal = lazyWithRetry(() => import('./pages/Withdrawal.jsx'));
const Recharge = lazyWithRetry(() => import('./pages/Recharge.jsx'));
const VIP = lazyWithRetry(() => import('./pages/VIP.jsx'));
const Ganancias = lazyWithRetry(() => import('./pages/Ganancias.jsx'));
const Movimientos = lazyWithRetry(() => import('./pages/Movimientos.jsx'));
const NoticiasConferencia = lazyWithRetry(() => import('./pages/NoticiasConferencia.jsx'));
const Team = lazyWithRetry(() => import('./pages/Team.jsx'));
const Invite = lazyWithRetry(() => import('./pages/Invite.jsx'));
const Security = lazyWithRetry(() => import('./pages/Security.jsx'));
const VincularTarjeta = lazyWithRetry(() => import('./pages/VincularTarjeta.jsx'));
const CambiarContrasena = lazyWithRetry(() => import('./pages/CambiarContrasena.jsx'));
const CambiarContrasenaFondo = lazyWithRetry(() => import('./pages/CambiarContrasenaFondo.jsx'));
const BillingRecord = lazyWithRetry(() => import('./pages/BillingRecord.jsx'));
const Recompensas = lazyWithRetry(() => import('./pages/Recompensas.jsx'));

// Admin
const AdminLayout = lazyWithRetry(() => import('./pages/admin/AdminLayout.jsx'));
const AdminDashboard = lazyWithRetry(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminUsuarios = lazyWithRetry(() => import('./pages/admin/AdminUsuarios.jsx'));
const AdminRecargas = lazyWithRetry(() => import('./pages/admin/AdminRecargas.jsx'));
const AdminRetiros = lazyWithRetry(() => import('./pages/admin/AdminRetiros.jsx'));
const AdminMetodosQr = lazyWithRetry(() => import('./pages/admin/AdminMetodosQr.jsx'));
const AdminContenidoHome = lazyWithRetry(() => import('./pages/admin/AdminContenidoHome.jsx'));
const AdminTareas = lazyWithRetry(() => import('./pages/admin/AdminTareas.jsx'));
const AdminBanners = lazyWithRetry(() => import('./pages/admin/AdminBanners.jsx'));
const AdminNiveles = lazyWithRetry(() => import('./pages/admin/AdminNiveles.jsx'));
const AdminRecompensas = lazyWithRetry(() => import('./pages/admin/AdminRecompensas.jsx'));
const AdminAdmins = lazyWithRetry(() => import('./pages/admin/AdminAdmins.jsx'));
const AdminCuestionario = lazyWithRetry(() => import('./pages/admin/AdminCuestionario.jsx'));

const GlobalLoader = () => {
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowError(true);
    }, 15000); // 15 segundos de timeout
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0c1a] space-y-6 p-6 text-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-white/5 border-t-emerald-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
      </div>
      <div className="text-center space-y-4">
        <div>
          <p className="text-white font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Cargando SAV</p>
          <p className="text-white/30 text-[8px] uppercase tracking-widest mt-2">Global Activos Virtuales</p>
        </div>
        
        {showError && (
          <div className="animate-fade-in space-y-4 max-w-xs mx-auto pt-4">
            <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
              El servidor está tardando más de lo esperado en responder.
            </p>
            <button 
              onClick={handleRetry}
              className="px-6 py-3 rounded-xl bg-white/10 text-white text-[9px] font-black uppercase tracking-[0.2em] border border-white/10 active:scale-95 transition-all hover:bg-white/20"
            >
              Reintentar Conexión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function PrivateRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <GlobalLoader />;
  if (!user) return <Navigate to="/login" replace />;
  
  // Si la ruta es solo para admin y el usuario no es admin, redirigir al home de usuario
  if (adminOnly && user.rol !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Si la ruta NO es para admin (es de usuario) pero el usuario ES admin,
  // redirigir al panel de administración para evitar confusión
  if (!adminOnly && user.rol === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function CatchAll() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.rol === 'admin' ? "/admin" : "/"} replace />;
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
          <Route path="cuestionarios" element={<AdminCuestionario />} />
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
        <Route path="*" element={<CatchAll />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavigationGuard>
          <AppRoutes />
        </NavigationGuard>
      </AuthProvider>
    </BrowserRouter>
  );
}
