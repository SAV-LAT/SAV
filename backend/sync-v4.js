
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { v4_tasks } from './src/data/v4_tasks.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncV4() {
  console.log('🚀 Iniciando Sincronización SAV v4.0.0...');

  // 1. Obtener Niveles para mapear IDs
  const { data: niveles, error: errNiv } = await supabase.from('niveles').select('id, codigo');
  if (errNiv) throw errNiv;

  const levelMap = {};
  niveles.forEach(n => levelMap[n.codigo] = n.id);

  // 2. Limpiar tareas actuales (Opcional, pero recomendado para v4.0.0 limpia)
  console.log('🧹 Limpiando tareas antiguas...');
  const { error: errDel } = await supabase.from('tareas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errDel) console.warn('Aviso limpieza:', errDel.message);

  // 3. Insertar nuevas tareas v4
  for (const task of v4_tasks) {
    const levelId = levelMap[task.nivel_codigo];
    if (!levelId) {
      console.warn(`⚠️ Nivel no encontrado para: ${task.nivel_codigo}`);
      continue;
    }

    const { error: errIns } = await supabase.from('tareas').insert({
      nombre: task.nombre,
      nivel_id: levelId,
      recompensa: task.recompensa,
      video_url: task.video_url,
      descripcion: task.descripcion,
      respuesta_correcta: task.respuesta_correcta,
      opciones: task.opciones
    });

    if (errIns) {
      console.error(`❌ Error insertando ${task.nombre}:`, errIns.message);
    } else {
      console.log(`✅ ${task.nombre} sincronizada correctamente.`);
    }
  }

  console.log('\n✨ Sincronización v4.0.0 Finalizada.');
}

syncV4().catch(err => console.error('Error Fatal:', err));
