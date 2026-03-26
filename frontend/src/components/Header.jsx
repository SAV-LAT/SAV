import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Header({ title, rightAction }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-[#1a1f36] flex items-center justify-between px-5 py-4 border-b border-white/5 shadow-lg">
      <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl bg-white/10 text-white active:scale-90 transition-transform hover:bg-white/20">
        <ArrowLeft size={20} />
      </button>
      <h1 className="font-black text-white text-sm uppercase tracking-widest">{title}</h1>
      <div className="w-10 flex justify-end">{rightAction}</div>
    </header>
  );
}
