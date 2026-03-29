import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan credenciales de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteTasks() {
  const ids = [
    '0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
    '1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e'
  ];
  
  for (const taskId of ids) {
    console.log(`Eliminando tarea con ID: ${taskId}...`);
    const { error } = await supabase
      .from('tareas')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error(`Error al eliminar tarea ${taskId}:`, error.message);
    } else {
      console.log(`Tarea ${taskId} eliminada correctamente.`);
    }
  }
}

deleteTasks();
