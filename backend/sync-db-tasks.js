import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { initStore } from './src/data/seed.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncTasks() {
  console.log('--- Iniciando Sincronización de Tareas v3.0.2 ---');
  
  // Mapeo de códigos a UUIDs reales de la base de datos
  const levelMapping = {
    'pasante': '36e8a644-d81c-4e8c-a9c5-6bc6f87cb72c',
    'S1': 'd5d15a03-9caf-4586-9774-5aac09cb9980',
    'S2': 'b50457f4-92c1-403f-91f0-3fc2add51c30',
    'S3': '897d1306-675a-41ef-bf7e-59ccfd352077'
  };

  const { tasks } = await initStore();
  
  console.log('Limpiando tareas anteriores...');
  await supabase.from('tareas').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  for (const task of tasks) {
    const realLevelId = levelMapping[task.nivel_id];
    
    if (!realLevelId) {
      console.warn(`⚠️ Saltando tarea ${task.nombre}: Nivel ID ${task.nivel_id} no mapeado.`);
      continue;
    }

    console.log(`Sincronizando Tarea: ${task.nombre} (Nivel UUID: ${realLevelId})...`);
    
    const { error } = await supabase
      .from('tareas')
      .insert({
        id: task.id,
        nivel_id: realLevelId,
        nombre: task.nombre,
        recompensa: task.recompensa,
        video_url: task.video_url,
        descripcion: task.descripcion,
        pregunta: task.pregunta,
        respuesta_correcta: task.respuesta_correcta,
        opciones: task.opciones
      });

    if (error) {
      console.error(`❌ Error con ${task.nombre}:`, error.message);
    } else {
      console.log(`✅ ${task.nombre} sincronizada.`);
    }
  }
  
  console.log('--- Sincronización de Tareas Finalizada ---');
}

syncTasks();
