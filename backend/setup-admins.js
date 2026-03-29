import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createUser, findUserByTelefono, updateUser, getLevels } from './src/lib/queries.js';

async function setupAdmins() {
  try {
    const adminNums = ['67091817', '67470858', '77474230'];
    const password = 'admin123';
    const password_hash = await bcrypt.hash(password, 10);
    
    const levels = await getLevels();
    const defaultLevel = levels.find(l => l.codigo === 'pasante' || l.nombre === 'pasante') || levels[0];

    console.log('--- Configurando Administradores Oficiales ---');

    for (const num of adminNums) {
      const telefono = `+591${num}`;
      const existingUser = await findUserByTelefono(telefono);

      if (existingUser) {
        console.log(`🔄 Actualizando admin: ${telefono}...`);
        await updateUser(existingUser.id, {
          password_hash,
          rol: 'admin',
          bloqueado: false
        });
        console.log(`✅ ${telefono} ahora es administrador.`);
      } else {
        console.log(`🆕 Creando admin: ${telefono}...`);
        const codigo_invitacion = Math.random().toString(36).slice(2, 10).toUpperCase();
        const newAdmin = {
          id: uuidv4(),
          telefono,
          nombre_usuario: `admin_${num}`,
          nombre_real: 'Administrador Oficial',
          password_hash,
          codigo_invitacion,
          invitado_por: null,
          nivel_id: defaultLevel.id,
          saldo_principal: 0,
          saldo_comisiones: 0,
          rol: 'admin',
          bloqueado: false,
          created_at: new Date().toISOString()
        };
        await createUser(newAdmin);
        console.log(`✅ ${telefono} creado como administrador.`);
      }
    }

    console.log('-----------------------------------');
    console.log('Configuración finalizada con éxito.');
    console.log('Credenciales para los 3 números:');
    console.log('Contraseña: admin123');
    console.log('-----------------------------------');

  } catch (error) {
    console.error('❌ Error configurando admins:', error.message);
  } finally {
    process.exit();
  }
}

setupAdmins();