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
    
    // Obtener actividad REAL del usuario (auditada por movimientos_saldo si es posible, o actividad_tareas)
    const activity = await getTaskActivity(user.id);
    
    // Helper para fechas en zona horaria Bolivia
    const getBoliviaDateString = (date) => {
      return new Date(date).toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' }); // YYYY-MM-DD
    };
    
    const todayStr = getBoliviaDateString(new Date());
    
    // Contar intentos de hoy (solo los que coincidan con la fecha de hoy en Bolivia)
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
      // Obtener todas las tareas del nivel actual
      const allTasks = await getTasks(level.id);
      
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
        descripcion: t.descripcion,
        pregunta: t.pregunta,
        opciones: t.opciones,
        respuesta_correcta: t.respuesta_correcta // Opcional: podrías no enviarla si quieres validación 100% server-side, pero el usuario la pide para optimizar
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

    // Normalización para validación (quitar tildes, mayúsculas, espacios, puntuación)
    const normalizar = (str) => {
      if (!str) return '';
      return String(str)
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
        .replace(/[^\w\s]/gi, '') // Quitar puntuación (como ' en McDonald's)
        .toUpperCase()
        .trim();
    };

    const respuestaUsuario = normalizar(respuesta);
    const respuestaCorrecta = normalizar(task.respuesta_correcta);
    const esCorrectaReal = respuestaUsuario === respuestaCorrecta;
    const recompensa = esCorrectaReal ? Number(task.recompensa) : 0;

    console.log(`[Tasks v4] Validación de tarea ${task.id}:`);
    console.log(`  - Usuario: ${user.nombre_usuario} (${user.id})`);
    console.log(`  - Respuesta enviada: "${respuesta}" (Normalizada: "${respuestaUsuario}")`);
    console.log(`  - Respuesta esperada: "${task.respuesta_correcta}" (Normalizada: "${respuestaCorrecta}")`);
    console.log(`  - Resultado: ${esCorrectaReal ? 'CORRECTA ✅' : 'INCORRECTA ❌'}`);
    
    const levels = await getLevels();
    const level = levels.find(l => String(l.id) === String(user.nivel_id)) || levels[0];

    // Registrar actividad PRIMERO para que cuente el intento incluso si falla
    const activityId = uuidv4();
    await createTaskActivity({
      id: activityId,
      usuario_id: user.id,
      tarea_id: task.id,
      respuesta_correcta: esCorrectaReal,
      recompensa_otorgada: recompensa,
      nivel_id: level.id,
      created_at: new Date().toISOString(),
    });

    if (esCorrectaReal) {
      // PAGO A ACTIVOS (saldo_principal)
      await updateUser(user.id, {
        saldo_principal: (Number(user.saldo_principal) || 0) + recompensa,
      });
      
      // Registrar en estadísticas persistentes con el nuevo sistema de eventos
      await addUserEarnings(user.id, recompensa, 'ganancia_tarea', activityId, `Ganancia por tarea: ${task.nombre}`);
      
      // Distribuir comisiones a la red (Upline)
      const { distributeCommissions } = await import('../lib/queries.js');
      await distributeCommissions(user.id, recompensa);
    }

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
