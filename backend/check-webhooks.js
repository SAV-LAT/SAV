import 'dotenv/config';

async function checkWebhooks() {
  const bots = [
    { name: 'RECARGAS', token: process.env.TELEGRAM_RECARGAS_TOKEN },
    { name: 'RETIROS', token: process.env.TELEGRAM_RETIROS_TOKEN }
  ];

  for (const bot of bots) {
    if (!bot.token) {
      console.log(`❌ Bot ${bot.name}: Token no encontrado en .env`);
      continue;
    }

    const url = `https://api.telegram.org/bot${bot.token}/getWebhookInfo`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log(`--- Estado del Webhook para ${bot.name} ---`);
      if (data.ok) {
        console.log(`URL actual: ${data.result.url || 'Ninguna'}`);
        console.log(`Errores pendientes: ${data.result.pending_update_count || 0}`);
        if (data.result.last_error_message) {
          console.log(`Último error: ${data.result.last_error_message}`);
        }
      } else {
        console.log(`❌ Error al obtener info de Telegram: ${data.description}`);
      }
    } catch (err) {
      console.log(`❌ Error de red: ${err.message}`);
    }
    console.log('');
  }
}

checkWebhooks();
