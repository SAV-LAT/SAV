import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createUser, findUserByTelefono, updateUser, getLevels } from './src/lib/queries.js';

async function setupUser() {
  try {
    const telefono = '+59174344916';
    const password = '12345';
    const nombre_usuario = 'usuario_real';
    const nivel_codigo = 'S1';
    
    console.log(`--- Configurando usuario: ${telefono} ---`);
    
    const levels = await getLevels();
    const targetLevel = levels.find(l => l.codigo === nivel_codigo || l.nombre === nivel_codigo);
    
    if (!targetLevel) {
      console.error(`❌ Nivel ${nivel_codigo} no encontrado.`);
      process.exit(1);
    }

    const password_hash = await bcrypt.hash(password, 10);
    const existingUser = await findUserByTelefono(telefono);
    
    if (existingUser) {
      console.log('🔄 Usuario ya existe. Actualizando datos...');
      const updated = await updateUser(existingUser.id, {
        password_hash,
        nivel_id: targetLevel.id,
        bloqueado: false
      });
      console.log('✅ Usuario actualizado exitosamente.');
    } else {
      console.log('🆕 Creando nuevo usuario...');
      const codigo_invitacion = Math.random().toString(36).slice(2, 10).toUpperCase();
      const newUser = {
        id: uuidv4(),
        telefono,
        nombre_usuario,
        nombre_real: nombre_usuario,
        password_hash,
        codigo_invitacion,
        invitado_por: null,
        nivel_id: targetLevel.id,
        saldo_principal: 200, // Saldo inicial para S1
        saldo_comisiones: 0,
        rol: 'usuario',
        bloqueado: false,
        oportunidades_sorteo: 5,
        created_at: new Date().toISOString()
      };
      await createUser(newUser);
      console.log('✅ Usuario creado exitosamente.');
    }

    console.log('-----------------------------------');
    console.log('Credenciales configuradas:');
    console.log(`Teléfono: ${telefono}`);
    console.log(`Contraseña: ${password}`);
    console.log(`Nivel: ${targetLevel.nombre} (${targetLevel.id})`);
    console.log('-----------------------------------');
    
  } catch (error) {
    console.error('❌ Error al ejecutar el script:', error.message);
  } finally {
    process.exit();
  }
}

setupUser();