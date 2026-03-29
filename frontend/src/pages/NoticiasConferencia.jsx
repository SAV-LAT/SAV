import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { api } from '../lib/api';
import { Bell } from 'lucide-react';

export default function NoticiasConferencia() {
  const [title, setTitle] = useState('Noticias de conferencia');
  const [body, setBody] = useState('');

  useEffect(() => {
    api
      .publicContent()
      .then((d) => {
        setTitle(d.conferencia_title || 'Noticias de conferencia');
        setBody(d.conferencia_noticias || '');
      })
      .catch(() => {});
  }, []);

  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <Layout>
      <Header title="Noticias" />
      <div className="p-4 space-y-4 bg-white min-h-screen">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#1a1f36] flex items-center justify-center flex-shrink-0 shadow-md">
            <Bell className="text-white" size={22} />
          </div>
          <div>
            <p className="font-black text-[#1a1f36] uppercase tracking-tighter">{title}</p>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">Actualizaciones oficiales del sistema</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          {lines.length === 0 ? (
            <p className="text-sm text-gray-500 font-medium">Aún no hay noticias publicadas.</p>
          ) : (
            <ul className="space-y-4">
              {lines.map((line, i) => (
                <li
                  key={i}
                  className="flex gap-4 text-sm text-gray-700 border-b border-gray-50 last:border-0 pb-4 last:pb-0 items-start"
                >
                  <span className="text-[#1a1f36] font-black text-lg mt-[-2px]">•</span>
                  <span className="flex-1 whitespace-pre-wrap font-medium leading-relaxed">{line.replace(/^[•\-*]\s*/, '')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
