import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { api } from '../lib/api';

export default function BillingRecord() {
  const [tab, setTab] = useState('ingresos');
  const [retiros, setRetiros] = useState([]);
  const [recargas, setRecargas] = useState([]);

  useEffect(() => {
    const fetchData = () => {
      api.withdrawals.list().then(setRetiros).catch(() => []);
      api.recharges.list().then(setRecargas).catch(() => []);
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000); // Actualizar cada 10s
    return () => clearInterval(interval);
  }, []);

  const items = tab === 'ingresos' 
    ? [...recargas.map(r => ({ ...r, tipo: 'recarga', monto: r.monto }))]
    : [...retiros.map(r => ({ ...r, tipo: 'retiro', monto: -r.monto }))];

  return (
    <Layout>
      <Header title="Registro de facturación" />
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab('ingresos')}
          className={`flex-1 py-3 font-medium ${tab === 'ingresos' ? 'text-black border-b-2 border-black' : 'text-gray-400'}`}
        >
          ingresos
        </button>
        <button
          onClick={() => setTab('gastos')}
          className={`flex-1 py-3 font-medium ${tab === 'gastos' ? 'text-black border-b-2 border-black' : 'text-gray-400'}`}
        >
          gastos
        </button>
      </div>
      <div className="p-4">
        {items.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No hay más datos</p>
        ) : (
          <div className="space-y-4">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-500">{i.id?.slice(0, 12)}</p>
                  <p className={`font-black ${i.monto < 0 ? 'text-rose-500' : 'text-[#00C853]'}`}>
                    {i.monto > 0 ? '+' : ''}{i.monto?.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{i.tipo}</p>
                  <p className="text-xs text-gray-500">{i.created_at ? new Date(i.created_at).toLocaleString() : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-center text-gray-400 py-6 text-sm">No hay más datos</p>
      </div>
    </Layout>
  );
}
