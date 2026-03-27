import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { levels as seedLevels, initStore } from './src/data/seed.js';
import { publicContentDefaults } from './src/data/publicContentDefaults.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_KEY son necesarios en el .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fullSync() {
  console.log('\n🚀 Iniciando Sincronización Remota Completa...\n');

  // 1. Sincronizar Niveles
  console.log('--- [1/5] Sincronizando Niveles ---');
  for (const level of seedLevels) {
    const { error } = await supabase.from('niveles').upsert({
      codigo: level.codigo,
      nombre: level.nombre,
      deposito: level.deposito,
      ingreso_diario: level.ingreso_diario,
      num_tareas_diarias: level.num_tareas_diarias,
      comision_por_tarea: level.comision_por_tarea,
      orden: level.orden,
      activo: level.activo !== false
    }, { onConflict: 'codigo' });
    if (error) console.error(`  ❌ Error nivel ${level.nombre}:`, error.message);
    else console.log(`  ✅ Nivel ${level.nombre} sincronizado.`);
  }

  // Obtener mapeo real de UUIDs de niveles
  const { data: dbLevels } = await supabase.from('niveles').select('id, codigo');
  const levelMapping = dbLevels.reduce((acc, curr) => ({ ...acc, [curr.codigo]: curr.id }), {});

  // 2. Sincronizar Tareas
  console.log('\n--- [2/5] Sincronizando Tareas ---');
  const { tasks } = await initStore();
  
  for (const task of tasks) {
    const realLevelId = levelMapping[task.nivel_id];
    if (!realLevelId) continue;
    const { error } = await supabase.from('tareas').upsert({
      nivel_id: realLevelId,
      nombre: task.nombre,
      recompensa: task.recompensa,
      video_url: task.video_url,
      descripcion: task.descripcion,
      pregunta: task.pregunta,
      respuesta_correcta: task.respuesta_correcta,
      opciones: task.opciones
    }, { onConflict: 'nivel_id,nombre' });
    if (error) console.error(`  ❌ Error tarea ${task.nombre}:`, error.message);
    else console.log(`  ✅ Tarea ${task.nombre} sincronizada.`);
  }

  // 3. Sincronizar Configuración (Public Content)
  console.log('\n--- [3/5] Sincronizando Configuración ---');
  for (const [clave, valor] of Object.entries(publicContentDefaults)) {
    const { error } = await supabase.from('configuraciones').upsert({
      clave,
      valor
    }, { onConflict: 'clave' });
    if (error) console.error(`  ❌ Error config ${clave}:`, error.message);
    else console.log(`  ✅ Config ${clave} sincronizada.`);
  }

  // 4. Sincronizar Banners y QR
  console.log('\n--- [4/5] Sincronizando Banners y QR ---');
  const { banners, metodosQr } = await initStore();
  
  for (const banner of banners) {
    await supabase.from('banners_carrusel').upsert({
      imagen_url: banner.imagen_url,
      titulo: banner.titulo,
      orden: banner.orden,
      activo: banner.activo
    }, { onConflict: 'imagen_url' });
  }
  console.log('  ✅ Banners sincronizados.');

  for (const qr of metodosQr) {
    await supabase.from('metodos_qr').upsert({
      nombre_titular: qr.nombre_titular,
      activo: qr.activo,
      orden: qr.orden
    }, { onConflict: 'nombre_titular' });
  }
  console.log('  ✅ Métodos QR sincronizados.');

  // 5. Configurar Administradores
  console.log('\n--- [5/5] Configurando Administradores ---');
  const adminNums = ['67091817', '67470858', '77474230'];
  const passHash = await bcrypt.hash('admin123', 10);
  const pasanteId = levelMapping['pasante'];

  for (const num of adminNums) {
    const tel = `+591${num}`;
    const { data: existing } = await supabase.from('usuarios').select('id').eq('telefono', tel).maybeSingle();
    
    if (existing) {
      await supabase.from('usuarios').update({ rol: 'admin', bloqueado: false }).eq('id', existing.id);
      console.log(`  ✅ Admin actualizado: ${tel}`);
    } else {
      await supabase.from('usuarios').insert({
        telefono: tel,
        nombre_usuario: `admin_${num}`,
        password_hash: passHash,
        codigo_invitacion: Math.random().toString(36).slice(2, 10).toUpperCase(),
        nivel_id: pasanteId,
        rol: 'admin',
        saldo_principal: 0,
        saldo_comisiones: 0
      });
      console.log(`  ✅ Admin creado: ${tel}`);
    }
  }

  console.log('\n✨ ¡Sincronización Remota Completada con Éxito! ✨\n');
  process.exit(0);
}

fullSync().catch(err => {
  console.error('\n❌ ERROR CRÍTICO:', err.message);
  process.exit(1);
});
