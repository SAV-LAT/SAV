import 'dotenv/config';

const tokens = [
  { name: 'Recargas', token: process.env.TELEGRAM_RECARGAS_TOKEN },
  { name: 'Retiros', token: process.env.TELEGRAM_RETIROS_TOKEN }
];

async function checkBots() {
  console.log('--- DIAGNÓSTICO DE BOTS DE TELEGRAM ---');
  
  for (const { name, token } of tokens) {
    if (!token) {
      console.error(`[${name}] ERROR: No hay token configurado.`);
      continue;
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await res.json();
      
      if (data.ok) {
        console.log(`[${name}] ✅ Bot detectado: @${data.result.username} (${data.result.first_name})`);
        
        // Intentar ver si hay mensajes para sacar el Chat ID
        const resUpd = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
        const dataUpd = await resUpd.json();
        
        if (dataUpd.ok && dataUpd.result.length > 0) {
          const lastMsg = dataUpd.result[dataUpd.result.length - 1];
          const chatId = lastMsg.message?.chat?.id || lastMsg.callback_query?.message?.chat?.id;
          const fromName = lastMsg.message?.from?.first_name || lastMsg.callback_query?.from?.first_name;
          console.log(`[${name}] 💡 Última interacción detectada de: ${fromName} (Chat ID: ${chatId})`);
          console.log(`[${name}] Sugerencia: Usa ese Chat ID en tu configuración.`);
        } else {
          console.log(`[${name}] ℹ️ No hay interacciones recientes. Envía un mensaje al bot primero.`);
        }
      } else {
        console.error(`[${name}] ❌ Token inválido o bot no encontrado.`);
      }
    } catch (err) {
      console.error(`[${name}] ❌ Error de red:`, err.message);
    }
  }
  console.log('---------------------------------------');
}

checkBots();
