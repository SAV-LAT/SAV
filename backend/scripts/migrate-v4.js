
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

async function migrateV4() {
  const client = new Client({ 
    connectionString: "postgresql://postgres:moises.condori1@db.kacrakipsprtzgrtplbz.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('⏳ Conectando a Supabase PostgreSQL (v4 Migration)...');
    await client.connect();
    console.log('✅ Conexión exitosa.');

    const sql = `
      -- 1. Asegurar columnas en la tabla tareas
      ALTER TABLE tareas ADD COLUMN IF NOT EXISTS pregunta_real TEXT;
      ALTER TABLE tareas ADD COLUMN IF NOT EXISTS opciones JSONB DEFAULT '[]';

      -- 2. Crear tabla task_activity para v4 si no existe
      CREATE TABLE IF NOT EXISTS task_activity (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
          task_id UUID REFERENCES tareas(id) ON DELETE CASCADE,
          respuesta TEXT,
          respuesta_correcta BOOLEAN DEFAULT FALSE,
          recompensa DECIMAL(12,2) DEFAULT 0,
          estado TEXT DEFAULT 'completada',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      -- 3. Crear índice para búsquedas rápidas de actividad diaria
      CREATE INDEX IF NOT EXISTS idx_task_activity_user_date ON task_activity (user_id, created_at);
    `;

    console.log('⏳ Ejecutando migración v4...');
    await client.query(sql);
    console.log('🚀 ¡Esquema v4 actualizado correctamente!');

  } catch (err) {
    console.error('❌ Error durante la migración v4:', err.message);
  } finally {
    await client.end();
  }
}

migrateV4().catch(err => console.error(err));
