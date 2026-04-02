import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { 
  findUserById, getLevels, updateUser, getTaskActivity, getTarjetasByUser, 
  createTarjeta, deleteTarjeta, getUsers, trySupabase, getUserEarningsSummary,
  getPublicContent, checkUserQuestionnaire, submitQuestionnaire, isUserPunished
} from '../lib/queries.js';
import { authenticate } from '../middleware/auth.js';
import { getStore } from '../data/store.js';
import { supabase } from '../lib/db.js';
import logger from '../lib/logger.js';

const router = Router();

function sanitizeUser(u, levels) {
  const level = levels.find(l => String(l.id) === String(u.nivel_id));
  
  // Manejo ultra-seguro de tickets si la columna no existe en la DB
  const tickets = u.hasOwnProperty('tickets_ruleta') ? (Number(u.tickets_ruleta) || 0) : 0;

  return {
    id: u.id,
    telefono: u.telefono,
    nombre_usuario: u.nombre_usuario,
    nombre_real: u.nombre_real,
    codigo_invitacion: u.codigo_invitacion,
    nivel: level?.nombre || 'pasante',
    nivel_id: u.nivel_id,
    nivel_codigo: level?.codigo || 'internar',
    saldo_principal: u.saldo_principal || 0,
    saldo_comisiones: u.saldo_comisiones || 0,
    rol: u.rol,
    avatar_url: u.avatar_url,
    tipo_lider: u.tipo_lider,
    allow_weekend_tasks: u.allow_weekend_tasks,
    tickets_ruleta: tickets,
    tiene_password_fondo: !!u.password_fondo_hash,
    last_device_id: u.last_device_id,
  };
}

