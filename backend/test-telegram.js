import 'dotenv/config';

// fetch es global en Node 18+

const config = {
  recargas: {
    token: process.env.TELEGRAM_RECARGAS_TOKEN,
    chatId: process.env.TELEGRAM_RECARGAS_CHAT_ID
  },
  retiros: {
    token: process.env.TELEGRAM_RETIROS_TOKEN,
    chatId: process.env.TELEGRAM_RETIROS_CHAT_ID
  }
};

async function testBot(name, token, chatId) {
  console.log(`--- Probando ${name} ---`);
  console.log(`Token: ${token ? token.substring(0, 10) + '...' : 'FALTA'}`);
  console.log(`Chat ID: ${chatId || 'FALTA'}`);

  if (!token || !chatId) {
    console.error(`ERROR: Configuración incompleta para ${name}`);
    return;
  }

  const url = `https://api.telegram.org/bot${token}/getMe`;
  try {
    const resMe = await fetch(url);
    const dataMe = await resMe.json();
    if (dataMe.ok) {
      console.log(`✅ Bot ${name} identificado: @${dataMe.result.username}`);
      
      const sendUrl = `https://api.telegram.org/bot${token}/sendMessage`;
      const resMsg = await fetch(sendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🧪 *TEST DE SAV*\nEste es un mensaje de prueba para verificar que el bot de ${name} está funcionando correctamente.`,
          parse_mode: 'Markdown'
        })
      });
      
      const dataMsg = await resMsg.json();
      if (dataMsg.ok) {
        console.log(`✅ Mensaje de ${name} enviado con éxito.`);
      } else {
        console.error(`❌ Error al enviar mensaje de ${name}:`, dataMsg.description);
        if (dataMsg.description.includes('chat not found')) {
          console.error(`💡 CONSEJO: Asegúrate de haber iniciado el bot enviándole un mensaje o el comando /start.`);
        }
      }
    } else {
      console.error(`❌ El token de ${name} parece inválido:`, dataMe.description);
    }
  } catch (err) {
    console.error(`❌ Error de red probando ${name}:`, err.message);
  }
}

async function runTests() {
  await testBot('RECARGAS', config.recargas.token, config.recargas.chatId);
  console.log('');
  await testBot('RETIROS', config.retiros.token, config.retiros.chatId);
}

runTests();
