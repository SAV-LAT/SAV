/** Valores por defecto para store.publicContent (merge superficial). */
export const publicContentDefaults = {
  home_guide: '',
  popup_title: '',
  popup_message: '',
  popup_enabled: false,
  conferencia_title: '',
  conferencia_noticias: '',
  /** Si enabled=false, recargas/retiros sin restricción de horario. */
  horario_recarga: {
    enabled: false,
    dias_semana: [1, 2, 3, 4, 5, 6, 0],
    hora_inicio: '09:00',
    hora_fin: '18:00',
  },
  horario_retiro: {
    enabled: false,
    dias_semana: [1, 2, 3, 4, 5, 6, 0],
    hora_inicio: '09:00',
    hora_fin: '18:00',
  },
  /** Requisito de 20 subordinados S3 para ascender a S4/S5 */
  require_s3_subordinates: true,
  /** Configuración de Recompensas */
  recompensas_visibles: true,
  recompensa_bienvenida_activa: true,
  recompensa_deposito_activa: true,
  recompensa_amigos_activa: true,
  recompensa_amigos_cantidad: 10,
  recompensa_amigos_nivel_minimo: 'S1', // S1 o superior
};

export function mergePublicContent(pc) {
  const base = { ...publicContentDefaults, ...(pc || {}) };
  if (pc?.horario_recarga) {
    base.horario_recarga = { ...publicContentDefaults.horario_recarga, ...pc.horario_recarga };
  }
  if (pc?.horario_retiro) {
    base.horario_retiro = { ...publicContentDefaults.horario_retiro, ...pc.horario_retiro };
  }
  return base;
}
