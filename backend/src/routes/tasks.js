import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { findUserById, getLevels, getTasks, getTaskById, getTaskActivity, createTaskActivity, updateUser, addUserEarnings } from '../lib/queries.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    // Restricción de fin de semana (Sábado = 6, Domingo = 0)
    const now = new Date();
    const day = now.getDay();
    if (day === 0 || day === 6) {
      return res.status(403).json({ 
        error: 'Las tareas solo están disponibles de lunes a viernes.',
        es_fin_de_semana: true 
      });
    }

    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const levels = await getLevels();
    const level = levels.find(l => String(l.id) === String(user.nivel_id)) || levels[0];
    
    const allTasks = await getTasks(level.id);
    const activity = await getTaskActivity(user.id);
    
    // Helper para fechas en zona horaria Bolivia
    const getBoliviaDateString = (date) => {
      return new Date(date).toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' }); // YYYY-MM-DD
    };
    
    const todayStr = getBoliviaDateString(new Date());
    
    // Contar intentos de hoy (tanto aciertos como fallos)
    const todayActivity = activity.filter(a => getBoliviaDateString(a.created_at) === todayStr);
    const todayCompletedCount = todayActivity.length;

    // Lógica especial para Pasante: 3 días desde el REGISTRO
    const isPasante = String(level.codigo).toLowerCase() === 'pasante';
    if (isPasante) {
      const fechaRegistro = user.created_at || user.fecha_registro;
      if (fechaRegistro) {
        const regDate = new Date(fechaRegistro);
        const diffTime = Math.abs(now - regDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 3) {
          return res.json({
            nivel: level.nombre,
            tareas_restantes: 0,
            tareas_completadas: todayCompletedCount,
            tareas: [],
            bloqueado: true,
            mensaje: 'Tu periodo de tareas como Pasante ha finalizado. Debes subir de nivel para continuar.'
          });
        }
      }
    }

    const numTareasDiarias = Number(level.num_tareas_diarias || level.tareas_diarias) || 0;
    const remaining = Math.max(0, numTareasDiarias - todayCompletedCount);
    
    let mensaje = null;
    let availableTasks = [];

    if (remaining <= 0) {
      mensaje = 'Has completado tu cupo diario de tareas. ¡Vuelve mañana!';
    } else {
      // Filtrar tareas que NO se han intentado hoy (ni bien ni mal)
      const attemptedTaskIdsToday = new Set(todayActivity.map(a => String(a.tarea_id)));
      const pool = allTasks.filter(t => !attemptedTaskIdsToday.has(String(t.id)));
      
      // Selección aleatoria
      availableTasks = pool.sort(() => 0.5 - Math.random()).slice(0, remaining);
    }

    res.json({
      nivel: level.nombre,
      nivel_id: level.id,
      tareas_restantes: remaining,
      tareas_completadas: todayCompletedCount,
      tareas: availableTasks.map(t => ({
        id: t.id,
        nombre: t.nombre,
        recompensa: t.recompensa,
        video_url: t.video_url,
        descripcion: t.descripcion
      })),
      mensaje
    });
  } catch (err) {
    console.error('[Tasks v4] Error en GET /:', err);
    res.status(500).json({ error: 'Error al cargar tareas' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await getTaskById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
    
    const levels = await getLevels();
    const level = levels.find(l => String(l.id) === String(task.nivel_id));
    
    const activity = await getTaskActivity(req.user.id);
    
    const getBoliviaDateString = (date) => {
      return new Date(date).toLocaleDateString('en-US', { timeZone: 'America/La_Paz' });
    };
    
    const todayStr = getBoliviaDateString(new Date());
    const yaCompletadaExitosamente = activity.some(
      a => String(a.tarea_id) === String(task.id) && 
           getBoliviaDateString(a.created_at) === todayStr && 
           a.respuesta_correcta === true
    );

    res.json({
      ...task,
      nivel: level?.nombre,
      completada_hoy: yaCompletadaExitosamente,
    });
  } catch (err) {
    console.error(`[Tasks v4] Error en GET /api/tasks/${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Error al cargar detalles de la tarea' });
  }
});

router.post('/:id/responder', authenticate, async (req, res) => {
  try {
    const { respuesta } = req.body;
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    const task = await getTaskById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    console.log(`[Tasks v4] Respuesta recibida de ${user.nombre_usuario} para tarea ${req.params.id}: "${respuesta}"`);

    const activity = await getTaskActivity(user.id);
    const getBoliviaDateString = (date) => {
      return new Date(date).toLocaleDateString('en-US', { timeZone: 'America/La_Paz' });
    };
    const todayStr = getBoliviaDateString(new Date());

    const yaIntentadaHoy = activity.some(
      a => String(a.tarea_id) === String(task.id) && 
           getBoliviaDateString(a.created_at) === todayStr
    );
    
    if (yaIntentadaHoy) {
      return res.status(400).json({ error: 'Ya intentaste esta tarea hoy' });
    }

    // Normalización para validación
    const normalizar = (str) => {
      if (!str) return '';
      return String(str).toUpperCase().trim();
    };

    const esCorrectaReal = normalizar(respuesta) === normalizar(task.respuesta_correcta);
    const recompensa = esCorrectaReal ? Number(task.recompensa) : 0;
    
    const levels = await getLevels();
    const level = levels.find(l => String(l.id) === String(user.nivel_id)) || levels[0];

    if (esCorrectaReal) {
      // PAGO A ACTIVOS (saldo_principal)
      await updateUser(user.id, {
        saldo_principal: (Number(user.saldo_principal) || 0) + recompensa,
      });
      
      // Registrar en estadísticas persistentes
      await addUserEarnings(user.id, recompensa);
    }

    // Registrar actividad
    await createTaskActivity({
      id: uuidv4(),
      usuario_id: user.id,
      tarea_id: task.id,
      respuesta_correcta: esCorrectaReal,
      recompensa_otorgada: recompensa,
      nivel_id: level.id,
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      correcta: esCorrectaReal,
      monto: recompensa,
      mensaje: esCorrectaReal ? '¡Tarea completada con éxito!' : 'Respuesta incorrecta.',
    });
  } catch (err) {
    console.error(`[Tasks v4] Error en responder:`, err.message);
    res.status(500).json({ error: 'Error al procesar la respuesta' });
  }
});

export default router;
