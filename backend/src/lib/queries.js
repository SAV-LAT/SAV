import { supabase, hasDb } from './db.js';

export async function trySupabase(operation, retries = 3) {
  if (!supabase || !hasDb()) {
    console.error('[CRITICAL] No se pudo conectar con la base de datos de Supabase. El modo memoria (demo) está DESACTIVADO.');
    throw new Error('Error crítico de conexión: No hay base de datos disponible.');
  }
  
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await operation();
      if (error) {
        console.error(`[Supabase Error Logged] (Intento ${i + 1}/${retries}):`, JSON.stringify(error, null, 2));
        lastError = error;
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff simple
          continue;
        }
        throw error;
      }
      return { data, error: null, fallback: false };
    } catch (err) {
      console.error(`[Supabase Critical Logged] (Intento ${i + 1}/${retries}):`, err.message || err);
      lastError = err;
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function getUsers() {
  const { data } = await trySupabase(() => supabase.from('usuarios').select('*'));
  return data || [];
}

export async function findUserByTelefono(telefono) {
  const { data } = await trySupabase(() => supabase.from('usuarios').select('*').eq('telefono', telefono).maybeSingle());
  return data;
}

/**
 * Utilidades para fechas en zona horaria de Bolivia (America/La_Paz)
 */
export const boliviaTime = {
  // Obtiene la fecha actual en Bolivia como objeto Date
  now: () => {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'America/La_Paz' }));
  },
  
  // Obtiene la fecha actual en Bolivia como string YYYY-MM-DD
  todayStr: () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' });
  },

  // Obtiene la fecha de AYER en Bolivia como string YYYY-MM-DD
  yesterdayStr: () => {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/La_Paz' }));
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-CA');
  },

  // Obtiene el día de la semana actual en Bolivia (0-6)
  getDay: () => {
    const nowBolivia = new Date().toLocaleString('en-US', { timeZone: 'America/La_Paz' });
    return new Date(nowBolivia).getDay();
  },

  // Formatea cualquier fecha a string YYYY-MM-DD en Bolivia
  getDateString: (date) => {
    if (!date) return '';
    // Usar el constructor Date con la fecha proporcionada y formatear con en-CA para YYYY-MM-DD
    return new Date(date).toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' });
  },

  // Obtiene la hora actual en formato HH:mm
  getTimeString: (date = new Date()) => {
    return new Date(date).toLocaleTimeString('en-GB', { timeZone: 'America/La_Paz', hour: '2-digit', minute: '2-digit' });
  },

  // Comprueba si un horario (HH:mm) está dentro de un rango
  isTimeInWindow: (timeStr, start = '00:00', end = '23:59') => {
    if (start <= end) {
      return timeStr >= start && timeStr <= end;
    } else {
      // ventana que cruza medianoche
      return timeStr >= start || timeStr <= end;
    }
  },

  // Obtiene un objeto Date ajustado a Bolivia para comparaciones
  getBoliviaDate: (date) => {
    if (!date) return null;
    const boliviaStr = new Date(date).toLocaleString('en-US', { timeZone: 'America/La_Paz' });
    return new Date(boliviaStr);
  }
};

/**
 * Busca un usuario por ID
 */
export async function findUserById(id) {
  const { data } = await trySupabase(() => supabase.from('usuarios').select('*').eq('id', id).maybeSingle());
  return data;
}

export async function findUserByCodigo(codigo) {
  const { data } = await trySupabase(() => supabase.from('usuarios').select('*').eq('codigo_invitacion', codigo).maybeSingle());
  return data;
}

export async function findAdminByTelegramId(telegramId) {
  // 1. Buscar primero en la tabla de admins gestionados (la más importante para permisos de bot)
  const { data: admin } = await trySupabase(() => 
    supabase.from('admins')
      .select('*')
      .eq('telegram_user_id', String(telegramId))
      .eq('activo', true)
      .maybeSingle()
  );
  
  if (admin) return admin;

  // 2. FALLBACK: Buscar en la tabla de usuarios con rol admin (compatibilidad anterior)
  const { data: userAdmin } = await trySupabase(() => 
    supabase.from('usuarios')
      .select('*')
      .eq('telegram_user_id', String(telegramId))
      .eq('rol', 'admin')
      .maybeSingle()
  );
  
  // Mapear para que tenga el campo 'nombre' que espera la lógica
  if (userAdmin) {
    return {
      ...userAdmin,
      nombre: userAdmin.nombre_usuario || userAdmin.nombre_real
    };
  }

  return null;
}

/**
 * Busca un registro en la tabla admins usando el ID de usuario de la tabla usuarios
 */
export async function findAdminByUserId(userId) {
  const user = await findUserById(userId);
  if (!user) return null;
  
  // Intentamos buscar por teléfono primero, luego por telegram_user_id
  const { data: admin } = await trySupabase(() => 
    supabase.from('admins')
      .select('*')
      .or(`telefono.eq.${user.telefono},telegram_user_id.eq.${user.telegram_user_id}`)
      .eq('activo', true)
      .maybeSingle()
  );
  return admin;
}

