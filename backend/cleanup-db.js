
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function cleanup() {
  console.log('🧹 Iniciando limpieza de base de datos...');

  const idsToDelete = [
    '0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d', // El ID mencionado por el usuario
    '1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e'  // Otro ID de prueba común
  ];

  for (const id of idsToDelete) {
    const { error } = await supabase
      .from('tareas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`❌ Error eliminando tarea ${id}:`, error.message);
    } else {
      console.log(`✅ Tarea ${id} eliminada (si existía).`);
    }
  }

  // También eliminamos actividades relacionadas con estos IDs si existen
  const { error: actError } = await supabase
    .from('actividad_tareas')
    .delete()
    .in('tarea_id', idsToDelete);

  if (actError) {
    console.error('❌ Error eliminando actividades:', actError.message);
  } else {
    console.log('✅ Actividades antiguas limpiadas.');
  }

  console.log('✨ Limpieza completada.');
}

cleanup();
