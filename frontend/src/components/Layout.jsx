import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Gem, Wallet, User, MessageCircle } from 'lucide-react';
import FloatingQuestionnaire from './FloatingQuestionnaire.jsx';

const navItems = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/equipo', icon: Users, label: 'Equipo' },
  { to: '/vip', icon: Gem, label: 'VIP' },
  { to: '/ganancias', icon: Wallet, label: 'Ganancias' },
  { to: '/usuario', icon: User, label: 'Mío' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Botón Flotante de Soporte WhatsApp - Solo en Inicio */}
      {isHome && (
        <a 
          href="https://whatsapp.com/channel/0029Vb7MSAUBadmgpZ6OpM2h" 
          target="_blank" 
          rel="noopener noreferrer"
          className="fixed bottom-[135px] right-4 z-[60] group animate-bounce-slow"
        >
          <div className="relative">
            {/* Efecto de pulso/glow */}
            <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-40 group-hover:opacity-70 animate-pulse transition-opacity" />
            
            {/* Botón principal */}
            <div className="relative bg-emerald-500 text-white p-2.5 rounded-full shadow-2xl border-2 border-white/20 flex items-center justify-center transform group-hover:scale-110 group-active:scale-95 transition-all duration-300">
              <MessageCircle size={18} fill="currentColor" className="text-white" />
              
              {/* Tooltip/Etiqueta flotante */}
              <div className="absolute right-full mr-4 bg-[#1a1f36] text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap shadow-xl border border-white/10">
                Soporte WhatsApp
                <div className="absolute top-1/2 -translate-y-1/2 left-full w-2 h-2 bg-[#1a1f36] rotate-45 -ml-1 border-r border-t border-white/10" />
              </div>
            </div>
          </div>
        </a>
      )}

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
