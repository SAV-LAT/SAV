import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { 
  getUsers, getRecargas, getRetiros, getLevels, findUserById, updateUser, 
  getPublicContent, getMetodosQr, getAllMetodosQr, getBanners, getAllTasks, getRecargaById, 
  updateRecarga, getRetiroById, updateRetiro, trySupabase, handleLevelUpRewards,
  getUserEarningsSummary, createMovimiento, boliviaTime, getPunishedUsers, unpunishUser,
  unpunishAllUsers, distributeInvestmentCommissions, refreshPublicContent
} from '../lib/queries.js';
import { getStore } from '../data/store.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { supabase } from '../lib/db.js';
import { mergePublicContent } from '../data/publicContentDefaults.js';
import logger from '../lib/logger.js';

const router = Router();
router.use(authenticate);
router.use(requireAdmin);

function sanitizeUser(u, levels) {
  const level = levels.find(l => l.id === u.nivel_id);
  return {
    id: u.id,
    telefono: u.telefono,
    nombre_usuario: u.nombre_usuario,
    nombre_real: u.nombre_real,
    codigo_invitacion: u.codigo_invitacion,
    nivel: level?.nombre,
    nivel_id: u.nivel_id,
    nivel_codigo: level?.codigo,
    saldo_principal: u.saldo_principal,
    saldo_comisiones: u.saldo_comisiones,
    rol: u.rol,
    bloqueado: u.bloqueado,
    tipo_lider: u.tipo_lider,
    allow_weekend_tasks: u.allow_weekend_tasks,
    tickets_ruleta: Number(u.tickets_ruleta) || 0,
    created_at: u.created_at,
  };
}

router.get('/dashboard', async (req, res) => {
  const users = await getUsers();
  const recargas = await getRecargas();
  const retiros = await getRetiros();
  
  const totalUsuarios = users.filter(u => u.rol === 'usuario').length;
  const totalRecargas = recargas.reduce((s, r) => s + (r.monto || 0), 0);
  const totalRetiros = retiros.reduce((s, r) => s + (r.monto || 0), 0);
  const pendientesRetiro = retiros.filter(r => r.estado === 'pendiente').length;
  const pendientesRecarga = recargas.filter(r => r.estado === 'pendiente').length;
  
  res.json({
    total_usuarios: totalUsuarios,
    total_recargas: totalRecargas,
    total_retiros: totalRetiros,
    pendientes_retiro: pendientesRetiro,
    pendientes_recarga: pendientesRecarga,
  });
});

router.get('/usuarios', async (req, res) => {
  const users = await getUsers();
  const levels = await getLevels();
  const filtered = users.map(u => sanitizeUser(u, levels));
  res.json(filtered);
});

