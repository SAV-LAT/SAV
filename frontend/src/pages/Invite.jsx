import { useState } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { Share2, Copy, Check, Users, Gift, Star, ShieldCheck, Zap, Lock, Info, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Invite() {
  const { user } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteLink = `${window.location.origin}/registro?ref=${user?.codigo_invitacion || ''}`;

  const handleCopyCode = () => {
    if (!user?.codigo_invitacion || user?.nivel_codigo === 'internar') return;
    navigator.clipboard.writeText(user.codigo_invitacion);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (user?.nivel_codigo === 'internar') return;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (user?.nivel_codigo === 'internar') {
    return (
      <Layout>
        <Header title="Invitar Amigos" />
        <div className="p-8 text-center space-y-6 flex flex-col items-center justify-center min-h-[70vh] bg-white">
          <div className="w-24 h-24 bg-gray-50 text-[#1a1f36] rounded-[2.5rem] flex items-center justify-center shadow-xl border border-gray-100 animate-pulse">
            <Lock size={48} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#1a1f36] uppercase tracking-tighter">Invitación No Disponible</h2>
            <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-xs mx-auto">
              Como <span className="text-[#1a1f36] font-bold uppercase tracking-widest">Pasante</span>, el sistema de referidos está desactivado para tu cuenta.
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-left w-full shadow-inner">
            <p className="text-[10px] text-[#1a1f36] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <Info size={14} /> Beneficio VIP:
            </p>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Sube a nivel <span className="text-[#1a1f36] font-bold">S1</span> para activar tu código de invitación y empezar a ganar el <span className="text-[#00C853] font-bold">15% de comisión</span> por cada amigo que invites.
            </p>
          </div>
          <Link 
            to="/vip"
            className="w-full py-5 rounded-2xl bg-[#1a1f36] text-white font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <TrendingUp size={16} />
            Activar Invitación Ahora
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="Código de invitación" />
      
      <div className="p-4 space-y-4 pb-24 bg-white min-h-screen">
        {/* Banner Principal Hero - Basado en 3.11/3.14 */}
        <div className="relative overflow-hidden rounded-[2rem] bg-[#1a1f36] p-8 text-white shadow-xl border border-white/10 text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10 flex flex-col items-center space-y-4">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center border border-white/20 shadow-inner">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border-2 border-white/20 shadow-lg">
                <span className="text-[#1a1f36] font-black text-xl tracking-tighter">SAV</span>
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tighter">¡Invita y Gana!</h2>
              <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em]">Construye tu equipo hoy</p>
            </div>
          </div>
        </div>

        {/* Card de Información de Invitación - Basado en 3.4/3.14 */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100">
          <div className="space-y-6">
            {/* Código de Invitación */}
            <div className="flex flex-col items-center space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tu código de invitación</p>
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1 bg-gray-50 py-4 rounded-2xl border border-gray-100 text-center shadow-inner">
                  <span className="text-3xl font-black text-[#1a1f36] tracking-[0.2em]">
                    {user?.codigo_invitacion || '------'}
                  </span>
                </div>
                <button 
                  onClick={handleCopyCode}
                  className={`p-4 rounded-2xl transition-all shadow-lg ${copiedCode ? 'bg-[#00C853] text-white shadow-[#00C853]/20' : 'bg-[#1a1f36] text-white active:scale-95 shadow-[#1a1f36]/20'}`}
                >
                  {copiedCode ? <Check size={24} /> : <Copy size={24} />}
                </button>
              </div>
            </div>

            <div className="h-[1px] bg-gray-100 w-full" />

            {/* Enlace de Invitación */}
            <div className="flex flex-col items-center space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Enlace de registro</p>
              <div className="flex items-center gap-3 w-full bg-gray-50 p-2 rounded-2xl border border-gray-100 shadow-inner">
                <div className="flex-1 truncate px-3">
                  <span className="text-[10px] font-bold text-gray-400 tracking-tight">
                    {inviteLink}
                  </span>
                </div>
                <button 
                  onClick={handleCopyLink}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all shadow-md ${copiedLink ? 'bg-[#00C853] text-white' : 'bg-[#1a1f36] text-white active:scale-95'}`}
                >
                  {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
                  {copiedLink ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Beneficios - Basado en 3.10/3.11 */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Beneficios del equipo</h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: TrendingUp, title: 'Comisiones Diarias', desc: 'Recibe un porcentaje de las tareas de tus referidos.', color: 'text-[#1a1f36]', bg: 'bg-[#1a1f36]/5' },
              { icon: Users, title: 'Bonos por Nivel', desc: 'Premios instantáneos cuando tu equipo sube de nivel VIP.', color: 'text-[#1a1f36]', bg: 'bg-gray-50' },
              { icon: ShieldCheck, title: 'Crecimiento Seguro', desc: 'Sistema de red transparente y retiro garantizado.', color: 'text-[#00C853]', bg: 'bg-[#00C853]/5' }
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm group hover:border-[#1a1f36]/30 transition-all">
                <div className={`w-12 h-12 rounded-xl ${b.bg} ${b.color} flex items-center justify-center flex-shrink-0 shadow-inner border border-gray-50`}>
                  <b.icon size={24} />
                </div>
                <div>
                  <p className="font-black text-[#1a1f36] text-sm uppercase tracking-tight">{b.title}</p>
                  <p className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Informativo */}
        <div className="bg-[#00C853]/5 rounded-2xl p-6 border border-[#00C853]/10 text-center shadow-inner">
          <p className="text-[10px] text-[#00C853] font-black leading-relaxed uppercase tracking-widest">
            Comparte tu código con amigos y familiares para empezar a generar ingresos pasivos hoy mismo.
          </p>
        </div>
      </div>
    </Layout>
  );
}