/**
 * Activa el turno de recarga para un administrador específico y desactiva los demás
 */
export async function setActiveAdminForRecharges(adminId) {
  // Desactivar todos los turnos
  await trySupabase(() => 
    supabase.from('admins').update({ en_turno_recarga: false }).neq('id', adminId)
  );
  // Activar el turno para el admin actual
  const { data } = await trySupabase(() => 
    supabase.from('admins').update({ en_turno_recarga: true }).eq('id', adminId).select().maybeSingle()
  );
  return data;
}

export async function linkAdminTelegram(userId, telegramData) {
  const updates = {
    telegram_user_id: String(telegramData.id),
    telegram_username: telegramData.username || null,
    telegram_first_name: telegramData.first_name || null,
    telegram_last_name: telegramData.last_name || null,
    telegram_linked_at: new Date().toISOString()
  };
  return await updateUser(userId, updates);
}

export async function createUser(userData) {
  console.log(`[Queries] Intentando crear usuario: ${userData.nombre_usuario} (${userData.telefono})`);
  const { data } = await trySupabase(() => supabase.from('usuarios').insert([userData]).select().maybeSingle());
  console.log(`[Queries] Usuario creado exitosamente en Supabase: ${userData.nombre_usuario}`);
  return data;
}

export async function updateUser(id, updates) {
  // Verificamos si Supabase existe
  if (!supabase || !hasDb()) return null;

  try {
    // Evitar que "null" string llegue a la base de datos si se esperaba null real
    if (updates && updates.castigado_hasta === "null") {
      updates.castigado_hasta = null;
    }

    const { data, error } = await supabase.from('usuarios').update(updates).eq('id', id).select().maybeSingle();
    
    if (error) {
      console.error(`[Queries] Error al actualizar usuario ${id}:`, error.message);
      
      // Si el error es por columna inexistente, devolvemos un error amigable
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        throw new Error(`Error de base de datos: La columna solicitada no existe. Por favor, revisa tu esquema de Supabase.`);
      }
      
      throw new Error(`Error de persistencia: ${error.message}`);
    }
    
    return data;
  } catch (err) {
    console.error(`[Queries] Error crítico en updateUser:`, err.message);
    throw err;
  }
}

export async function getLevels() {
  const { data } = await trySupabase(() => supabase.from('niveles').select('*').order('orden', { ascending: true }));
  return data || [];
}

export async function getRecargas() {
  const { data } = await trySupabase(() => supabase.from('recargas').select('*, usuario:usuarios!usuario_id(nombre_usuario)').order('created_at', { ascending: false }));
  return data || [];
}

export async function getRecargaById(id) {
  const { data } = await trySupabase(() => supabase.from('recargas').select('*').eq('id', id).maybeSingle());
  return data;
}

export async function getRetiros() {
  const { data } = await trySupabase(() => supabase.from('retiros').select('*, usuario:usuarios!usuario_id(nombre_usuario)').order('created_at', { ascending: false }));
  return data || [];
}


export async function getMetodosQr() {
  try {
    const now = boliviaTime.now();
    const timeStr = boliviaTime.getTimeString(now); // HH:mm
    const day = now.getDay().toString(); // 0-6

    // 1. Obtener los administradores que están actualmente en turno
    const { data: admins } = await trySupabase(() => 
      supabase.from('admins')
        .select('id, nombre, hora_inicio_turno, hora_fin_turno, dias_semana, activo')
        .eq('activo', true)
    );

    const adminsEnTurno = (admins || []).filter(a => {
      const dias = (a.dias_semana || '').split(',');
      if (!dias.includes(day)) return false;
      
      const inicio = a.hora_inicio_turno || '00:00';
      const fin = a.hora_fin_turno || '23:59';
      
      if (inicio <= fin) {
        return timeStr >= inicio && timeStr <= fin;
      } else {
        // Turno que cruza medianoche
        return timeStr >= inicio || timeStr <= fin;
      }
    });

    if (adminsEnTurno.length === 0) {
      // Si no hay admins en turno, podemos mostrar QRs globales que no tengan admin_id (fallback)
      // Intentamos con admin_id, si falla (por migración), traemos todo
      try {
        const { data: globales } = await trySupabase(() => 
          supabase.from('metodos_qr')
            .select('*')
            .eq('activo', true)
            .is('admin_id', null)
            .order('orden', { ascending: true })
        );
        return globales || [];
      } catch (e) {
        // Fallback si la columna admin_id no existe aún
        const { data: todo } = await trySupabase(() => 
          supabase.from('metodos_qr')
            .select('*')
            .eq('activo', true)
            .order('orden', { ascending: true })
        );
        return todo || [];
      }
    }

    // 2. Obtener los QRs de los administradores en turno
    const adminIds = adminsEnTurno.map(a => a.id);
    try {
      const { data: qrsAdmins } = await trySupabase(() => 
        supabase.from('metodos_qr')
          .select('*')
          .eq('activo', true)
          .in('admin_id', adminIds)
      );

      if (qrsAdmins && qrsAdmins.length > 0) {
        // PRIORIDAD: 1. Seleccionada (Principal) -> 2. Cualquier QR activo del admin en turno
        const qrsOrdenados = [...qrsAdmins].sort((a, b) => {
          if (a.seleccionada && !b.seleccionada) return -1;
          if (!a.seleccionada && b.seleccionada) return 1;
          return 0;
        });

        // Formatear la respuesta para que incluya el nombre del admin
        return qrsOrdenados.map(qr => {
          const admin = adminsEnTurno.find(a => a.id === qr.admin_id);
          return {
            ...qr,
            nombre_titular: qr.nombre_titular || `Admin: ${admin?.nombre || 'Desconocido'}`
          };
        });
      }

      // 3. Fallback final a QRs globales si los admins en turno no tienen nada configurado
      const { data: globales } = await trySupabase(() => 
        supabase.from('metodos_qr')
          .select('*')
          .eq('activo', true)
          .is('admin_id', null)
          .order('orden', { ascending: true })
      );
      return globales || [];
    } catch (e) {
      // Fallback si las nuevas columnas no existen
      const { data: todo } = await trySupabase(() => 
        supabase.from('metodos_qr')
          .select('*')
          .eq('activo', true)
          .order('orden', { ascending: true })
      );
      return todo || [];
    }
  } catch (err) {
    console.error('[Queries] Error crítico en getMetodosQr:', err.message);
    return [];
  }
}

