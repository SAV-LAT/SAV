import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Users, CreditCard, Wallet } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.admin.dashboard().then(setData).catch(() => setData({}));
  }, []);

  const d = data || {};

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Panel de administración</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Usuarios</p>
              <p className="text-2xl font-bold">{d.total_usuarios ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CreditCard className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Recargas pendientes</p>
              <p className="text-2xl font-bold">{d.pendientes_recarga ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Wallet className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Retiros pendientes</p>
              <p className="text-2xl font-bold">{d.pendientes_retiro ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#1a1f36]/10 flex items-center justify-center">
              <Wallet className="text-[#1a1f36]" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Total retiros</p>
              <p className="text-2xl font-black text-[#1a1f36]">{(d.total_retiros ?? 0).toFixed(2)} BOB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
