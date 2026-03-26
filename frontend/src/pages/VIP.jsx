import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Header from '../components/Header.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Crown, CheckCircle2, Lock, TrendingUp, Users, Info, Sparkles, Award } from 'lucide-react';

export default function VIP() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [niveles, setNiveles] = useState([]);

  useEffect(() => {
    api.levels.list().then(setNiveles).catch(() => []);
  }, []);

  const formatBOB = (val) => Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Generar la estructura de comisiones basada en los niveles reales de la DB
  const commissionStructure = niveles
    .filter(n => n.codigo !== 'pasante' && n.codigo !== 'internar')
    .sort((a, b) => (a.orden || 0) - (b.orden || 0))
    .map(n => {
      const inv = n.deposito || n.costo || 0;
      return {
        level: n.codigo,
        req: `${formatBOB(inv)} BOB`,
        a: formatBOB(inv * 0.12),
        b: formatBOB(inv * 0.03),
        c: formatBOB(inv * 0.01)
      };
    });

  const handleUpgrade = (nivel) => {
    // Redirigir a recarga con el monto y modo pre-configurados
    navigate('/recargar', {
      state: {
        monto: nivel.deposito || nivel.costo,
        modo: 'Compra VIP',
        nivelId: nivel.id,
        nivelNombre: nivel.nombre
      }
    });
  };

  // Función para determinar si un nivel es superior al actual
  const esNivelSuperior = (nivel) => {
    const currentNivel = niveles.find(n => n.id === user?.nivel_id);
    if (!currentNivel) return true; // Si no hay nivel, permitir subir a cualquiera
    return (nivel.orden || 0) > (currentNivel.orden || 0);
  };

  return (
    <Layout>
      <Header title="Centro VIP" />
      <div className="p-5 space-y-6 pb-24 bg-gray-50/30 min-h-screen relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-40 -left-20 w-64 h-64 bg-[#1a1f36]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-40 -right-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Hero VIP con Estilo Premium */}
        <div className="bg-gradient-to-br from-[#1a1f36] to-[#2a2f46] text-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_-15px_rgba(26,31,54,0.4)] relative overflow-hidden text-center border border-white/10 group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -ml-16 -mb-16 blur-2xl" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 border-2 border-white/30 shadow-2xl relative z-10">
                <Crown className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" size={40} strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">Tu Estatus Actual</p>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white drop-shadow-xl">
              {user?.nivel_codigo === 'internar' ? 'PASANTE' : user?.nivel_codigo || user?.nivel}
            </h2>
            <div className="mt-4 w-12 h-1 bg-[#00C853] rounded-full shadow-[0_0_10px_#00C853]" />
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-3 mb-2 px-1">
            <div className="w-1.5 bg-[#1a1f36] h-5 rounded-full shadow-[0_0_10px_rgba(26,31,54,0.3)]" />
            <h3 className="text-xs font-black text-[#1a1f36] uppercase tracking-[0.2em]">Niveles de Inversión</h3>
          </div>

          {niveles.map((nivel) => {
            const esActual = nivel.id === user?.nivel_id;
            const esSuperior = esNivelSuperior(nivel);
            const estaBloqueadoAdmin = nivel.activo === false;

            return (
              <div
                key={nivel.id}
                className={`rounded-[2rem] p-6 border transition-all relative overflow-hidden group ${
                  esActual ? 'border-[#00C853] bg-white shadow-[0_20px_40px_-10px_rgba(0,200,83,0.1)]' :
                  esSuperior && !estaBloqueadoAdmin ? 'border-gray-100 bg-white hover:border-[#1a1f36]/30 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_45px_-10px_rgba(26,31,54,0.1)]' :
                  'border-gray-50 bg-gray-50/50 opacity-60 grayscale'
                }`}
              >
                {/* Decoración de fondo de tarjeta */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none transition-transform group-hover:scale-150" />

                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border-2 transition-transform group-hover:scale-110 duration-500 ${
                      esActual ? 'bg-[#00C853]/10 text-[#00C853] border-[#00C853]/20' : 'bg-[#1a1f36]/5 text-[#1a1f36] border-white'
                    }`}>
                      <Crown size={28} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="font-black text-[#1a1f36] uppercase tracking-tighter text-lg">{nivel.nombre}</h4>
                      <p className="text-[#1a1f36] font-black text-2xl tracking-tighter mt-0.5">
                        {(nivel.deposito || nivel.costo)?.toFixed(0)} 
                        <span className="text-[10px] text-gray-400 font-bold ml-1.5 uppercase tracking-widest">BOB</span>
                      </p>
                    </div>
                  </div>

                  {esActual ? (
                    <div className="flex items-center gap-1.5 bg-[#00C853] text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_10px_20px_rgba(0,200,83,0.3)]">
                      <CheckCircle2 size={14} strokeWidth={3} /> Activo
                    </div>
                  ) : esSuperior && !estaBloqueadoAdmin ? (
                    <button
                      onClick={() => handleUpgrade(nivel)}
                      className="bg-[#1a1f36] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_10px_25px_rgba(26,31,54,0.3)] active:scale-90 transition-all hover:shadow-[0_15px_30px_rgba(26,31,54,0.4)]"
                    >
                      Unirse
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-gray-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 border border-gray-200">
                      <Lock size={14} /> {estaBloqueadoAdmin ? 'Pronto' : 'Cerrado'}
                    </div>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 transition-all group-hover:bg-white group-hover:border-[#1a1f36]/10">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tareas diarias</p>
                    <p className="text-sm font-black text-gray-700">{(nivel.num_tareas_diarias || nivel.tareas_diarias)} <span className="text-[10px] text-gray-400 uppercase font-bold ml-1">Videos</span></p>
                  </div>
                  <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 transition-all group-hover:bg-white group-hover:border-[#1a1f36]/10">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Ingreso diario</p>
                    <p className="text-sm font-black text-[#00C853]">
                      +{( (nivel.num_tareas_diarias || nivel.tareas_diarias) * (nivel.comision_por_tarea || nivel.recompensa_tarea) ).toFixed(2)} 
                      <span className="text-[10px] font-bold ml-1 uppercase">BOB</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* --- NUEVA SECCIÓN: GANANCIAS, RECOMPENSAS Y BENEFICIOS --- */}
        <div className="space-y-6 pt-10 relative z-10">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="w-1.5 bg-[#1a1f36] h-5 rounded-full shadow-[0_0_10px_rgba(26,31,54,0.3)]" />
            <h3 className="text-xs font-black text-[#1a1f36] uppercase tracking-[0.2em]">Ganancias y Recompensas</h3>
          </div>

          {/* Tarjeta de Beneficios de Recomendación */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00C853] flex items-center justify-center shadow-inner">
                <Users size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="font-black text-[#1a1f36] uppercase tracking-widest text-xs">Beneficios de Recomendación</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Gana por invitar amigos</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { level: 'A', percent: '12%', color: 'bg-emerald-500' },
                { level: 'B', percent: '3%', color: 'bg-emerald-400' },
                { level: 'C', percent: '1%', color: 'bg-emerald-300' },
              ].map((item) => (
                <div key={item.level} className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nivel {item.level}</p>
                  <p className={`text-xl font-black ${item.color.replace('bg-', 'text-')} tracking-tighter`}>{item.percent}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-gray-500 font-medium leading-relaxed italic text-center px-4">
              "Recibe comisiones directas sobre el valor de las tareas realizadas por tus subordinados en tres niveles."
            </p>
          </div>

          {/* Tabla Detallada S1 - S9 */}
          <div className="bg-[#1a1f36] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 relative">
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            
            <div className="p-8 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="text-yellow-400" size={18} />
                <h4 className="text-white font-black uppercase tracking-widest text-xs">Detalle de Recompensas por Nivel</h4>
              </div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Relación de ingresos por invitación</p>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-y border-white/5">
                    <th className="py-5 px-6 text-[9px] font-black text-white/40 uppercase tracking-widest">Nivel</th>
                    <th className="py-5 px-4 text-[9px] font-black text-white/40 uppercase tracking-widest">Inversión</th>
                    <th className="py-5 px-4 text-[9px] font-black text-white/40 uppercase tracking-widest">Rec. A</th>
                    <th className="py-5 px-4 text-[9px] font-black text-white/40 uppercase tracking-widest">Rec. B</th>
                    <th className="py-5 px-4 text-[9px] font-black text-white/40 uppercase tracking-widest">Rec. C</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {commissionStructure.map((row) => (
                    <tr key={row.level} className="hover:bg-white/5 transition-colors">
                      <td className="py-5 px-6">
                        <span className="flex items-center gap-2">
                          <Crown size={12} className="text-yellow-500/50" />
                          <span className="text-xs font-black text-white">{row.level}</span>
                        </span>
                      </td>
                      <td className="py-5 px-4">
                        <span className="text-[10px] font-black text-gray-300">{row.req}</span>
                      </td>
                      <td className="py-5 px-4">
                        <span className="text-xs font-black text-emerald-400">+{row.a}</span>
                      </td>
                      <td className="py-5 px-4">
                        <span className="text-xs font-black text-blue-400">+{row.b}</span>
                      </td>
                      <td className="py-5 px-4">
                        <span className="text-xs font-black text-indigo-400">+{row.c}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 bg-white/5 text-center">
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Nivel A 12%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Nivel B 3%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Nivel C 1%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta de Información Adicional */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                <Info size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-black uppercase tracking-widest text-xs mb-2">Seguridad y Transparencia</h4>
                <p className="text-[10px] font-medium leading-relaxed opacity-80">
                  Todas las comisiones se calculan en tiempo real basándose en la actividad de tus referidos. Las ganancias se depositan directamente en tu saldo de comisiones y son retirables bajo las condiciones del sistema.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
