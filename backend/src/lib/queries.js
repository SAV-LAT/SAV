import { supabase, hasDb } from './db.js';
import { getStore } from '../data/store.js';
import { levels as seedLevels } from '../data/seed.js';

export async function trySupabase(operation) {
  if (!supabase || !hasDb()) {
    console.warn('[Supabase] No client configured, using memory fallback');
    return { data: null, error: new Error('No client'), fallback: true };
  }
  try {
    const { data, error } = await operation();
    if (error) {
      console.error('[Supabase Error Logged]:', JSON.stringify(error, null, 2));
      return { data: null, error, fallback: true };
    }
    return { data, error: null, fallback: false };
  } catch (err) {
    console.error('[Supabase Critical Logged]:', err);
    return { data: null, error: err, fallback: true };
  }
}

export async function getUsers() {
  const { data, error, fallback } = await trySupabase(() => supabase.from('usuarios').select('*'));
  if (fallback || error) throw new Error('No se pudo conectar con la base de datos de usuarios');
  return data || [];
}

export async function findUserByTelefono(telefono) {
  const { data, error, fallback } = await trySupabase(() => supabase.from('usuarios').select('*').eq('telefono', telefono).maybeSingle());
  if (fallback || error) throw new Error('Error al buscar usuario en la base de datos');
  return data;
}

export async function findUserById(id) {
  const { data, error, fallback } = await trySupabase(() => supabase.from('usuarios').select('*').eq('id', id).maybeSingle());
  if (fallback || error) throw new Error('Error al recuperar datos del usuario');
  return data;
}

export async function findUserByCodigo(codigo) {
  const { data, error, fallback } = await trySupabase(() => supabase.from('usuarios').select('*').eq('codigo_invitacion', codigo).maybeSingle());
  if (fallback || error) throw new Error('Error al validar código de invitación');
  return data;
}

export async function createUser(userData) {
  console.log(`[Queries] Intentando crear usuario: ${userData.nombre_usuario} (${userData.telefono})`);
  const { data, error, fallback } = await trySupabase(() => supabase.from('usuarios').insert([userData]).select().maybeSingle());
  
  if (fallback || error) {
    console.error('[Queries] Error crítico al insertar en Supabase:', error);
    throw new Error(`Error de base de datos (Persistencia Definitiva): ${error?.message || 'No se pudo conectar con la DB'}`);
  }
  
  console.log(`[Queries] Usuario creado exitosamente en Supabase: ${userData.nombre_usuario}`);
  return data;
}

