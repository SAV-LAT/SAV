import 'dotenv/config';
import { telegram } from './lib/telegram.js';

async function sendTest() {
  console.log('Enviando notificaciones de prueba a Telegram...');
  
  try {
    await telegram.sendRecarga('<b>🧪 PRUEBA DE RECARGA</b>\nEsto es un mensaje de prueba para verificar los botones.', 'test_id_123');
    console.log('✅ Notificación de Recarga enviada.');
    
    await telegram.sendRetiro('<b>🧪 PRUEBA DE RETIRO</b>\nEsto es un mensaje de prueba para verificar los botones.', 'test_id_456');
    console.log('✅ Notificación de Retiro enviada.');
    
    console.log('\nSi recibiste los mensajes, ¡la configuración es correcta!');
  } catch (err) {
    console.error('❌ Error enviando prueba:', err.message);
  }
}

sendTest();