router.get('/ranking-invitados', async (req, res) => {
  try {
    const users = await getUsers();
    const levels = await getLevels();
    
    // Mapeo de niveles para acceso rápido
    const levelMap = {};
    levels.forEach(l => {
      levelMap[l.id] = l;
    });

    // Helper para verificar si un usuario es "invitado válido" (no pasante)
    const isValidGuest = (user) => {
      if (!user) return false;
      const level = levelMap[user.nivel_id];
      const code = String(level?.codigo || '').toLowerCase();
      return code !== 'pasante' && code !== 'internar' && code !== '';
    };

    // Construir mapa de red por usuario (solo nivel A, B, C)
    const network = {}; // userId -> { A: [], B: [], C: [] }
    
    // Nivel A: Directos
    users.forEach(u => {
      if (u.invitado_por) {
        if (!network[u.invitado_por]) network[u.invitado_por] = { A: [], B: [], C: [] };
        network[u.invitado_por].A.push(u);
      }
    });

    // Nivel B: Invitados de A
    Object.keys(network).forEach(uId => {
      network[uId].A.forEach(directo => {
        if (network[directo.id]) {
          network[uId].B.push(...network[directo.id].A);
        }
      });
    });

    // Nivel C: Invitados de B
    Object.keys(network).forEach(uId => {
      network[uId].B.forEach(indirecto => {
        if (network[indirecto.id]) {
          network[uId].C.push(...network[indirecto.id].A);
        }
      });
    });

    const ranking = users
      .filter(u => u.rol === 'usuario')
      .map(u => {
        const userNet = network[u.id] || { A: [], B: [], C: [] };
        
        // Filtrar solo invitados válidos (inversión/ascenso real)
        const validA = userNet.A.filter(isValidGuest);
        const validB = userNet.B.filter(isValidGuest);
        const validC = userNet.C.filter(isValidGuest);

        // Agrupar por nivel VIP (S1, S2, S3, S4, S5, etc.)
        const statsByLevel = {}; // "S1": { A: 0, B: 0, C: 0, total: 0 }
        
        const countByDepth = (list, depthKey) => {
          list.forEach(guest => {
            const guestLevel = levelMap[guest.nivel_id];
            const code = String(guestLevel?.codigo || 'S1').toUpperCase();
            if (!statsByLevel[code]) statsByLevel[code] = { A: 0, B: 0, C: 0, total: 0 };
            statsByLevel[code][depthKey]++;
            statsByLevel[code].total++;
          });
        };

        countByDepth(validA, 'A');
        countByDepth(validB, 'B');
        countByDepth(validC, 'C');

        const totalInvitadosValidos = validA.length + validB.length + validC.length;

        return {
          ...sanitizeUser(u, levels),
          invitados_count: totalInvitadosValidos, // Ranking basado en el total de la red válida
          network_stats: {
            A: validA.length,
            B: validB.length,
            C: validC.length
          },
          level_stats: statsByLevel
        };
      })
      .filter(u => u.invitados_count > 0) // Solo mostrar quienes tienen red válida
      .sort((a, b) => {
        if (b.invitados_count !== a.invitados_count) {
          return b.invitados_count - a.invitados_count;
        }
        return new Date(a.created_at) - new Date(b.created_at);
      })
      .slice(0, 70);

    res.json(ranking);
  } catch (err) {
    logger.error('[Ranking Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/usuarios/:id/password', async (req, res) => {
  const { id } = req.params;
  const { password, password_fondo } = req.body;
  const updates = {};
  
  if (password) {
    updates.password_hash = await bcrypt.hash(password, 10);
  }
  if (password_fondo) {
    updates.password_fondo_hash = await bcrypt.hash(password_fondo, 10);
  }
  
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nada que actualizar' });
  
  await updateUser(id, updates);
  res.json({ ok: true });
});

router.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  await updateUser(id, updates);
  res.json({ ok: true });
});

router.get('/usuarios/:id/earnings', async (req, res) => {
  const { id } = req.params;
  try {
    const summary = await getUserEarningsSummary(id);
    const { data: movimientos } = await trySupabase(() => 
      supabase.from('movimientos_saldo')
        .select('*')
        .eq('usuario_id', id)
        .order('fecha', { ascending: false })
        .limit(100)
    );
    res.json({ summary, history: movimientos || [] });
  } catch (err) {
    logger.error('[Admin Earnings Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/usuarios/:id/ajuste', async (req, res) => {
  const { id } = req.params;
  const { monto, descripcion, tipo_billetera } = req.body;
  
  try {
    if (!monto || isNaN(Number(monto))) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    const user = await findUserById(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    const field = tipo_billetera === 'comisiones' ? 'saldo_comisiones' : 'saldo_principal';
    const nuevoSaldo = Number((Number(user[field]) || 0) + Number(monto));
    
    await updateUser(id, { [field]: nuevoSaldo.toFixed(2) });
    
    try {
      await createMovimiento({
        usuario_id: id,
        tipo_movimiento: 'ajuste_admin',
        monto: Number(monto),
        saldo_anterior: Number(user[field]),
        saldo_nuevo: nuevoSaldo,
        descripcion: descripcion || 'Ajuste administrativo manual',
        referencia: `ADJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        fecha: new Date().toISOString()
      });
    } catch (movErr) {
      logger.error('[Admin Adjustment] Error creando movimiento:', movErr.message);
      // El error del movimiento no debe bloquear la respuesta exitosa del ajuste de saldo
    }
    
    res.json({ ok: true, nuevo_saldo: nuevoSaldo.toFixed(2) });
  } catch (err) {
    logger.error('[Admin Adjustment] Error crítico:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/recargas', async (req, res) => {
  const recargas = await getRecargas();
  res.json(recargas);
});

router.post('/recargas/:id/aprobar', async (req, res) => {
  const { id } = req.params;
  
  const recarga = await getRecargaById(id);
  if (!recarga) {
    return res.status(404).json({ error: 'Recarga no encontrada en el sistema' });
  }
  
  if (recarga.estado === 'aprobada') return res.status(400).json({ error: 'Esta recarga ya fue aprobada previamente' });

  const user = await findUserById(recarga.usuario_id);
  const { data: niveles } = await trySupabase(() => supabase.from('niveles').select('*'));
  const nivelDestino = niveles.find(n => (n.deposito || n.costo) === recarga.monto);
  const nivelActual = niveles.find(n => n.id === user.nivel_id);

  if (nivelDestino) {
    const oldLevelId = user.nivel_id;
    const updates = { nivel_id: nivelDestino.id };
    
    // Si ya tenía un nivel con costo/deposito, devolvemos ese saldo a comisiones
    if (nivelActual && (Number(nivelActual.deposito) > 0 || Number(nivelActual.costo) > 0)) {
      const montoADevolver = Number(nivelActual.deposito) || Number(nivelActual.costo);
      updates.saldo_comisiones = (Number(user.saldo_comisiones) || 0) + montoADevolver;
    }
    
    await updateUser(user.id, updates);
    await updateRecarga(id, { estado: 'aprobada', procesado_at: new Date().toISOString() });
    
    // Procesar recompensas por ascenso
    await handleLevelUpRewards(user.id, oldLevelId, nivelDestino.id);

    // Distribuir comisiones por inversión (Ascenso)
    await distributeInvestmentCommissions(user.id, recarga.monto);
  } else {
    // Fallback anterior
    await updateUser(user.id, { saldo_principal: (user.saldo_principal || 0) + recarga.monto });
    await updateRecarga(id, { estado: 'aprobada' });

    // Distribuir comisiones por inversión (Recarga de Saldo)
    await distributeInvestmentCommissions(user.id, recarga.monto);
  }

  res.json({ ok: true });
});

router.post('/recargas/:id/rechazar', async (req, res) => {
  const { id } = req.params;
  const updates = {
    estado: 'rechazada',
    procesado_at: new Date().toISOString(),
    admin_notas: req.body.motivo || ''
  };

  if (req.user && req.user.id) {
    const adminExists = await findUserById(req.user.id);
    if (adminExists) updates.procesado_por = req.user.id;
  }

  await updateRecarga(id, updates);
  res.json({ ok: true });
});

router.get('/retiros', async (req, res) => {
  const retiros = await getRetiros();
  res.json(retiros);
});

router.post('/retiros/:id/aprobar', async (req, res) => {
  const { id } = req.params;
  const updates = {
    estado: 'aprobado',
    procesado_at: new Date().toISOString()
  };

  if (req.user && req.user.id) {
    const adminExists = await findUserById(req.user.id);
    if (adminExists) updates.procesado_por = req.user.id;
  }

  await updateRetiro(id, updates);
  res.json({ ok: true });
});

router.post('/retiros/:id/rechazar', async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;
  
  try {
    const retiro = await getRetiroById(id);
    if (!retiro) return res.status(404).json({ error: 'Retiro no encontrado en el sistema' });

    // VALIDACIÓN DE ESTADO: Evitar reembolsos dobles
    if (retiro.estado === 'rechazado') {
      return res.status(400).json({ error: 'Este retiro ya fue rechazado previamente' });
    }

    const updates = {
      estado: 'rechazado',
      procesado_at: new Date().toISOString(),
      admin_notas: motivo || ''
    };

    if (req.user && req.user.id) {
      const adminExists = await findUserById(req.user.id);
      if (adminExists) updates.procesado_por = req.user.id;
    }
    
    // Primero marcamos como rechazado para bloquear otras peticiones
    await updateRetiro(id, updates);
    
    const user = await findUserById(retiro.usuario_id);
    if (user) {
      const balanceField = retiro.tipo_billetera === 'comisiones' ? 'saldo_comisiones' : 'saldo_principal';
      const nuevoSaldo = Number((Number(user[balanceField] || 0) + Number(retiro.monto)).toFixed(2));
      
      await updateUser(user.id, {
        [balanceField]: nuevoSaldo
      });

      // Crear movimiento de auditoría
      await createMovimiento({
        usuario_id: user.id,
        tipo_movimiento: 'ajuste_admin',
        monto: Number(retiro.monto),
        saldo_anterior: Number(user[balanceField]),
        saldo_nuevo: Number(nuevoSaldo),
        descripcion: `Reembolso por retiro rechazado (Panel Web - ${id.substring(0,8)})`,
        referencia: `REJ-WEB-${id.substring(0,8)}`,
        fecha: new Date().toISOString()
      });
    }
    
    res.json({ ok: true });
  } catch (err) {
    logger.error('[Admin Reject Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/tareas', async (req, res) => {
  const data = await getAllTasks();
  res.json(data);
});

router.post('/tareas', async (req, res) => {
  const { nombre, nivel_id, video_url, respuesta_correcta, opciones, recompensa } = req.body;
  const tarea = {
    id: uuidv4(),
    nombre,
    nivel_id,
    video_url,
    respuesta_correcta,
    opciones: Array.isArray(opciones) ? opciones : [],
    recompensa: parseFloat(recompensa) || 0,
    activa: true,
    created_at: new Date().toISOString()
  };
  
  const { data, error } = await trySupabase(() => supabase.from('tareas').insert([tarea]).select().maybeSingle());
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/tareas/:id', async (req, res) => {
  const { nombre, nivel_id, video_url, respuesta_correcta, opciones, recompensa, activa } = req.body;
  const updates = {};
  if (nombre !== undefined) updates.nombre = nombre;
  if (nivel_id !== undefined) updates.nivel_id = nivel_id;
  if (video_url !== undefined) updates.video_url = video_url;
  if (respuesta_correcta !== undefined) updates.respuesta_correcta = respuesta_correcta;
  if (opciones !== undefined) updates.opciones = Array.isArray(opciones) ? opciones : [];
  if (recompensa !== undefined) updates.recompensa = parseFloat(recompensa) || 0;
  if (activa !== undefined) updates.activa = activa;

  const { data, error } = await trySupabase(() => supabase.from('tareas').update(updates).eq('id', req.params.id).select().maybeSingle());
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/tareas/:id', async (req, res) => {
  const { error } = await trySupabase(() => supabase.from('tareas').delete().eq('id', req.params.id));
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});


router.get('/metodos-qr', async (req, res) => {
  try {
    const metodos = await getMetodosQr();
    res.json(metodos);
  } catch (err) {
    logger.error('[Admin] Error en get /metodos-qr:', err.message);
    res.status(500).json({ error: 'Error al obtener métodos QR' });
  }
});

router.get('/metodos-qr-all', async (req, res) => {
  try {
    const metodos = await getAllMetodosQr();
    res.json(metodos);
  } catch (err) {
    logger.error('[Admin] Error en get /metodos-qr-all:', err.message);
    res.status(500).json({ error: 'Error al obtener todos los métodos QR' });
  }
});

router.post('/metodos-qr', async (req, res) => {
  try {
    const { nombre_titular, imagen_base64, admin_id } = req.body;
    
    const metodo = {
      id: uuidv4(),
      nombre_titular: nombre_titular || 'Nuevo método',
      imagen_qr_url: imagen_base64 || '',
      activo: true,
      admin_id: admin_id || null,
      seleccionada: false,
      orden: 0,
      created_at: new Date().toISOString()
    };

    const { data, error } = await trySupabase(() => 
      supabase.from('metodos_qr').insert([metodo]).select().maybeSingle()
    );
    
    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  } catch (err) {
    logger.error('[Admin] Error en post /metodos-qr:', err.message);
    res.status(500).json({ error: 'Error al crear método QR' });
  }
});

router.delete('/metodos-qr/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await trySupabase(() => supabase.from('metodos_qr').delete().eq('id', id));
  if (error) return res.status(500).json({ error: error.message });

  // Lógica de Turno Dinámico: El admin que elimina un QR también toma el turno
  try {
    const { findAdminByUserId, setActiveAdminForRecharges } = await import('../lib/queries.js');
    const admin = await findAdminByUserId(req.user.id);
    if (admin) {
      await setActiveAdminForRecharges(admin.id);
      logger.info(`[Admin] Turno dinámico activado para: ${admin.nombre} por eliminar QR`);
    }
  } catch (e) {
    logger.error('[Admin] Error activando turno dinámico:', e.message);
  }

  res.json({ ok: true });
});

router.put('/metodos-qr/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Si se está marcando como seleccionada, desmarcar las otras del mismo admin
  if (updates.seleccionada) {
    const { data: current } = await trySupabase(() => supabase.from('metodos_qr').select('admin_id').eq('id', id).maybeSingle());
    if (current?.admin_id) {
      await trySupabase(() => 
        supabase.from('metodos_qr')
          .update({ seleccionada: false })
          .eq('admin_id', current.admin_id)
      );
    }
  }

  const { data, error } = await trySupabase(() => 
    supabase.from('metodos_qr').update(updates).eq('id', id).select().maybeSingle()
  );
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/admins', async (req, res) => {
  const { data } = await trySupabase(() => supabase.from('admins').select('*').order('nombre', { ascending: true }));
  res.json(data || []);
});

router.get('/banners', async (req, res) => {
  const banners = await getBanners();
  res.json(banners);
});

router.post('/banners', async (req, res) => {
  const { imagen_url, imagen_base64, orden } = req.body;
  const banner = {
    id: uuidv4(),
    imagen_url: imagen_base64 || imagen_url || '',
    orden: parseInt(orden) || 0,
    activo: true,
    created_at: new Date().toISOString()
  };

  const { data, error } = await trySupabase(() => 
    supabase.from('banners_carrusel').insert([banner]).select().maybeSingle()
  );
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/banners/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await trySupabase(() => supabase.from('banners_carrusel').delete().eq('id', id));
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

router.get('/premios-ruleta', async (req, res) => {
  const { data } = await trySupabase(() => supabase.from('premios_ruleta').select('*').order('orden', { ascending: true }));
  res.json(data || []);
});

router.post('/premios-ruleta', async (req, res) => {
  const { nombre, valor, probabilidad, color, activo, orden } = req.body;
  const premio = {
    id: uuidv4(),
    nombre: nombre || 'Nuevo Premio',
    valor: parseFloat(valor) || 0,
    probabilidad: parseFloat(probabilidad) || 0,
    color: color || '#1a1f36',
    activo: activo !== undefined ? activo : true,
    orden: parseInt(orden) || 0,
    created_at: new Date().toISOString()
  };
  const { data, error } = await trySupabase(() => supabase.from('premios_ruleta').insert([premio]).select().maybeSingle());
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/premios-ruleta/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  if (updates.valor !== undefined) updates.valor = parseFloat(updates.valor) || 0;
  if (updates.probabilidad !== undefined) updates.probabilidad = parseFloat(updates.probabilidad) || 0;
  const { data, error } = await trySupabase(() => supabase.from('premios_ruleta').update(updates).eq('id', id).select().maybeSingle());
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/premios-ruleta/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await trySupabase(() => supabase.from('premios_ruleta').delete().eq('id', id));
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

router.post('/regalar-tickets', async (req, res) => {
  try {
    const { tipo, targetId, cantidad } = req.body; // tipo: 'todos', 'nivel', 'usuario'
    const numTickets = parseInt(cantidad);
    
    if (isNaN(numTickets) || numTickets <= 0) {
      return res.status(400).json({ error: 'Cantidad de tickets inválida' });
    }

    let query = supabase.from('usuarios').select('id, nombre_usuario').eq('rol', 'usuario');

    if (tipo === 'nivel' && targetId) {
      query = query.eq('nivel_id', targetId);
    } else if (tipo === 'usuario' && targetId) {
      query = query.eq('id', targetId);
    }

    const { data: users, error: fetchError } = await trySupabase(() => query);
    if (fetchError) throw fetchError;

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'No se encontraron usuarios para esta selección' });
    }

    // Realizar la actualización en bloques pequeños para evitar saturar Render free tier
    const CHUNK_SIZE = 5;
    logger.info(`[Admin] Iniciando regalo de ${numTickets} tickets a ${users.length} usuarios en bloques de ${CHUNK_SIZE}`);
    
    for (let i = 0; i < users.length; i += CHUNK_SIZE) {
      const chunk = users.slice(i, i + CHUNK_SIZE);
      logger.info(`[Admin] Procesando bloque ${Math.floor(i/CHUNK_SIZE) + 1}...`);
      
      await Promise.all(chunk.map(async (user) => {
        try {
          // Intentamos actualizar. Si la columna no existe, fallará aquí.
          // Obtenemos el usuario fresco para tener su saldo actual de tickets si existe
          const { data: freshUser } = await supabase.from('usuarios').select('*').eq('id', user.id).maybeSingle();
          const currentTickets = freshUser ? (Number(freshUser.tickets_ruleta) || 0) : 0;
          
          const { error: updError } = await supabase.from('usuarios').update({
            tickets_ruleta: currentTickets + numTickets
          }).eq('id', user.id);

          if (updError) {
            if (updError.message?.includes('column "tickets_ruleta" does not exist')) {
              throw new Error('LA COLUMNA "tickets_ruleta" NO EXISTE EN SUPABASE. Por favor, ejecuta el SQL que te envié en el panel de Supabase.');
            }
            throw updError;
          }
        } catch (e) {
          logger.error(`[Admin] Falló actualización de usuario ${user.id}:`, e.message);
          throw e;
        }
      }));
    }

    logger.info(`[Admin] Regalo de tickets completado exitosamente`);
    res.json({ ok: true, message: `Se han regalado ${numTickets} tickets a ${users.length} usuario(s).` });
  } catch (err) {
    logger.error('[Admin] Error al regalar tickets:', err);
    res.status(500).json({ error: 'Error al procesar el regalo de tickets: ' + err.message });
  }
});

router.post('/niveles/sync-s1-s9', async (req, res) => {
  const defaultNiveles = [
    { codigo: 'pasante', nombre: 'Pasante', costo: 0, deposito: 0, tareas_diarias: 3, ganancia_tarea: 2, orden: 0 },
    { codigo: 'S1', nombre: 'Nivel S1', costo: 200, deposito: 200, tareas_diarias: 5, ganancia_tarea: 4, orden: 1 },
    { codigo: 'S2', nombre: 'Nivel S2', costo: 720, deposito: 720, tareas_diarias: 10, ganancia_tarea: 7.2, orden: 2 },
    { codigo: 'S3', nombre: 'Nivel S3', costo: 2830, deposito: 2830, tareas_diarias: 20, ganancia_tarea: 14.15, orden: 3 },
    { codigo: 'S4', nombre: 'Nivel S4', costo: 5500, deposito: 5500, tareas_diarias: 40, ganancia_tarea: 27.5, orden: 4 },
    { codigo: 'S5', nombre: 'Nivel S5', costo: 12000, deposito: 12000, tareas_diarias: 60, ganancia_tarea: 60, orden: 5 },
    { codigo: 'S6', nombre: 'Nivel S6', costo: 25000, deposito: 25000, tareas_diarias: 80, ganancia_tarea: 125, orden: 6 },
    { codigo: 'S7', nombre: 'Nivel S7', costo: 50000, deposito: 50000, tareas_diarias: 100, ganancia_tarea: 250, orden: 7 },
    { codigo: 'S8', nombre: 'Nivel S8', costo: 100000, deposito: 100000, tareas_diarias: 150, ganancia_tarea: 500, orden: 8 },
    { codigo: 'S9', nombre: 'Nivel S9', costo: 200000, deposito: 200000, tareas_diarias: 200, ganancia_tarea: 1000, orden: 9 },
  ];

  try {
    for (const n of defaultNiveles) {
      await trySupabase(() => supabase.from('niveles').upsert(n, { onConflict: 'codigo' }));
    }
    res.json({ ok: true, message: 'Niveles S1-S9 sincronizados correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/niveles', async (req, res) => {
  const niveles = await getLevels();
  res.json(niveles);
});

router.put('/niveles/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const { data, error } = await trySupabase(() => 
    supabase.from('niveles').update(updates).eq('id', id).select().maybeSingle()
  );
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/public-content', async (req, res) => {
  const config = await getPublicContent();
  res.json(mergePublicContent(config));
});

// --- GESTIÓN DE ADMINISTRADORES Y TURNOS ---

router.get('/admins', async (req, res) => {
  const { data: admins } = await trySupabase(() => 
    supabase.from('admins').select('*').order('nombre', { ascending: true })
  );
  res.json(admins || []);
});

router.post('/admins', async (req, res) => {
  try {
    const { nombre, telefono, telegram_user_id, telegram_username, rol, activo, hora_inicio_turno, hora_fin_turno, recibe_notificaciones, qr_base64, dias_semana } = req.body;
    
    await trySupabase(() => supabase.from('admins').insert([{
      nombre,
      telefono,
      telegram_user_id,
      telegram_username,
      rol: rol || 'admin',
      activo: activo ?? true,
      hora_inicio_turno: hora_inicio_turno || '00:00',
      hora_fin_turno: hora_fin_turno || '23:59',
      recibe_notificaciones: recibe_notificaciones ?? true,
      qr_base64,
      dias_semana
    }]));
    
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, telegram_user_id, telegram_username, rol, activo, hora_inicio_turno, hora_fin_turno, recibe_notificaciones, qr_base64, dias_semana } = req.body;
    
    await trySupabase(() => supabase.from('admins').update({
      nombre,
      telefono,
      telegram_user_id,
      telegram_username,
      rol,
      activo,
      hora_inicio_turno,
      hora_fin_turno,
      recibe_notificaciones,
      qr_base64,
      dias_semana
    }).eq('id', id));
    
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admins/:id', async (req, res) => {
  const { id } = req.params;
  await trySupabase(() => supabase.from('admins').delete().eq('id', id));
  res.json({ ok: true });
});

// --- FIN GESTIÓN DE ADMINISTRADORES ---

router.put('/public-content', async (req, res) => {
  const updates = req.body;
  
  try {
    for (const [clave, valor] of Object.entries(updates)) {
      const valorFinal = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
      await trySupabase(() => 
        supabase.from('configuraciones').upsert({ clave, valor: valorFinal }, { onConflict: 'clave' })
      );
    }
    // Invalidar caché de memoria para que los cambios se reflejen de inmediato
    refreshPublicContent();
    const config = await getPublicContent();
    res.json(mergePublicContent(config));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/contenido-home', async (req, res) => {
  const updates = req.body;
  try {
    for (const [clave, valor] of Object.entries(updates)) {
      const valorFinal = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
      await trySupabase(() => 
        supabase.from('configuraciones').upsert({ clave, valor: valorFinal }, { onConflict: 'clave' })
      );
    }
    // Invalidar caché de memoria
    refreshPublicContent();
    const config = await getPublicContent();
    res.json(mergePublicContent(config));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cuestionario/castigar', async (req, res) => {
  try {
    const config = await getPublicContent();
    const cData = config.cuestionario_data || {};
    
    // REGLA 1: No castigar si el cuestionario NO está activo
    if (!config.cuestionario_activo) {
      return res.status(400).json({ error: 'Cuestionario inactivo. No se aplican sanciones.' });
    }

    // REGLA 2: No castigar si el cuestionario no tiene preguntas (inválido)
    if (!cData.preguntas || cData.preguntas.length === 0) {
      return res.status(400).json({ error: 'Cuestionario sin preguntas configuradas. Sanción abortada por seguridad.' });
    }

    const users = await getUsers();
    const normalUsers = users.filter(u => u.rol === 'usuario');
    
    if (normalUsers.length === 0) return res.json({ ok: true, punished: 0, message: 'No hay usuarios para sancionar.' });

    // Determinar la fecha objetivo del castigo: AYER
    // Porque se castiga a quienes no respondieron el día que ya pasó.
    const targetDate = boliviaTime.yesterdayStr();
    
    // Consultar respuestas del día objetivo
    const { data: responded } = await trySupabase(() => 
      supabase.from('respuestas_cuestionario').select('usuario_id').eq('fecha', targetDate)
    );
    const respondedIds = new Set(responded?.map(r => r.usuario_id) || []);

    // REGLA 3: Salvaguarda contra bloqueos masivos por error de visibilidad
    // Si hay muchos usuarios pero NADIE respondió ayer, es probable que el cuestionario 
    // no fuera visible o hubiera un error de red/servidor.
    if (normalUsers.length > 5 && respondedIds.size === 0) {
      return res.status(400).json({ 
        error: `Bloqueo masivo detectado: 0 respuestas registradas para la fecha ${targetDate}. Es posible que el cuestionario no haya sido visible.` 
      });
    }

    // Calcular fecha de liberación (mañana respecto a hoy)
    const tomorrow = new Date(boliviaTime.now());
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = boliviaTime.getDateString(tomorrow);

    let punishedCount = 0;
    for (const user of normalUsers) {
      if (!respondedIds.has(user.id)) {
        await updateUser(user.id, { castigado_hasta: tomorrowStr });
        punishedCount++;
      }
    }

    res.json({ 
      ok: true, 
      punished: punishedCount, 
      total_checked: normalUsers.length,
      target_date: targetDate,
      message: `Sanciones aplicadas para el día ${targetDate}.`
    });
  } catch (err) {
    logger.error('[Admin Castigar] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/cuestionario/castigados', async (req, res) => {
  try {
    const data = await getPunishedUsers();
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cuestionario/desbloquear/:id', async (req, res) => {
  try {
    await unpunishUser(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cuestionario/desbloquear-todos', async (req, res) => {
  try {
    await unpunishAllUsers();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