export async function updateUser(id, updates) {
  // Verificamos si Supabase existe
  if (!supabase || !hasDb()) return null;

  try {
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
  const { data, fallback } = await trySupabase(() => supabase.from('niveles').select('*').order('orden', { ascending: true }));
  
  // Si tenemos datos de la DB, los mapeamos con el estado de bloqueo manual y eliminamos duplicados
  if (!fallback && data && data.length > 0) {
    const uniqueLevels = [];
    const codes = new Set();

    for (const dbLevel of data) {
      const code = String(dbLevel.codigo).toLowerCase();
      if (!codes.has(code)) {
        codes.add(code);
        const seedLevel = seedLevels.find(s => String(s.codigo).toLowerCase() === code);
        uniqueLevels.push({
          ...dbLevel,
          activo: seedLevel ? (seedLevel.activo !== false) : (dbLevel.activo !== false)
        });
      }
    }
    return uniqueLevels;
  }
  
  console.log('[Queries] getLevels fallback to seedLevels');
  return seedLevels;
}

export async function getRecargas() {
  const { data, error, fallback } = await trySupabase(() => supabase.from('recargas').select('*, usuario:usuarios!usuario_id(nombre_usuario)').order('created_at', { ascending: false }));
  if (fallback || error) throw new Error('No se pudo recuperar la lista de recargas');
  return data || [];
}

export async function getRecargaById(id) {
  const { data, error, fallback } = await trySupabase(() => supabase.from('recargas').select('*').eq('id', id).maybeSingle());
  if (fallback || error) throw new Error('No se pudo encontrar la recarga especificada');
  return data;
}

export async function getRetiros() {
  const { data, error, fallback } = await trySupabase(() => supabase.from('retiros').select('*, usuario:usuarios!usuario_id(nombre_usuario)').order('created_at', { ascending: false }));
  if (fallback || error) throw new Error('No se pudo recuperar la lista de retiros');
  return data || [];
}


export async function getMetodosQr() {
  const { data, error, fallback } = await trySupabase(() => supabase.from('metodos_qr').select('*').eq('activo', true).order('orden', { ascending: true }));
  if (fallback || error) throw new Error('No se pudo recuperar los métodos de pago QR');
  return data || [];
}

export async function getRecargasByUser(userId) {
  const { data, error, fallback } = await trySupabase(() => supabase.from('recargas').select('*').eq('usuario_id', userId).order('created_at', { ascending: false }));
  if (fallback || error) throw new Error('No se pudo recuperar el historial de recargas');
  return data || [];
}

export async function createRecarga(recargaData) {
  const { data, error, fallback } = await trySupabase(() => supabase.from('recargas').insert([recargaData]).select().maybeSingle());
  if (fallback || error) {
    console.error('[Queries] Error al crear recarga:', error);
    throw new Error('No se pudo crear la recarga de forma persistente');
  }
  return data;
}

export async function updateRecarga(id, updates) {
  const { data, error, fallback } = await trySupabase(() => supabase.from('recargas').update(updates).eq('id', id).select().maybeSingle());
  if (fallback || error) {
    console.error('[Queries] Error al actualizar recarga:', error);
    throw new Error('No se pudo actualizar la recarga en la base de datos');
  }
  return data;
}

export async function createRetiro(retiroData) {
  const { data, error, fallback } = await trySupabase(() => supabase.from('retiros').insert([retiroData]).select().maybeSingle());
  if (fallback || error) {
    console.error('[Queries] Error al crear retiro:', error);
    throw new Error('No se pudo crear el retiro de forma persistente');
  }
  return data;
}

export async function updateRetiro(id, updates) {
  const { data, error, fallback } = await trySupabase(() => supabase.from('retiros').update(updates).eq('id', id).select().maybeSingle());
  if (fallback || error) {
    console.error('[Queries] Error al actualizar retiro:', error);
    throw new Error('No se pudo actualizar el retiro en la base de datos');
  }
  return data;
}

export async function getRetirosByUser(userId) {
  const { data, error, fallback } = await trySupabase(() => supabase.from('retiros').select('*').eq('usuario_id', userId).order('created_at', { ascending: false }));
  if (fallback || error) throw new Error('No se pudo recuperar el historial de retiros');
  return data || [];
}

export async function getRetiroById(id) {
  const { data, error, fallback } = await trySupabase(() => supabase.from('retiros').select('*').eq('id', id).maybeSingle());
  if (fallback || error) throw new Error('No se pudo encontrar el retiro especificado');
  return data;
}

export async function getTarjetasByUser(userId) {
  const { data, error, fallback } = await trySupabase(() => supabase.from('tarjetas_bancarias').select('*').eq('usuario_id', userId));
  if (fallback || error) throw new Error('No se pudo recuperar las tarjetas bancarias');
  return data || [];
}

export async function createTarjeta(tarjetaData) {
  const { data, error, fallback } = await trySupabase(() => supabase.from('tarjetas_bancarias').insert([tarjetaData]).select().maybeSingle());
  if (fallback || error) {
    console.error('[Queries] Error al crear tarjeta:', error);
    throw new Error('No se pudo guardar la tarjeta bancaria de forma persistente');
  }
  return data;
}

export async function deleteTarjeta(id, userId) {
  const { error, fallback } = await trySupabase(() => supabase.from('tarjetas_bancarias').delete().eq('id', id).eq('usuario_id', userId));
  if (fallback || error) {
    console.error('[Queries] Error al eliminar tarjeta:', error);
    throw new Error('No se pudo eliminar la tarjeta de la base de datos');
  }
  return true;
}

export async function getPublicContent() {
  const { data, error, fallback } = await trySupabase(() => supabase.from('configuraciones').select('*'));
  if (fallback || error) throw new Error('No se pudo recuperar la configuración del sistema');
  return (data || []).reduce((acc, curr) => ({ ...acc, [curr.clave]: curr.valor }), {});
}

export async function getBanners() {
  const { data, fallback } = await trySupabase(() => supabase.from('banners_carrusel').select('*').eq('activo', true).order('orden', { ascending: true }));
  
  const defaultBanners = [
    { id: 'def-1', imagen_url: '/imag/carrusel1.jpeg', titulo: 'SAV 1', orden: 0, activo: true },
    { id: 'def-2', imagen_url: '/imag/carrusel2.jpeg', titulo: 'SAV 2', orden: 1, activo: true },
    { id: 'def-3', imagen_url: '/imag/carrusel3.jpeg', titulo: 'SAV 3', orden: 2, activo: true },
    { id: 'def-4', imagen_url: '/imag/carrusel4.jpeg', titulo: 'SAV 4', orden: 3, activo: true },
  ];

  if (!fallback && data && data.length > 0) {
    return data.map(b => ({
      ...b,
      imagen_url: b.imagen_url === '/imag/carusel1.jpeg' ? '/imag/carrusel1.jpeg' : b.imagen_url
    }));
  }
  return defaultBanners;
}

export async function getAllTasks() {
  const { data, error, fallback } = await trySupabase(() => supabase.from('tareas').select('*').order('created_at', { ascending: false }));
  if (fallback || error) throw new Error('No se pudo recuperar la lista de tareas');
  return data || [];
}

export async function getTasks(nivelId) {
  // Intentar obtener tareas de Supabase
  const { data, fallback } = await trySupabase(() => supabase.from('tareas').select('*').eq('nivel_id', nivelId).eq('activa', true));
  
  // Si tenemos datos de Supabase, los usamos
  if (!fallback && data && data.length > 0) return data;

  // Si Supabase falló o no tiene datos, usamos el store local (seed.js)
  const store = await getStore();
  const levels = await getLevels();
  const currentLevel = levels.find(l => String(l.id) === String(nivelId)) || 
                       levels.find(l => String(l.codigo) === 'pasante' && (nivelId === 'l1' || nivelId === 'pasante' || String(nivelId).length > 20));
  
  const localTasks = (store.tasks || []).filter(t => {
    if (String(t.nivel_id) === String(nivelId)) return true;
    
    if (currentLevel) {
      if (String(t.nivel_id) === String(currentLevel.id)) return true;
      const levelCode = String(currentLevel.codigo).toLowerCase();
      const taskLevelId = String(t.nivel_id).toLowerCase();
      
      if (levelCode === taskLevelId) return true;
      
      if ((levelCode === 'pasante' || levelCode === 'internar') && 
          (taskLevelId === 'pasante' || taskLevelId === 'l1' || taskLevelId === 'internar')) return true;
      
      if (levelCode.startsWith('s') && (taskLevelId === levelCode || taskLevelId === String(currentLevel.id).toLowerCase())) return true;
    }
    return false;
  });

  if (localTasks.length === 0) {
    const genericTasks = (store.tasks || []).filter(t => 
      t.nivel_id === 'pasante' || t.nivel_id === 'l1' || t.nivel_id === 'S1'
    );
    return genericTasks;
  }

  return localTasks;
}

export async function getPremiosRuleta() {
  try {
    const { data, error, fallback } = await trySupabase(() => supabase.from('premios_ruleta').select('*').order('orden', { ascending: true }));
    if (fallback || error) {
      console.warn('[Queries] No se pudo obtener premios_ruleta, devolviendo vacío:', error?.message);
      return [];
    }
    
    // Filtrar manualmente por activo para ser compatibles si la columna no existe o es NULL
    return (data || []).filter(p => p.activo !== false);
  } catch (err) {
    console.error('[Queries] Error crítico en getPremiosRuleta:', err);
    return [];
  }
}

export async function getSorteosGanadores() {
  const { data, error, fallback } = await trySupabase(() => supabase.from('sorteos_ganadores').select('*, usuario:usuarios(nombre_usuario, telefono)').order('created_at', { ascending: false }).limit(20));
  if (fallback || error) return [];
  return data || [];
}

export async function createSorteoGanador(ganador) {
  const { data, error } = await trySupabase(() => supabase.from('sorteos_ganadores').insert([ganador]).select().maybeSingle());
  if (error) throw error;
  return data;
}

export async function getTaskById(id) {
  console.log(`[Queries] Buscando tarea con ID: ${id}`);
  
  if (!id) throw new Error('ID de tarea no proporcionado');

  // Verificar si el ID es un UUID válido para evitar errores de sintaxis en PostgreSQL (Supabase)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  if (isUUID) {
    try {
      const { data, error, fallback } = await trySupabase(() => supabase.from('tareas').select('*').eq('id', id).maybeSingle());
      if (!fallback && !error && data) {
        console.log(`[Queries] Tarea encontrada en Supabase (UUID): ${id}`);
        return data;
      }
    } catch (e) {
      console.warn(`[Queries] Error al consultar Supabase para UUID ${id}:`, e.message);
    }
  }

  console.log(`[Queries] Buscando en almacenamiento local para ID: ${id}`);
  // Si no es UUID o no se encontró en Supabase, buscar en el store local
  try {
    const store = await getStore();
    const task = (store.tasks || []).find(t => String(t.id).toLowerCase() === String(id).toLowerCase());
    
    if (task) {
      console.log(`[Queries] Tarea encontrada en store local: ${id}`);
      return task;
    }
  } catch (e) {
    console.error(`[Queries] Error al consultar store local para ${id}:`, e.message);
  }
  
  console.error(`[Queries] Tarea TOTALMENTE NO ENCONTRADA: ${id}`);
  throw new Error(`La tarea con ID ${id} no existe en el sistema.`);
}

