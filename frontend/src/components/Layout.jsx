import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Gem, Wallet, User } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/equipo', icon: Users, label: 'Equipo' },
  { to: '/vip', icon: Gem, label: 'VIP' },
  { to: '/ganancias', icon: Wallet, label: 'Ganancias' },
  { to: '/usuario', icon: User, label: 'Mío' },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Fondo decorativo global */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#1a1f36]/5 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md bg-white min-h-screen relative shadow-[0_0_50px_rgba(0,0,0,0.1)] border-x border-gray-100 z-10">
        {children}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 backdrop-blur-xl border-t border-gray-100 flex justify-around py-3 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          {navItems.map((item) => {
            const { to, icon: NavIcon, label } = item;
            const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1.5 py-1 px-3 transition-all duration-300 relative ${
                  isActive ? 'text-[#1a1f36]' : 'text-gray-400'
                }`}
              >
                {isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#1a1f36] rounded-full shadow-[0_0_10px_#1a1f36]" />
                )}
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
                  <NavIcon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-all ${isActive ? 'opacity-100 translate-y-0' : 'opacity-60'}`}>
                  {label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
