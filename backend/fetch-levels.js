import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getLevels() {
  const { data, error } = await supabase.from('niveles').select('id, codigo, nombre');
  if (error) {
    console.error('Error fetching levels:', error.message);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

getLevels();