export async function getAllMetodosQr() {
  const { data } = await trySupabase(() => supabase.from('metodos_qr').select('*').order('created_at', { ascending: false }));
  return data || [];
}

export async function getRecargasByUser(userId) {
  const { data } = await trySupabase(() => supabase.from('recargas').select('*').eq('usuario_id', userId).order('created_at', { ascending: false }));
  return data || [];
}

export async function createRecarga(recargaData) {
  const { data } = await trySupabase(() => supabase.from('recargas').insert([recargaData]).select().maybeSingle());
  return data;
}

export async function updateRecarga(id, updates) {
  const { data } = await trySupabase(() => supabase.from('recargas').update(updates).eq('id', id).select().maybeSingle());
  return data;
}

export async function createRetiro(retiroData) {
  const { data } = await trySupabase(() => supabase.from('retiros').insert([retiroData]).select().maybeSingle());
  return data;
}

export async function getRetirosByUser(userId) {
  const { data } = await trySupabase(() => supabase.from('retiros').select('*').eq('usuario_id', userId).order('created_at', { ascending: false }));
  return data || [];
}

export async function getRetiroById(id) {
  const { data } = await trySupabase(() => supabase.from('retiros').select('*').eq('id', id).maybeSingle());
  return data;
}

export async function updateRetiro(id, updates) {
  const { data } = await trySupabase(() => supabase.from('retiros').update(updates).eq('id', id).select().maybeSingle());
  return data;
}

export async function getDailyWithdrawalSummary(dateStr) {
  // Obtenemos los retiros finalizados (pagados) del día
  const startOfDay = `${dateStr}T00:00:00Z`;
  const endOfDay = `${dateStr}T23:59:59Z`;

  const { data } = await trySupabase(() => 
    supabase.from('retiros')
      .select('monto, processed_by_admin_name')
      .eq('estado', 'pagado')
      .gte('procesado_at', startOfDay)
      .lte('procesado_at', endOfDay)
  );

  if (!data || data.length === 0) return [];

  // Agrupar por administrador
  const summary = data.reduce((acc, curr) => {
    const admin = curr.processed_by_admin_name || 'Admin Desconocido';
    if (!acc[admin]) {
      acc[admin] = { name: admin, count: 0, total: 0 };
    }
    acc[admin].count += 1;
    acc[admin].total += Number(curr.monto);
    return acc;
  }, {});

  return Object.values(summary);
}

export async function getAdminsInShift() {
  // 1. Intentar obtener el administrador que tiene el turno dinámico activado (por cambio de QR)
  const { data: dynamicAdmin } = await trySupabase(() => 
    supabase.from('admins')
      .select('*')
      .eq('activo', true)
      .eq('en_turno_recarga', true)
      .eq('recibe_notificaciones', true)
      .maybeSingle()
  );

  if (dynamicAdmin) {
    return [dynamicAdmin];
  }

  // 2. FALLBACK: Si no hay nadie con turno dinámico, usar la lógica de horarios anterior
  const now = new Date();
  const boliviaNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/La_Paz' }));
  const currentMinutes = boliviaNow.getHours() * 60 + boliviaNow.getMinutes();

  const { data: admins } = await trySupabase(() => 
    supabase.from('admins')
      .select('*')
      .eq('activo', true)
      .eq('recibe_notificaciones', true)
  );

  if (!admins) return [];

  return admins.filter(admin => {
    const [startH, startM] = admin.hora_inicio_turno.split(':').map(Number);
    const [endH, endM] = admin.hora_fin_turno.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    if (startMin <= endMin) {
      return currentMinutes >= startMin && currentMinutes <= endMin;
    } else {
      // Turno que cruza medianoche
      return currentMinutes >= startMin || currentMinutes <= endMin;
    }
  });
}

