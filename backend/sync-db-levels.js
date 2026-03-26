import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { levels } from './src/data/seed.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL y SUPABASE_SERVICE_KEY son necesarios en el .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncLevels() {
  console.log('--- Iniciando Sincronización de Niveles ---');
  
  for (const level of levels) {
    console.log(`Sincronizando ${level.nombre} (Activo: ${level.activo !== false})...`);
    
    // Intentar actualizar o insertar (upsert) basado en el Código
    const { data, error } = await supabase
      .from('niveles')
      .upsert({
        codigo: level.codigo,
        nombre: level.nombre,
        deposito: level.deposito,
        ingreso_diario: level.ingreso_diario,
        num_tareas_diarias: level.num_tareas_diarias,
        comision_por_tarea: level.comision_por_tarea,
        orden: level.orden,
        activo: level.activo !== false
      }, { onConflict: 'codigo' });

    if (error) {
      console.error(`❌ Error con ${level.nombre}:`, error.message);
    } else {
      console.log(`✅ ${level.nombre} sincronizado.`);
    }
  }
  
  console.log('--- Sincronización Finalizada ---');
}

syncLevels();