router.get('/me', authenticate, async (req, res) => {
  const userId = req.user.id;
  const startTime = Date.now();
  
  try {
    // Forzar que no se use cache para evitar problemas de 304 o net::ERR_ABORTED
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // REGLA: findUserById ya tiene caché de 10s en queries.js
    // getLevels ya tiene caché de 1 hora
    const [user, levels] = await Promise.all([
      findUserById(userId),
      getLevels()
    ]);

    if (!user) {
      logger.warn(`[Users] Usuario con ID ${userId} no encontrado.`);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    if (Date.now() - startTime > 2000) {
      logger.info(`[Users] /me tardó ${Date.now() - startTime}ms para ${user.nombre_usuario}`);
    }
    
    res.json(sanitizeUser(user, levels));
  } catch (err) {
    logger.error(`[Users] Error en /me [${Date.now() - startTime}ms]:`, err);
    res.status(500).json({ error: 'Error al recuperar perfil' });
  }
});

router.put('/me', authenticate, async (req, res) => {
  try {
    const { nombre_real } = req.body;
    const updates = {};
    if (nombre_real !== undefined) updates.nombre_real = nombre_real;
    
    const user = await updateUser(req.user.id, updates);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const levels = await getLevels();
    res.json(sanitizeUser(user, levels));
  } catch (err) {
    logger.error('[Users] Error en PUT /me:', err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { password_actual, password_nueva } = req.body;
    if (!password_actual || !password_nueva) {
      return res.status(400).json({ error: 'Indica la contraseña actual y la nueva' });
    }
    if (String(password_nueva).length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const ok = await bcrypt.compare(password_actual, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    
    const password_hash = await bcrypt.hash(password_nueva, 10);
    await updateUser(user.id, { password_hash });
    res.json({ ok: true });
  } catch (err) {
    logger.error('[Users] Error en change-password:', err);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

router.post('/change-fund-password', authenticate, async (req, res) => {
  try {
    const { password_actual, password_nueva } = req.body;
    if (!password_nueva || String(password_nueva).length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña del fondo debe tener al menos 6 caracteres' });
    }
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.password_fondo_hash) {
      if (!password_actual) {
        return res.status(400).json({ error: 'Debes indicar la contraseña actual del fondo' });
      }
      const ok = await bcrypt.compare(password_actual, user.password_fondo_hash);
      if (!ok) return res.status(400).json({ error: 'Contraseña del fondo incorrecta' });
    }
    
    const password_fondo_hash = await bcrypt.hash(password_nueva, 10);
    await updateUser(user.id, { password_fondo_hash });
    res.json({ ok: true });
  } catch (err) {
    logger.error('[Users] Error en change-fund-password:', err);
    res.status(500).json({ error: 'Error al cambiar contraseña de fondo' });
  }
});

router.get('/stats', authenticate, async (req, res) => {
  const userId = req.user.id;
  const startTime = Date.now();
  
  try {
    // findUserById usa deduplicación y caché de 10s (Rápido)
    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // getUserEarningsSummary usa caché de 10s e interno utiliza el objeto user ya obtenido
    const summary = await getUserEarningsSummary(userId, user);
    
    if (!summary) {
      return res.status(500).json({ error: 'No se pudo obtener estadísticas. Intente de nuevo.' });
    }
    
    const duration = Date.now() - startTime;
    if (duration > 1500) {
      logger.info(`[Stats] /stats tardó ${duration}ms para ${user.nombre_usuario}`);
    }
    
    res.json({
      ingresos_ayer: summary.ayer,
      ingresos_hoy: summary.hoy,
      ingresos_semana: summary.semana,
      ingresos_mes: summary.mes,
      ingresos_totales: summary.total,
      comision_subordinados: summary.saldo_comisiones,
      recompensa_invitacion: 0,
      total_completadas: summary.tareas_completadas,
      saldo_principal: summary.saldo_principal,
      saldo_comisiones: summary.saldo_comisiones,
      pasante_limit_reached: false,
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    const isTimeout = err.message?.includes('Timeout');
    logger.error(`[Stats] Error ${isTimeout ? 'Timeout' : 'Crítico'} [${duration}ms]:`, err.message || err);
    
    res.status(isTimeout ? 504 : 500).json({ 
      error: isTimeout ? 'La base de datos está lenta. Reintente en unos segundos.' : 'Error al calcular estadísticas' 
    });
  }
});

router.get('/earnings', authenticate, async (req, res) => {
  try {
    const summary = await getUserEarningsSummary(req.user.id);
    
    // Obtener historial de movimientos
    let movimientos = [];
    try {
      const { data, error } = await trySupabase(() => 
        supabase.from('movimientos_saldo')
          .select('*')
          .eq('usuario_id', req.user.id)
          .order('fecha', { ascending: false })
          .limit(50)
      );
      if (error) {
        logger.warn('[Earnings] Error al consultar movimientos_saldo:', error.message);
      } else {
        movimientos = data || [];
      }
    } catch (e) {
      logger.warn('[Earnings] La tabla movimientos_saldo no es accesible aún.');
    }
    
    res.json({
      summary: summary || {
        hoy: 0, ayer: 0, semana: 0, mes: 0, total: 0,
        saldo_principal: 0,
        saldo_comisiones: 0,
        tareas_completadas: 0
      },
      history: movimientos
    });
  } catch (err) {
    logger.error('[Earnings] Error:', err);
    res.status(500).json({ error: 'Error al obtener historial de ganancias' });
  }
});

router.get('/tarjetas', authenticate, async (req, res) => {
  try {
    const tarjetas = await getTarjetasByUser(req.user.id);
    res.json(tarjetas);
  } catch (err) {
    logger.error('[Users] Error en /tarjetas:', err);
    res.status(500).json({ error: 'Error al recuperar tarjetas' });
  }
});

router.post('/tarjetas', authenticate, async (req, res) => {
  try {
    const { nombre_banco, tipo, numero_cuenta } = req.body;
    const nombre = String(nombre_banco || '').trim();
    if (!nombre || numero_cuenta === undefined || numero_cuenta === '') {
      return res.status(400).json({ error: 'Indica el nombre del propietario y el número de cuenta' });
    }
    
    const tarjeta = {
      id: uuidv4(),
      usuario_id: req.user.id,
      tipo: String(tipo || 'banco').trim() || 'banco',
      nombre_banco: nombre,
      numero_masked: String(numero_cuenta).trim(),
    };
    
    const nuevaTarjeta = await createTarjeta(tarjeta);
    res.json(nuevaTarjeta);
  } catch (err) {
    logger.error('[Users] Error en POST /tarjetas:', err);
    res.status(500).json({ error: 'Error al guardar la tarjeta' });
  }
});

router.delete('/tarjetas/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTarjeta(id, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    logger.error('[Users] Error en DELETE /tarjetas:', err);
    res.status(500).json({ error: 'Error al eliminar la tarjeta' });
  }
});

router.get('/notificaciones', authenticate, async (req, res) => {
  try {
    const { data, error } = await trySupabase(() => 
      supabase.from('notificaciones')
        .select('*')
        .eq('usuario_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(20)
    );
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    logger.error('[Users] Error en /notificaciones:', err);
    res.status(500).json({ error: 'Error al recuperar notificaciones' });
  }
});

router.put('/notificaciones/:id/read', authenticate, async (req, res) => {
  try {
    const { error } = await trySupabase(() => 
      supabase.from('notificaciones')
        .update({ leida: true })
        .eq('id', req.params.id)
        .eq('usuario_id', req.user.id)
    );
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    logger.error('[Users] Error en /notificaciones/read:', err);
    res.status(500).json({ error: 'Error al marcar como leída' });
  }
});

const teamCache = new Map();
const TEAM_CACHE_TTL = 60000; // 1 minuto de caché para el equipo

router.get('/team', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = Date.now();
    const cached = teamCache.get(userId);
    
    if (cached && (now - cached.timestamp < TEAM_CACHE_TTL)) {
      return res.json(cached.data);
    }

    const root = await findUserById(userId);
    if (!root) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Consultar todos los usuarios directamente de Supabase/Persistencia
    const allUsers = await getUsers();
    
    const byInviter = new Map();
    for (const u of allUsers.filter(u => u.rol === 'usuario')) {
      if (!byInviter.has(u.invitado_por || 'root')) byInviter.set(u.invitado_por || 'root', []);
      byInviter.get(u.invitado_por || 'root').push(u);
    }

    const buildNode = (user, depth = 0) => {
      const children = (byInviter.get(user.id) || []).map((c) => buildNode(c, depth + 1));
      return {
        id: user.id,
        nombre: user.nombre_usuario,
        codigo_invitacion: user.codigo_invitacion,
        telefono: user.telefono,
        nivel_id: user.nivel_id,
        nivel_red: depth === 0 ? 'TU' : depth === 1 ? 'A' : depth === 2 ? 'B' : 'C',
        porcentaje_comision: depth === 1 ? 12 : depth === 2 ? 3 : depth >= 3 ? 1 : 0,
        saldo_principal: user.saldo_principal || 0,
        children,
      };
    };

    const tree = buildNode(root, 0);

    const descendants = [];
    const walk = (node, depth = 0) => {
      if (depth > 0) descendants.push(node);
      node.children.forEach((c) => walk(c, depth + 1));
    };
    walk(tree);

    const group = (level) => descendants.filter((n) => n.nivel_red === level);
    const groupStats = (level) => {
      const arr = group(level);
      return {
        nivel: level,
        total_miembros: arr.length,
        monto_recarga: arr.reduce((s, x) => s + (x.saldo_principal || 0), 0),
        porcentaje: level === 'A' ? 12 : level === 'B' ? 3 : 1,
      };
    };

    const totalIngresos = descendants.reduce((s, d) => s + (d.saldo_principal || 0), 0);
    const hoyIngresos = descendants.slice(0, 2).reduce((s, d) => s + (d.saldo_principal || 0), 0);

    const responseData = {
      resumen: {
        ingresos_totales: totalIngresos,
        ingresos_hoy: hoyIngresos,
        total_miembros: descendants.length,
        nuevos_miembros: group('A').length,
      },
      analisis: {
        tarea: Number((totalIngresos * 0.25).toFixed(2)),
        invitacion: Number((totalIngresos * 0.65).toFixed(2)),
        inversion: Number((totalIngresos * 0.1).toFixed(2)),
      },
      niveles: [groupStats('A'), groupStats('B'), groupStats('C')],
      tree,
    };

    teamCache.set(userId, { data: responseData, timestamp: now });
    res.json(responseData);
  } catch (err) {
    logger.error('[Users] Error en /team:', err);
    res.status(500).json({ error: 'Error al calcular equipo' });
  }
});

router.get('/cuestionario', authenticate, async (req, res) => {
  try {
    const config = await getPublicContent();
    if (!config.cuestionario_activo) return res.json({ activo: false });
    
    // Control de Horario
    const now = boliviaTime.now();
    const curTime = boliviaTime.getTimeString(now);
    const cData = config.cuestionario_data || {};
    const startTime = cData.hora_inicio || '00:00';
    const endTime = cData.hora_fin || '23:59';
    
    const enHorario = boliviaTime.isTimeInWindow(curTime, startTime, endTime);
    if (!enHorario) {
      return res.json({ 
        activo: true, 
        expirado: true,
        mensaje: 'El cuestionario ha finalizado por hoy' 
      });
    }

    const yaRespondio = await checkUserQuestionnaire(req.user.id);
    res.json({
      activo: true,
      expirado: false,
      ya_respondio: yaRespondio,
      datos: cData // JSON con preguntas/opciones
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cuestionario/responder', authenticate, async (req, res) => {
  try {
    const config = await getPublicContent();
    if (!config.cuestionario_activo) return res.status(400).json({ error: 'No hay cuestionario activo' });
    
    // Control de Horario en el backend (Seguridad)
    const now = boliviaTime.now();
    const curTime = boliviaTime.getTimeString(now);
    const cData = config.cuestionario_data || {};
    const startTime = cData.hora_inicio || '00:00';
    const endTime = cData.hora_fin || '23:59';
    
    if (!boliviaTime.isTimeInWindow(curTime, startTime, endTime)) {
      return res.status(403).json({ error: 'El horario para responder ha finalizado (23:59)' });
    }

    const yaRespondio = await checkUserQuestionnaire(req.user.id);
    
    // VALIDACIÓN BACKEND: Formato y completitud de respuestas
    const preguntas = config.cuestionario_data?.preguntas || [];
    if (preguntas.length > 0) {
      if (!respuestas || typeof respuestas !== 'object' || Array.isArray(respuestas)) {
        return res.status(400).json({ error: 'Formato de respuestas inválido. Se espera un objeto.' });
      }
      
      const idsRespondidos = Object.keys(respuestas);
      const faltantes = preguntas.filter(p => !idsRespondidos.includes(String(p.id)) || respuestas[p.id] === undefined || respuestas[p.id] === null);

      if (faltantes.length > 0) {
        return res.status(400).json({ error: `Debes responder todas las preguntas (${preguntas.length}). Faltan: ${faltantes.length}` });
      }
    } else {
      return res.status(400).json({ error: 'El cuestionario actual no tiene preguntas configuradas.' });
    }

    await submitQuestionnaire(req.user.id, respuestas);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status-castigo', authenticate, async (req, res) => {
  try {
    const castigado = await isUserPunished(req.user.id);
    res.json({ castigado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