export async function getTarjetasByUser(userId) {
  const { data } = await trySupabase(() => supabase.from('tarjetas_bancarias').select('*').eq('usuario_id', userId));
  return data || [];
}

export async function createTarjeta(tarjetaData) {
  const { data } = await trySupabase(() => supabase.from('tarjetas_bancarias').insert([tarjetaData]).select().maybeSingle());
  return data;
}

export async function deleteTarjeta(id, userId) {
  await trySupabase(() => supabase.from('tarjetas_bancarias').delete().eq('id', id).eq('usuario_id', userId));
  return true;
}

export async function getPublicContent() {
  const { data } = await trySupabase(() => supabase.from('configuraciones').select('*'));
  return (data || []).reduce((acc, curr) => {
    let valor = curr.valor;
    // Intentar parsear CUALQUIER valor que pueda ser JSON (objetos, arrays, booleans, números)
    try {
      if (valor === 'true') valor = true;
      else if (valor === 'false') valor = false;
      else if (valor && (valor.startsWith('{') || valor.startsWith('['))) {
        valor = JSON.parse(valor);
      } else if (!isNaN(valor) && valor.trim() !== '') {
        // Si es un número puro, parsearlo (opcional, pero útil para recompensas_amigos_cantidad)
        valor = parseFloat(valor);
      }
    } catch (e) {
      // Si falla, mantener como string
    }
    return { ...acc, [curr.clave]: valor };
  }, {});
}

export async function getBanners() {
  const { data } = await trySupabase(() => supabase.from('banners_carrusel').select('*').eq('activo', true).order('orden', { ascending: true }));
  
  const defaultBanners = [
    { id: 'def-1', imagen_url: '/imag/carrusel1.jpeg', titulo: 'SAV 1', orden: 0, activo: true },
    { id: 'def-2', imagen_url: '/imag/carrusel2.jpeg', titulo: 'SAV 2', orden: 1, activo: true },
    { id: 'def-3', imagen_url: '/imag/carrusel3.jpeg', titulo: 'SAV 3', orden: 2, activo: true },
    { id: 'def-4', imagen_url: '/imag/carrusel4.jpeg', titulo: 'SAV 4', orden: 3, activo: true },
  ];

  if (data && data.length > 0) {
    return data.map(b => ({
      ...b,
      imagen_url: b.imagen_url === '/imag/carusel1.jpeg' ? '/imag/carrusel1.jpeg' : b.imagen_url
    }));
  }
  return defaultBanners;
}

export async function getAllTasks() {
  const { data } = await trySupabase(() => supabase.from('tareas').select('*').order('created_at', { ascending: false }));
  return data || [];
}

export async function getTasks(nivelId) {
  const { data } = await trySupabase(() => supabase.from('tareas').select('*').eq('nivel_id', nivelId).eq('activa', true));
  return data || [];
}

export async function getPremiosRuleta() {
  const { data } = await trySupabase(() => supabase.from('premios_ruleta').select('*').order('orden', { ascending: true }));
  return (data || []).filter(p => p.activo !== false);
}

export async function getSorteosGanadores() {
  const { data } = await trySupabase(() => supabase.from('sorteos_ganadores').select('*, usuario:usuarios(nombre_usuario, telefono)').order('created_at', { ascending: false }).limit(20));
  return data || [];
}

export async function createSorteoGanador(ganador) {
  const { data, error } = await trySupabase(() => supabase.from('sorteos_ganadores').insert([ganador]).select().maybeSingle());
  if (error) throw error;
  return data;
}

export async function getTaskById(id) {
  const { data } = await trySupabase(() => supabase.from('tareas').select('*').eq('id', id).maybeSingle());
  return data;
}

export async function getTaskActivity(userId) {
  // Optimizamos la consulta para traer solo lo necesario de hoy
  const { data } = await trySupabase(() => 
    supabase
      .from('actividad_tareas')
      .select('id, created_at, tarea_id, respuesta_correcta')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
      .limit(50) // Suficiente para validar tareas diarias
  );
  return data || [];
}

export async function createTaskActivity(activity) {
  const { data } = await trySupabase(() => supabase.from('actividad_tareas').insert([activity]).select().maybeSingle());
  return data;
}

/**
 * Procesa el ascenso de nivel de un usuario y otorga tickets de ruleta al invitador (Upline)
 * Basado solo en el PRIMER ascenso del subordinado.
 */
