import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

function defaultHorario() {
  return {
    enabled: false,
    dias_semana: [1, 2, 3, 4, 5, 6, 0],
    hora_inicio: '09:00',
    hora_fin: '18:00',
  };
}

function HorarioEditor({ label, value, onChange }) {
  const days = [
    { v: 0, l: 'Do' },
    { v: 1, l: 'Lu' },
    { v: 2, l: 'Ma' },
    { v: 3, l: 'Mi' },
    { v: 4, l: 'Ju' },
    { v: 5, l: 'Vi' },
    { v: 6, l: 'Sá' },
  ];
  const toggle = (v) => {
    const cur = new Set(value?.dias_semana || []);
    if (cur.has(v)) cur.delete(v);
    else cur.add(v);
    onChange({ ...(value || defaultHorario()), dias_semana: [...cur].sort((a, b) => a - b) });
  };
  const v = value || defaultHorario();
  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={!!v.enabled}
          onChange={(e) => onChange({ ...v, enabled: e.target.checked })}
        />
        <span className="font-medium text-gray-800">{label}</span>
      </label>
      <p className="text-xs text-gray-600">
        Si está desactivado, no hay restricción de horario para esta operación.
      </p>
      <div className="flex flex-wrap gap-2">
        {days.map((d) => (
          <button
            key={d.v}
            type="button"
            onClick={() => toggle(d.v)}
            className={`px-2 py-1 rounded-lg text-sm border ${
              (v.dias_semana || []).includes(d.v)
                ? 'bg-sav-primary text-white border-sav-primary'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {d.l}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Desde (hora local)</label>
          <input
            type="time"
            value={v.hora_inicio || '09:00'}
            onChange={(e) => onChange({ ...v, hora_inicio: e.target.value })}
            className="rounded-lg border border-gray-300 px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Hasta</label>
          <input
            type="time"
            value={v.hora_fin || '18:00'}
            onChange={(e) => onChange({ ...v, hora_fin: e.target.value })}
            className="rounded-lg border border-gray-300 px-2 py-1"
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminContenidoHome() {
  const [form, setForm] = useState({
    home_guide: '',
    popup_title: '',
    popup_message: '',
    popup_enabled: true,
    conferencia_title: '',
    conferencia_noticias: '',
    horario_recarga: defaultHorario(),
    horario_retiro: defaultHorario(),
    require_s3_subordinates: true,
    recompensas_visibles: true,
    recompensa_amigos_activa: true,
    recompensa_amigos_cantidad: 10,
    recompensa_amigos_nivel_minimo: 'S1',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.admin.publicContent().then(setForm).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.admin.updatePublicContent(form);
      setForm(updated);
      alert('Contenido actualizado');
    } catch (e) {
      alert(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Contenido Home</h1>
        <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px] mt-1">Notificaciones, horarios y noticias generales</p>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm p-6 md:p-8 space-y-8 border border-gray-100">
        <div className="space-y-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Guía y Notificaciones</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Guía (bloque azul en Home)</label>
              <textarea
                rows={3}
                value={form.home_guide || ''}
                onChange={(e) => setForm((f) => ({ ...f, home_guide: e.target.value }))}
                className="w-full rounded-2xl bg-gray-50 border-2 border-gray-50 px-5 py-4 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
                placeholder="Texto de guia para principiantes"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Título de notificación</label>
                <input
                  type="text"
                  value={form.popup_title || ''}
                  onChange={(e) => setForm((f) => ({ ...f, popup_title: e.target.value }))}
                  className="w-full rounded-2xl bg-gray-50 border-2 border-gray-50 px-5 py-4 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Estado</label>
                <label className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={!!form.popup_enabled}
                    onChange={(e) => setForm((f) => ({ ...f, popup_enabled: e.target.checked }))}
                    className="w-5 h-5 rounded-lg border-2 border-gray-300 text-sav-primary focus:ring-0 transition-all"
                  />
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-800 transition-colors">Mostrar al entrar</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Mensaje de notificación</label>
              <textarea
                rows={3}
                value={form.popup_message || ''}
                onChange={(e) => setForm((f) => ({ ...f, popup_message: e.target.value }))}
                className="w-full rounded-2xl bg-gray-50 border-2 border-gray-50 px-5 py-4 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 space-y-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Restricciones de Niveles</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Requisito para S4/S5</label>
              <label className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!!form.require_s3_subordinates}
                  onChange={(e) => setForm((f) => ({ ...f, require_s3_subordinates: e.target.checked }))}
                  className="w-5 h-5 rounded-lg border-2 border-gray-300 text-sav-primary focus:ring-0 transition-all"
                />
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-800 transition-colors">
                  Exigir 20 subordinados S3 para subir a S4/S5
                </span>
              </label>
              <p className="text-[10px] text-gray-400 italic ml-2 font-medium">
                Si está activado, el sistema verificará automáticamente que el usuario tenga 20 subordinados de nivel S3 antes de permitirle solicitar el ascenso a S4 o S5.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 space-y-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Configuración de Recompensas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Visibilidad Global</label>
              <label className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!!form.recompensas_visibles}
                  onChange={(e) => setForm((f) => ({ ...f, recompensas_visibles: e.target.checked }))}
                  className="w-5 h-5 rounded-lg border-2 border-gray-300 text-sav-primary focus:ring-0 transition-all"
                />
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-800 transition-colors">
                  Mostrar sección de recompensas
                </span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Reto de Amigos (S1+)</label>
              <label className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={!!form.recompensa_amigos_activa}
                  onChange={(e) => setForm((f) => ({ ...f, recompensa_amigos_activa: e.target.checked }))}
                  className="w-5 h-5 rounded-lg border-2 border-gray-300 text-sav-primary focus:ring-0 transition-all"
                />
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-800 transition-colors">
                  Activar reto de 10 amigos
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 space-y-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Horarios de Operación</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HorarioEditor
              label="Restringir recargas"
              value={form.horario_recarga}
              onChange={(h) => setForm((f) => ({ ...f, horario_recarga: h }))}
            />
            <HorarioEditor
              label="Restringir retiros"
              value={form.horario_retiro}
              onChange={(h) => setForm((f) => ({ ...f, horario_retiro: h }))}
            />
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 space-y-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Noticias de conferencia</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Título de sección</label>
              <input
                type="text"
                value={form.conferencia_title || ''}
                onChange={(e) => setForm((f) => ({ ...f, conferencia_title: e.target.value }))}
                className="w-full rounded-2xl bg-gray-50 border-2 border-gray-50 px-5 py-4 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Contenido de la reunión</label>
              <textarea
                rows={6}
                value={form.conferencia_noticias || ''}
                onChange={(e) => setForm((f) => ({ ...f, conferencia_noticias: e.target.value }))}
                className="w-full rounded-2xl bg-gray-50 border-2 border-gray-50 px-5 py-4 text-gray-800 font-bold text-sm focus:border-sav-primary/20 transition-all outline-none font-mono"
                placeholder={'• Reunión sábado 10:00\n• Tema: niveles\n• Enlace Zoom: ...'}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-[#1a1f36] text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#1a1f36]/20 active:scale-[0.98] transition-all"
        >
          {saving ? 'Guardando cambios...' : 'Guardar configuración global'}
        </button>
      </div>
    </div>
  );
}
