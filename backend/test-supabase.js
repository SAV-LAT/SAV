import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('--- Verificando Conexión Supabase ---');
console.log('URL:', supabaseUrl);
console.log('Key detectada:', supabaseKey ? 'SÍ (inicia con ' + supabaseKey.substring(0, 10) + '...)' : 'NO');

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Faltan variables de entorno en el archivo .env del backend.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log('\n1. Intentando leer tabla "usuarios"...');
    const { data, error } = await supabase.from('usuarios').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.message.includes('permission denied')) {
        console.error('❌ ERROR DE PERMISOS: El esquema public está bloqueado.');
        console.log('👉 SOLUCIÓN: Ejecuta el código SQL de los GRANTs en el Dashboard de Supabase.');
      } else {
        console.error('❌ ERROR DE SUPABASE:', error.message);
      }
    } else {
      console.log('✅ CONEXIÓN EXITOSA: Se pudo acceder a la base de datos.');
    }
  } catch (err) {
    console.error('❌ ERROR DE RED (fetch failed): No se pudo llegar al servidor de Supabase.');
    console.log('👉 VERIFICA: Tu conexión a internet y que la URL sea correcta.');
  }
}

test();