export async function handleLevelUpRewards(userId, oldLevelId, newLevelId) {
  try {
    const user = await findUserById(userId);
    const levels = await getLevels();
    const newLevel = levels.find(l => l.id === newLevelId);
    
    if (!user || !newLevel || !user.invitado_por) return;

    // Solo otorgar si es el PRIMER ascenso (nunca antes ha ascendido)
    if (user.primer_ascenso_completado) {
      console.log(`[Recompensas] El usuario ${user.nombre_usuario} ya realizó su primer ascenso anteriormente.`);
      return;
    }

    // Lógica de tickets según nivel: S1=1, S2=2, S3=3, etc.
    const levelCode = String(newLevel.codigo).toUpperCase();
    let rewardTickets = 0;

    if (levelCode.startsWith('S')) {
      const num = parseInt(levelCode.substring(1));
      if (!isNaN(num)) rewardTickets = num;
    }

    if (rewardTickets > 0) {
      const inviter = await findUserById(user.invitado_por);
      if (inviter) {
        // VERIFICAR SI EL INVITADOR ESTÁ CASTIGADO
        const castigado = await isUserPunished(inviter.id);
        if (castigado) {
          console.log(`[Recompensas] Invitador ${inviter.nombre_usuario} está castigado. No recibe tickets de primer ascenso.`);
          return;
        }

        console.log(`[Recompensas] Primer ascenso de ${user.nombre_usuario} a ${levelCode}. Otorgando ${rewardTickets} tickets a ${inviter.nombre_usuario}.`);
        
        // Marcar el primer ascenso como completado para este usuario
        await updateUser(user.id, { primer_ascenso_completado: true });

        // Sumar tickets al invitador
        await updateUser(inviter.id, { 
          tickets_ruleta: (Number(inviter.tickets_ruleta) || 0) + rewardTickets 
        });
      }
    }
  } catch (err) {
    console.error('[Recompensas] Error en handleLevelUpRewards:', err);
  }
}

/**
 * Distribuye comisiones a la línea ascendente (Upline)
 * Restricción: Solo se paga si el invitador tiene rango >= subordinado
 */
/**
 * Distribuye comisiones por tareas a la red (Niveles A, B, C)
 */
export async function distributeTaskCommissions(userId, baseAmount) {
  console.log(`[Comisiones Tareas] Iniciando distribución para usuario ${userId}, monto base: ${baseAmount}`);
  
  try {
    const user = await findUserById(userId);
    if (!user || !user.invitado_por) return;

    // REGLA: Si el usuario origen es pasante, no genera comisiones
    const levels = await getLevels();
    const userLevel = levels.find(l => l.id === user.nivel_id);
    const userLevelCode = String(userLevel?.codigo || '').toLowerCase();
    
    if (userLevelCode === 'pasante' || userLevelCode === 'internar') {
      console.log(`[Comisiones Tareas] Usuario ${user.nombre_usuario} es pasante. No genera comisiones.`);
      return;
    }

    // Porcentajes: A: 0.7%, B: 0.6%, C: 0.5%
    const configs = [
      { key: 'A', percent: 0.007 },
      { key: 'B', percent: 0.006 },
      { key: 'C', percent: 0.005 }
    ];

    let currentUplineId = user.invitado_por;
    for (const config of configs) {
      if (!currentUplineId) break;
      const upline = await findUserById(currentUplineId);
      if (!upline) break;

      const castigado = await isUserPunished(upline.id);
      if (castigado) {
        console.log(`[Comisiones Tareas] Upline ${upline.nombre_usuario} castigado. Salta.`);
        currentUplineId = upline.invitado_por;
        continue;
      }

      const commission = Number((baseAmount * config.percent).toFixed(4)); // Más precisión para tareas
      if (commission > 0) {
        console.log(`[Comisiones Tareas] Nivel ${config.key}: ${commission} BOB para ${upline.nombre_usuario}`);
        await addUserEarnings(
          upline.id, 
          commission, 
          'comision_tarea', 
          user.id, 
          `Comisión Tarea Nivel ${config.key} (Origen: ${user.nombre_usuario})`
        );
      }
      
      currentUplineId = upline.invitado_por;
    }
  } catch (err) {
    console.error('[Comisiones Tareas] Error:', err);
  }
}

/**
 * Distribuye comisiones por inversión (Recargas/Ascensos) a la red (Niveles A, B, C)
 */
