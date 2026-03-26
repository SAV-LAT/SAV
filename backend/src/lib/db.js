import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// Log de diagnóstico para verificar las variables de entorno
if (!supabaseUrl || !supabaseKey) {
  console.error('\n[CRITICAL] Faltan variables de entorno de Supabase. El servidor no puede conectar a la DB.');
  console.error(`  - SUPABASE_URL: ${supabaseUrl ? 'Encontrada' : 'NO ENCONTRADA'}`);
  console.error(`  - SUPABASE_KEY: ${supabaseKey ? 'Encontrada' : 'NO ENCONTRADA'}\n`);
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const hasDb = () => !!supabase;