export async function getTaskActivity(userId) {
  const { data, error, fallback } = await trySupabase(() => supabase.from('actividad_tareas').select('*').eq('usuario_id', userId));
  
  if (fallback || error) {
    console.error(`[Queries] Error al obtener actividad de tareas para ${userId}:`, error);
    throw new Error('No se pudo recuperar la actividad de la base de datos');
  }
  
  return data || [];
}

export async function createTaskActivity(activity) {
  const { data, error, fallback } = await trySupabase(() => supabase.from('actividad_tareas').insert([activity]).select().maybeSingle());
  
  if (fallback || error) {
    console.error('[Queries] Error crítico al insertar actividad en Supabase:', error);
    throw new Error('No se pudo guardar la actividad de la tarea de forma persistente');
  }
  
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
export async function distributeCommissions(userId, baseAmount) {
  console.log(`[Comisiones] Iniciando distribución para usuario ${userId}, monto base: ${baseAmount}`);
  
  try {
    const user = await findUserById(userId);
    if (!user || !user.invitado_por) return;

    const levels = await getLevels();
    const userLevel = levels.find(l => l.id === user.nivel_id);
    const userRank = userLevel ? (userLevel.orden || 0) : 0;

    // Lógica de comisiones por niveles (A: 12%, B: 3%, C: 1%)
    const commissionConfigs = [
      { key: 'A', percent: 0.12 },
      { key: 'B', percent: 0.03 },
      { key: 'C', percent: 0.01 }
    ];

    let currentUplineId = user.invitado_por;
    for (const config of commissionConfigs) {
      if (!currentUplineId) break;
      const upline = await findUserById(currentUplineId);
      if (!upline) break;

      const uplineLevel = levels.find(l => l.id === upline.nivel_id);
      const uplineRank = uplineLevel ? (uplineLevel.orden || 0) : 0;

      // REGLA: El rango del invitador debe ser >= al del subordinado
      if (uplineRank >= userRank) {
        const commission = Number((baseAmount * config.percent).toFixed(2));
        if (commission > 0) {
          console.log(`[Comisiones] Red Nivel ${config.key}: Otorgando ${commission} BOB a ${upline.nombre_usuario} (Rango ${uplineRank} >= ${userRank})`);
          await updateUser(upline.id, {
            saldo_comisiones: (Number(upline.saldo_comisiones) || 0) + commission
          });
          
          // Registrar en estadísticas persistentes del invitador
          await addUserEarnings(upline.id, commission);
        }
      } else {
        console.log(`[Comisiones] Red Nivel ${config.key}: No se paga a ${upline.nombre_usuario} (Rango ${uplineRank} < Subordinado ${userRank})`);
      }
      
      currentUplineId = upline.invitado_por;
    }
  } catch (err) {
    console.error('[Comisiones] Error:', err);
  }
}

/**
 * Registra ganancias en las estadísticas persistentes del usuario
 */
export async function addUserEarnings(userId, amount) {
  if (!amount || amount <= 0) return;
  try {
    const user = await findUserById(userId);
    if (!user) return;

    const updates = {
      ganancias_hoy: Number((Number(user.ganancias_hoy) || 0) + amount).toFixed(2),
      ganancias_semana: Number((Number(user.ganancias_semana) || 0) + amount).toFixed(2),
      ganancias_mes: Number((Number(user.ganancias_mes) || 0) + amount).toFixed(2),
      ganancias_totales: Number((Number(user.ganancias_totales) || 0) + amount).toFixed(2)
    };

    await updateUser(userId, updates);
    console.log(`[Earnings] +${amount} registrado para ${user.nombre_usuario} (Hoy: ${updates.ganancias_hoy})`);
  } catch (err) {
    console.error('[Earnings] Error al registrar ganancias:', err);
  }
}

/**
 * Reinicia las ganancias diarias y actualiza ayer/semana/mes
 * Esta función debería ser llamada por un cron job a medianoche
 */
export async function resetDailyEarnings() {
  console.log('[Cron] Iniciando reset de ganancias diarias...');
  try {
    const users = await getUsers();
    for (const user of users) {
      const updates = {
        ganancias_ayer: user.ganancias_hoy || 0,
        ganancias_hoy: 0
      };
      
      // Aquí se podría añadir lógica para reset semanal/mensual si es necesario
      // Pero por ahora solo hoy -> ayer
      await updateUser(user.id, updates);
    }
    console.log('[Cron] Reset de ganancias completado.');
  } catch (err) {
    console.error('[Cron] Error en resetDailyEarnings:', err);
  }
}