export async function distributeInvestmentCommissions(userId, amount) {
  console.log(`[Comisiones Inversión] Iniciando distribución para usuario ${userId}, monto: ${amount}`);
  
  try {
    const user = await findUserById(userId);
    if (!user || !user.invitado_por || !amount || amount <= 0) return;

    const levels = await getLevels();
    const userLevel = levels.find(l => l.id === user.nivel_id);
    const userLevelCode = String(userLevel?.codigo || '').toLowerCase();
    
    if (userLevelCode === 'pasante' || userLevelCode === 'internar') {
      console.log(`[Comisiones Inversión] Usuario ${user.nombre_usuario} es pasante. No genera comisiones.`);
      return;
    }

    // Porcentajes: A: 12%, B: 3%, C: 1%
    const configs = [
      { key: 'A', percent: 0.12 },
      { key: 'B', percent: 0.03 },
      { key: 'C', percent: 0.01 }
    ];

    let currentUplineId = user.invitado_por;
    for (const config of configs) {
      if (!currentUplineId) break;
      const upline = await findUserById(currentUplineId);
      if (!upline) break;

      const castigado = await isUserPunished(upline.id);
      if (castigado) {
        currentUplineId = upline.invitado_por;
        continue;
      }

      const commission = Number((amount * config.percent).toFixed(2));
      if (commission > 0) {
        console.log(`[Comisiones Inversión] Nivel ${config.key}: ${commission} BOB para ${upline.nombre_usuario}`);
        await addUserEarnings(
          upline.id, 
          commission, 
          'comision_inversion', 
          user.id, 
          `Comisión Inversión Nivel ${config.key} (Origen: ${user.nombre_usuario})`
        );
      }
      
      currentUplineId = upline.invitado_por;
    }
  } catch (err) {
    console.error('[Comisiones Inversión] Error:', err);
  }
}

/**
 * Registra un movimiento de saldo en la base de datos (Accounting by Events)
 */
export async function createMovimiento(movimiento) {
  const { data } = await trySupabase(() => 
    supabase.from('movimientos_saldo').insert([movimiento]).select().maybeSingle()
  );
  return data;
}

/**
 * Calcula las ganancias de un usuario para diferentes periodos en zona horaria de Bolivia
 */
