import { useState, Component } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  CreditCard, 
  Image, 
  QrCode, 
  Gift, 
  Bell, 
  Play, 
  Menu, 
  X, 
  LogOut,
  ChevronRight,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import Logo from '../../components/Logo.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Admin Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#1a1f36] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-600" size={40} />
            </div>
            <h2 className="text-2xl font-black text-[#1a1f36] mb-4 uppercase tracking-tight">Error en el Panel</h2>
            <p className="text-slate-600 mb-8 font-medium">
              Ha ocurrido un error inesperado en esta sección del panel de administración.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 mb-8 text-left overflow-auto max-h-40">
              <code className="text-xs text-red-500 font-mono">
                {this.state.error?.message || 'Error desconocido'}
              </code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-[#1a1f36] text-white rounded-2xl font-bold hover:bg-[#2d3558] transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
            >
              Recargar Panel
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menu = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/usuarios', icon: Users, label: 'Usuarios' },
    { to: '/admin/niveles', icon: Layers, label: 'Niveles VIP' },
    { to: '/admin/recargas', icon: CreditCard, label: 'Recargas' },
    { to: '/admin/retiros', icon: Wallet, label: 'Retiros' },
    { to: '/admin/tareas', icon: Play, label: 'Tareas' },
    { to: '/admin/metodos-qr', icon: QrCode, label: 'Imágenes Recarga' },
    { to: '/admin/recompensas', icon: Gift, label: 'Premios y Recompensas' },
    { to: '/admin/admins', icon: ShieldCheck, label: 'Gestión Admins y Turnos' },
    { to: '/admin/banners', icon: Image, label: 'Banners' },
    { to: '/admin/contenido-home', icon: Bell, label: 'Contenido y horarios' },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row relative overflow-hidden">
      {/* Barra superior para móvil */}
      <header className="md:hidden bg-[#1a1f36] text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-xl bg-white/10 active:scale-90 transition-transform"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Logo variant="header" className="h-6" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest bg-white text-[#1a1f36] px-2 py-0.5 rounded-full">Admin</span>
        </div>
      </header>

      {/* Overlay para móvil cuando el menú está abierto */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#1a1f36]/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar lateral */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-full md:h-screen w-72 bg-[#1a1f36] text-white p-6 z-50 transition-transform duration-300 ease-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col shadow-2xl md:shadow-none
      `}>
        <div className="hidden md:flex items-center gap-3 mb-10 px-2">
          <div className="p-2 rounded-2xl bg-white/10">
            <Logo variant="header" className="h-8" />
          </div>
          <div>
            <h1 className="font-black text-lg leading-tight uppercase tracking-tighter text-white">SAV Admin</h1>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Administrador</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar py-4 md:py-0">
          {menu.map((item) => {
            const { to, icon: MenuIcon, label } = item;
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center justify-between group px-4 py-3.5 rounded-2xl transition-all duration-200
                  ${isActive 
                    ? 'bg-white text-[#1a1f36] font-black shadow-[0_10px_20px_-5px_rgba(255,255,255,0.1)]' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <MenuIcon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-sm uppercase tracking-tighter font-bold">{label}</span>
                </div>
                {isActive && <ChevronRight size={16} />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-black">
              {user?.nombre_usuario?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black truncate uppercase tracking-tighter text-white">{user?.nombre_usuario}</p>
              <p className="text-[10px] text-white/40 font-bold uppercase truncate">ID: {user?.id?.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={() => { if(confirm('¿Cerrar sesión de administrador?')) { logout(); navigate('/login'); } }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-sm font-black uppercase tracking-widest"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-x-hidden p-4 md:p-8">
        <div className="max-w-7xl mx-auto page-transition">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
