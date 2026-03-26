export function parseMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return 0;
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/** @returns {{ ok: boolean, message?: string }} */
export function isScheduleOpen(schedule, now = new Date()) {
  if (!schedule || schedule.enabled === false) return { ok: true };
  const dias = Array.isArray(schedule.dias_semana) ? schedule.dias_semana : [];
  if (dias.length === 0) return { ok: false, message: 'No hay días habilitados.' };
  const day = now.getDay();
  if (!dias.includes(day)) {
    return { ok: false, message: 'Hoy no está permitido.' };
  }
  const start = parseMinutes(schedule.hora_inicio || '00:00');
  const end = parseMinutes(schedule.hora_fin || '23:59');
  const cur = now.getHours() * 60 + now.getMinutes();
  let inWindow;
  if (start <= end) inWindow = cur >= start && cur <= end;
  else inWindow = cur >= start || cur <= end;
  if (!inWindow) {
    return {
      ok: false,
      message: `Fuera del horario (${schedule.hora_inicio || '00:00'} – ${schedule.hora_fin || '23:59'}).`,
    };
  }
  return { ok: true };
}