export async function getUserEarningsSummary(userId) {
  console.log(`[Resumen] Calculando ganancias para usuario ${userId}...`);
  try {
    const user = await findUserById(userId);
    if (!user) return null;

    // Obtener todos los movimientos de ingreso del usuario
    let movimientos = [];
    try {
      const { data, error } = await supabase
        .from('movimientos_saldo')
        .select('*')
        .eq('usuario_id', userId)
        .in('tipo_movimiento', ['ganancia_tarea', 'comision_subordinado', 'recompensa_invitacion', 'ajuste_admin', 'comision_inversion', 'comision_tarea']);
      
      if (error) throw error;
      movimientos = data || [];
      console.log(`  - [OK] ${movimientos.length} movimientos recuperados.`);
    } catch (e) {
      console.warn(`[Resumen] No se pudo leer de movimientos_saldo. Usando caché de usuario.`);
      // Si la tabla no existe, devolvemos los campos de la tabla usuarios como fallback
      return {
        hoy: Number(user.ganancias_hoy || 0),
        ayer: Number(user.ganancias_ayer || 0),
        semana: Number(user.ganancias_semana || 0),
        mes: Number(user.ganancias_mes || 0),
        total: Number(user.ganancias_totales || 0),
        saldo_principal: Number(user.saldo_principal || 0),
        saldo_comisiones: Number(user.saldo_comisiones || 0),
        tareas_completadas: Number(user.tareas_completadas_exito || 0)
      };
    }

    const todayStr = boliviaTime.todayStr();
    
    const yesterday = new Date(boliviaTime.now());
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = boliviaTime.getDateString(yesterday);

    // Inicio de semana (Lunes) en Bolivia
    const boliviaNow = boliviaTime.now();
    
    const startOfWeek = new Date(boliviaNow);
    const day = startOfWeek.getDay(); // 0 (Dom) a 6 (Sab)
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ajuste a Lunes
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Inicio de mes
    const startOfMonth = new Date(boliviaNow.getFullYear(), boliviaNow.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    let hoy = 0, ayer = 0, semana = 0, mes = 0, total = 0;

    movimientos.forEach(m => {
      const mDateStr = boliviaTime.getDateString(m.fecha);
      const mDate = boliviaTime.getBoliviaDate(m.fecha);
      const monto = Number(m.monto) || 0;

      // Solo contar como "ingreso" si el monto es positivo
      if (monto > 0) {
        total += monto;
        if (mDateStr === todayStr) hoy += monto;
        if (mDateStr === yesterdayStr) ayer += monto;
        if (mDate >= startOfWeek) semana += monto;
        if (mDate >= startOfMonth) mes += monto;
      }
    });

    console.log(`  - [RESULTADO REAL] Hoy: ${hoy.toFixed(2)}, Total: ${total.toFixed(2)}`);

    return {
      hoy: Number(hoy.toFixed(2)),
      ayer: Number(ayer.toFixed(2)),
      semana: Number(semana.toFixed(2)),
      mes: Number(mes.toFixed(2)),
      total: Number(total.toFixed(2)),
      saldo_principal: Number(user.saldo_principal || 0),
      saldo_comisiones: Number(user.saldo_comisiones || 0),
      tareas_completadas: Number(user.tareas_completadas_exito || 0)
    };
  } catch (err) {
    console.error('[Resumen] Error crítico:', err);
    return null;
  }
}

/**
 * Registra ganancias en las estadísticas persistentes del usuario y crea un evento contable
 * Ahora utiliza una función RPC en la base de datos para garantizar atomicidad
 */
export async function addUserEarnings(userId, amount, tipo = 'ganancia_tarea', origenId = null, descripcion = null) {
  if (!amount || amount <= 0) return;
  
  // VERIFICAR SI EL USUARIO ESTÁ CASTIGADO
  const castigado = await isUserPunished(userId);
  if (castigado) {
    console.log(`[Earnings] Usuario ${userId} está castigado. No se acredita ganancia.`);
    return;
  }

  const referencia = `EARN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const desc = descripcion || (
    tipo === 'ganancia_tarea' ? 'Ganancia por tarea completada' : 
    tipo === 'comision_tarea' ? 'Comisión por tarea de red' :
    tipo === 'comision_inversion' ? 'Comisión por inversión de red' :
    'Comisión de red'
  );

  console.log(`[Earnings] Intentando acreditar ${amount} a ${userId} via RPC...`);

  // Intentamos usar la función RPC que maneja todo en una sola transacción SQL
  const { data, error } = await supabase.rpc('acreditar_ganancia', {
    p_usuario_id: userId,
    p_monto: amount,
    p_tipo: tipo,
    p_origen_id: origenId,
    p_descripcion: desc,
    p_referencia: referencia
  });

  if (error) {
    console.error(`[Earnings] Error RPC 'acreditar_ganancia':`, error);
    
    // FALLBACK: Si el RPC falla (ej. no existe aún la función), usamos el método manual anterior
    console.warn(`[Earnings] RPC falló. Iniciando fallback manual...`);
    
    const user = await findUserById(userId);
    if (!user) throw new Error(`Usuario ${userId} no encontrado para acreditar ganancias.`);

    const nuevoSaldo = Number((Number(user.saldo_principal) || 0) + amount).toFixed(2);

    // 1. Crear el movimiento contable (Solo si existe la tabla)
    try {
      const { error: moveError } = await trySupabase(() => supabase.from('movimientos_saldo').insert([{
        usuario_id: userId,
        tipo_movimiento: tipo,
        origen_id: origenId,
        monto: amount,
        saldo_anterior: user.saldo_principal,
        saldo_nuevo: nuevoSaldo,
        nivel_id_momento: user.nivel_id,
        descripcion: desc,
        referencia: referencia,
        fecha: boliviaTime.now().toISOString()
      }]));

      if (moveError) {
        if (moveError.message?.includes('not find the table') || moveError.message?.includes('does not exist')) {
          console.error(`[Earnings] CRÍTICO: La tabla 'movimientos_saldo' no existe. Acreditando solo en caché.`);
        } else {
          throw new Error(`Fallo en registro contable (fallback): ${moveError.message}`);
        }
      }
    } catch (e) {
      console.error(`[Earnings] No se pudo registrar movimiento contable, pero seguiremos con la actualización del saldo:`, e.message);
    }

    // 2. Actualizar el caché en la tabla usuarios (Este paso es el que hace que el saldo suba)
    const updates = {
      saldo_principal: nuevoSaldo,
      ganancias_totales: Number((Number(user.ganancias_totales) || 0) + amount).toFixed(2),
      ganancias_hoy: Number((Number(user.ganancias_hoy) || 0) + amount).toFixed(2),
      ganancias_semana: Number((Number(user.ganancias_semana) || 0) + amount).toFixed(2),
      ganancias_mes: Number((Number(user.ganancias_mes) || 0) + amount).toFixed(2)
    };

    // Solo actualizar tareas_completadas si la columna existe (algunos esquemas usan tareas_completadas_hoy o similar)
    if (user.hasOwnProperty('tareas_completadas_exito')) {
      updates.tareas_completadas_exito = tipo === 'ganancia_tarea' ? (user.tareas_completadas_exito || 0) + 1 : user.tareas_completadas_exito;
    } else if (user.hasOwnProperty('tareas_completadas')) {
      updates.tareas_completadas = tipo === 'ganancia_tarea' ? (user.tareas_completadas || 0) + 1 : user.tareas_completadas;
    }

    try {
      const { error: updateError } = await supabase.from('usuarios').update(updates).eq('id', userId);
      if (updateError) {
        console.error(`[Earnings] Fallback: Error al actualizar tabla usuarios:`, updateError);
        throw new Error(`Fallo en actualización de saldo (fallback): ${updateError.message}`);
      }
    } catch (dbErr) {
      if (dbErr.message?.includes('column') && dbErr.message?.includes('does not exist')) {
        console.warn(`[Earnings] Columna de conteo falló. Reintentando actualización básica de saldo...`);
        const basicUpdates = {
          saldo_principal: nuevoSaldo,
          ganancias_totales: updates.ganancias_totales,
          ganancias_hoy: updates.ganancias_hoy
        };
        await supabase.from('usuarios').update(basicUpdates).eq('id', userId);
      } else {
        throw dbErr;
      }
    }
  } else if (data && !data.success) {
    console.error(`[Earnings] Error lógico en RPC:`, data.error);
    throw new Error(`Error de negocio en acreditación: ${data.error}`);
  }
  
  console.log(`[Earnings] SUCCESS: +${amount} acreditado correctamente.`);
}

/**
 * Reinicia las ganancias diarias y actualiza ayer/semana/mes
 * Esta función es llamada por un cron job a medianoche Bolivia
 */
export async function resetDailyEarnings() {
  console.log('[Cron] Iniciando mantenimiento diario (00:00 Bolivia)...');
  try {
    const users = await getUsers();
    
    // 1. APLICAR CASTIGOS POR CUESTIONARIO NO RESPONDIDO AYER
    const config = await getPublicContent();
    const todayStr = boliviaTime.todayStr();
    
    // Solo si el cuestionario estuvo activo ayer (o sigue activo hoy para la revisión)
    if (config.cuestionario_activo || config.cuestionario_data?.preguntas?.length > 0) {
      console.log('[Cron] Revisando respuestas del cuestionario...');
      
      // Obtener quiénes respondieron HOY (que en el momento de las 00:00 se refiere al día que acaba de terminar)
      // Nota: Si el cron corre exactamente a las 00:00, "todayStr" ya es el nuevo día.
      // Necesitamos revisar el día ANTERIOR.
      const yesterday = new Date(boliviaTime.now());
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = boliviaTime.getDateString(yesterday);
      
      const { data: responded } = await trySupabase(() => 
        supabase.from('respuestas_cuestionario').select('usuario_id').eq('fecha', yesterdayStr)
      );
      const respondedIds = new Set(responded?.map(r => r.usuario_id) || []);

      const tomorrow = new Date(boliviaTime.now());
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = boliviaTime.getDateString(tomorrow);

      for (const user of users) {
        if (user.rol === 'usuario' && !respondedIds.has(user.id)) {
          // Solo castigar si no tiene ya un castigo activo que cubra hoy
          if (!user.castigado_hasta || user.castigado_hasta < todayStr) {
            console.log(`[Cron] Aplicando castigo a: ${user.nombre_usuario} (No respondió el ${yesterdayStr})`);
            await updateUser(user.id, { castigado_hasta: todayStr }); // Castigado por todo el día de hoy
          }
        }
      }
    }

    // 2. RESET DE GANANCIAS DIARIAS (Lógica existente)
    for (const user of users) {
      const updates = {
        ganancias_ayer: Number(user.ganancias_hoy || 0).toFixed(2),
        ganancias_hoy: 0
      };
      await updateUser(user.id, updates);
    }
    console.log('[Cron] Mantenimiento diario completado.');
  } catch (err) {
    console.error('[Cron] Error en maintenance:', err);
  }
}

/**
 * CUESTIONARIOS Y CASTIGOS
 */

export async function checkUserQuestionnaire(userId) {
  const today = boliviaTime.todayStr();
  const { data } = await trySupabase(() => 
    supabase.from('respuestas_cuestionario')
      .select('id')
      .eq('usuario_id', userId)
      .eq('fecha', today)
      .maybeSingle()
  );
  return !!data;
}

export async function submitQuestionnaire(userId, respuestas = {}) {
  const now = boliviaTime.now();
  const today = boliviaTime.getDateString(now); // yyyy-MM-dd
  
  return await trySupabase(() => 
    supabase.from('respuestas_cuestionario').insert([{
      usuario_id: userId,
      fecha: today,
      respuestas: typeof respuestas === 'string' ? respuestas : JSON.stringify(respuestas),
      created_at: now.toISOString()
    }])
  );
}

export async function isUserPunished(userId) {
  const user = await findUserById(userId);
  if (!user || !user.castigado_hasta) return false;
  
  const today = boliviaTime.todayStr();
  return user.castigado_hasta >= today;
}

export async function getPunishedUsers() {
  const today = boliviaTime.todayStr();
  const { data } = await trySupabase(() => 
    supabase.from('usuarios')
      .select('id, nombre_usuario, telefono, castigado_hasta, nivel_id')
      .gte('castigado_hasta', today)
  );
  return data || [];
}

export async function unpunishUser(userId) {
  // Aseguramos que sea null real y no "null"
  return await updateUser(userId, { castigado_hasta: null });
}

export async function unpunishAllUsers() {
  const { error } = await supabase
    .from('usuarios')
    .update({ castigado_hasta: null })
    .not('castigado_hasta', 'is', null);
  
  if (error) throw error;
  return true;
}
