import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createUser, getLevels } from './src/lib/queries.js';

async function addNewUser() {
  try {
    const telefono = '+59171234567';
    const password = 'password123';
    const nombre_usuario = 'usuario_nuevo';
    
    console.log(`--- Creando nuevo usuario: ${nombre_usuario} ---`);
    
    const password_hash = await bcrypt.hash(password, 10);
    const codigo_invitacion = Math.random().toString(36).slice(2, 10).toUpperCase();
    const levels = await getLevels();
    
    const newUser = {
      id: uuidv4(),
      telefono,
      nombre_usuario,
      nombre_real: nombre_usuario,
      password_hash,
      codigo_invitacion,
      invitado_por: null, // Sin invitador para esta prueba
      nivel_id: 'l1', // Nivel Pasante
      saldo_principal: 0,
      saldo_comisiones: 0,
      rol: 'usuario',
      bloqueado: false,
      oportunidades_sorteo: 1,
      created_at: new Date().toISOString()
    };

    const result = await createUser(newUser);
    
    if (result) {
      console.log('✅ Usuario creado exitosamente en Supabase/Memoria.');
      console.log('-----------------------------------');
      console.log('Credenciales de acceso:');
      console.log(`Teléfono: ${telefono}`);
      console.log(`Contraseña: ${password}`);
      console.log('-----------------------------------');
    } else {
      console.error('❌ No se pudo crear el usuario.');
    }
  } catch (error) {
    console.error('❌ Error al ejecutar el script:', error.message);
  } finally {
    process.exit();
  }
}

addNewUser();
