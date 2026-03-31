import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  findUserById, getLevels, getTasks, getTaskById, getTaskActivity, 
  createTaskActivity, updateUser, addUserEarnings, distributeTaskCommissions, 
  boliviaTime, isUserPunished, getPublicContent 
} from '../lib/queries.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// In-memory lock to prevent duplicate task submissions
const taskLocks = new Set();

router.get('/', authenticate, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // VERIFICAR CASTIGO POR CUESTIONARIO
    const castigado = await isUserPunished(user.id);
    if (castigado) {
      return res.status(403).json({ 
        error: 'Tu acceso a tareas ha sido bloqueado por hoy como castigo por no responder el cuestionario obligatorio de ayer.',
        castigado: true
      });
    }

    // Restricción de días permitidos (Configuración Global + Excepción de Usuario)
    let config = {};
    try {
      config = await getPublicContent();
    } catch (e) {
      console.warn('[Tasks] No se pudo cargar configuración pública, usando por defecto (L-V)');
    }
    
    const allowedDays = (config.task_allowed_days || '1,2,3,4,5').split(',').map(Number);
    const day = boliviaTime.getDay();
    
    const isWeekend = day === 0 || day === 6;
    const isDayAllowed = allowedDays.includes(day);
    const hasUserException = user.allow_weekend_tasks === true;

    if (!isDayAllowed && !(isWeekend && hasUserException)) {
      return res.status(403).json({ 
        error: 'Las tareas no están disponibles el día de hoy (Horario Bolivia).',
        es_fin_de_semana: isWeekend,
        config_days: allowedDays
      });
    }

    const levels = await getLevels();
    const level = levels.find(l => 
      String(l.id) === String(user.nivel_id) || 
      String(l.codigo).toUpperCase() === String(user.nivel_id).toUpperCase() ||
      String(l.nombre).toUpperCase() === String(user.nivel_id).toUpperCase()
    );
    
    if (!level) {
      console.error(`[Tasks v4] Nivel no encontrado para usuario ${user.id}: ${user.nivel_id}`);
      return res.status(400).json({ 
        error: 'Tu cuenta tiene un nivel inválido o no configurado. Contacta a soporte.',
        nivel_id: user.nivel_id 
      });
    }
    
    // Obtener actividad REAL del usuario
    const activity = await getTaskActivity(user.id);
    const todayStr = boliviaTime.todayStr();
    
    // Contar SOLO las tareas completadas EXITOSAMENTE hoy para el cupo diario
    const todaySuccessfulActivity = activity.filter(a => 
      boliviaTime.getDateString(a.created_at) === todayStr && 
      a.respuesta_correcta === true
    );
    const todayCompletedCount = todaySuccessfulActivity.length;

    // Lógica especial para Pasante: 3 días desde el REGISTRO
    const isPasante = String(level.codigo).toLowerCase() === 'pasante';
    if (isPasante) {
      const fechaRegistro = user.created_at || user.fecha_registro;
      if (fechaRegistro) {
        const regDate = new Date(fechaRegistro);
        const boliviaNow = boliviaTime.now();
        const diffTime = Math.abs(boliviaNow - regDate);
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
      
      // Ya NO filtramos por intentos. El usuario puede ver todas las tareas de su nivel.
      // Pero identificamos cuáles ya completó exitosamente para que no gane doble.
      const successfulTaskIdsToday = new Set(todaySuccessfulActivity.map(a => String(a.tarea_id)));
      
      // FILTRO DE INTEGRIDAD ESTRICTO
      const pool = allTasks.filter(t => {
        const hasVideo = t.video_url && String(t.video_url).trim().length > 0;
        const hasQuestion = t.pregunta && String(t.pregunta).trim().length > 0;
        const hasOptions = Array.isArray(t.opciones) && t.opciones.length > 0;
        const hasAnswer = t.respuesta_correcta && String(t.respuesta_correcta).trim().length > 0;
        
        return hasVideo && hasQuestion && hasOptions && hasAnswer;
      });
      
      // Selección aleatoria de las tareas disponibles
      availableTasks = pool.sort(() => 0.5 - Math.random()).slice(0, remaining + 5); // Mostramos un poco más por si acaso
    }

    res.json({
      nivel: level.nombre,
      nivel_id: level.id,
      tareas_restantes: remaining,
      tareas_completadas: todayCompletedCount,
      tareas: availableTasks.map(t => {
        return {
          id: t.id,
          nombre: t.nombre,
          recompensa: t.recompensa,
          video_url: t.video_url,
          descripcion: t.descripcion,
          pregunta: t.pregunta,
          opciones: t.opciones,
          completada_hoy: false // Siempre disponible para repetir si hay cupo
        };
      }),
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
    
    // Validación de integridad del detalle
    const options = Array.isArray(task.opciones) ? task.opciones : [];
    const hasCorrectAnswerInOptions = options.some(opt => 
      String(opt).trim().toUpperCase() === String(task.respuesta_correcta).trim().toUpperCase()
    );

    if (!hasCorrectAnswerInOptions && task.respuesta_correcta) {
      console.error(`[Tasks v4] ALERTA: La tarea ${task.id} tiene una respuesta correcta ("${task.respuesta_correcta}") que no figura en sus opciones: ${JSON.stringify(options)}`);
    }

    res.json({
      ...task,
      nivel: level?.nombre,
      completada_hoy: false,
      error_configuracion: !hasCorrectAnswerInOptions
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

    // Restricción de días permitidos al RESPONDER (Doble validación de seguridad)
    let config = {};
    try {
      config = await getPublicContent();
    } catch (e) {
      console.warn('[Tasks] No se pudo cargar configuración pública al responder, usando por defecto (L-V)');
    }
    const allowedDays = (config.task_allowed_days || '1,2,3,4,5').split(',').map(Number);
    const day = boliviaTime.getDay();
    
    const isWeekend = day === 0 || day === 6;
    const isDayAllowed = allowedDays.includes(day);
    const hasUserException = user.allow_weekend_tasks === true;

    if (!isDayAllowed && !(isWeekend && hasUserException)) {
      return res.status(403).json({ 
        error: 'No puedes realizar tareas en este momento (Día no permitido).'
      });
    }
    
    const task = await getTaskById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    console.log(`[Tasks v4] Respuesta recibida de ${user.nombre_usuario} para tarea ${req.params.id}: "${respuesta}"`);

    // --- BLOQUEO ANTI-DUPLICADO (Race Condition Prevention) ---
    const lockKey = `${user.id}:${task.id}`;
    if (taskLocks.has(lockKey)) {
      console.log(`  - [BLOQUEO] Petición duplicada detectada para ${lockKey}. Ignorando...`);
      return res.status(429).json({ error: 'Procesando tu respuesta anterior. Por favor, espera.' });
    }
    
    taskLocks.add(lockKey);
    // Aseguramos que el bloqueo se libere después de un tiempo (ej. 30 segundos) si algo falla catastróficamente
    const lockTimeout = setTimeout(() => taskLocks.delete(lockKey), 30000);
    
    // --- LÓGICA DE VALIDACIÓN ULTRA-REFORZADA ---
    try {
      const normalizeStr = (s) => {
        if (!s) return '';
        return s
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Quitar tildes y diacríticos
          // Unificar todo tipo de comillas, apóstrofes y variantes de puntuación
          .replace(/['’‘´`\u00B4\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
          .replace(/[\u200B-\u200D\uFEFF]/g, "") // Quitar caracteres invisibles
          // MANTENER espacios para evitar falsos positivos en frases
          .replace(/[^a-zA-Z0-9' ]/g, "") 
          .replace(/\s+/g, " ") // Unificar múltiples espacios
          .trim()
          .toUpperCase();
      };

      const valUser = normalizeStr(respuesta);
      const valCorrect = normalizeStr(task.respuesta_correcta);
      const esCorrectaReal = valUser === valCorrect && valCorrect !== '';
      const recompensa = esCorrectaReal ? Number(task.recompensa) : 0;

      console.log(`\n[VALIDACIÓN PASO A PASO]`);
      console.log(`  - Task ID: ${task.id}`);
      console.log(`  - User ID: ${user.id} (${user.nombre_usuario})`);
      console.log(`  - Recibido Original: "${respuesta}" -> Normalizado: "${valUser}"`);
      console.log(`  - Esperado Original: "${task.respuesta_correcta}" -> Normalizado: "${valCorrect}"`);
      console.log(`  - Resultado: ${esCorrectaReal ? 'CORRECTO ✅' : 'INCORRECTO ❌'}`);

      const levels = await getLevels();
      const level = levels.find(l => 
        String(l.id) === String(user.nivel_id) || 
        String(l.codigo).toUpperCase() === String(user.nivel_id).toUpperCase() ||
        String(l.nombre).toUpperCase() === String(user.nivel_id).toUpperCase()
      );
      
      if (!level) {
        console.error(`[Tasks v4] Nivel no encontrado para usuario ${user.id} al responder: ${user.nivel_id}`);
        throw new Error('Nivel de usuario no válido');
      }

      // Registrar actividad PRIMERO
      const activityId = uuidv4();
      console.log(`  - [STEP 1] Registrando actividad_tareas...`);
      
      const activityData = {
        id: activityId,
        usuario_id: user.id,
        tarea_id: task.id,
        respuesta_correcta: esCorrectaReal,
        recompensa_otorgada: recompensa,
        nivel_id: level.id,
        created_at: boliviaTime.now().toISOString(),
      };

      try {
        await createTaskActivity(activityData);
        console.log(`  - [OK] Actividad registrada.`);
      } catch (schemaErr) {
        console.warn(`  - [FALLBACK] Error al registrar actividad con nivel_id. Reintentando sin nivel_id...`);
        delete activityData.nivel_id;
        await createTaskActivity(activityData);
        console.log(`  - [OK] Actividad registrada (fallback).`);
      }

      if (esCorrectaReal) {
        console.log(`  - [STEP 2] Tarea correcta. Iniciando acreditación de ${recompensa} BOB...`);
        
        // 1. Registrar ganancia y actualizar saldo
        try {
          await addUserEarnings(user.id, recompensa, 'ganancia_tarea', activityId, `Ganancia por tarea: ${task.nombre}`);
          console.log(`  - [OK] Ganancia, saldo y movimiento contable registrados.`);
        } catch (e) {
          console.error(`  - [ERROR] Fallo al acreditar ganancia:`, e.message);
          throw new Error(`Fallo contable: ${e.message}`);
        }
        
        // 2. Distribuir comisiones (No bloqueante para el usuario)
        try {
          console.log(`  - [STEP 3] Procesando comisiones de red...`);
          await distributeTaskCommissions(user.id, recompensa);
          console.log(`  - [OK] Comisiones enviadas a cola de procesamiento.`);
        } catch (e) {
          console.error(`  - [AVISO] Fallo no crítico en comisiones:`, e.message);
        }
      } else {
        console.log(`  - [STEP 2] Tarea incorrecta. No se acredita recompensa.`);
      }

      res.json({
        success: esCorrectaReal,
        correcta: esCorrectaReal,
        monto: recompensa,
        respuesta_correcta: task.respuesta_correcta, // Devolvemos la respuesta correcta para el feedback
        mensaje: esCorrectaReal ? '¡Tarea completada con éxito!' : 'Respuesta incorrecta.',
      });

    } finally {
      // SIEMPRE liberamos el bloqueo al terminar (con éxito o error interno)
      clearTimeout(lockTimeout);
      taskLocks.delete(lockKey);
      console.log(`  - [BLOQUEO] Liberado para ${lockKey}.`);
    }

  } catch (err) {
    console.error(`[Tasks v4] Error crítico en responder tarea ${req.params.id}:`, err);
    res.status(500).json({ 
      error: 'Error al procesar la respuesta',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export default router;
