import { getPublicContent } from './queries.js';

const getRecargasConfig = async () => {
  const config = await getPublicContent();
  return {
    token: config.telegram_recargas_token || process.env.TELEGRAM_RECARGAS_TOKEN,
    chatId: config.telegram_recargas_chat_id || process.env.TELEGRAM_RECARGAS_CHAT_ID,
    enabled: config.telegram_recargas_enabled !== 'false'
  };
};

const getRetirosConfig = async () => {
  const config = await getPublicContent();
  return {
    token: config.telegram_retiros_token || process.env.TELEGRAM_RETIROS_TOKEN,
    chatId: config.telegram_retiros_chat_id || process.env.TELEGRAM_RETIROS_CHAT_ID,
    enabled: config.telegram_retiros_enabled !== 'false'
  };
};

async function send(token, chatId, text, replyMarkup = null) {
  if (!token || !chatId) return;

  const chatIds = String(chatId).split(',').map(id => id.trim()).filter(id => id);
  
  for (const id of chatIds) {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
      const body = {
        chat_id: id,
        text,
        parse_mode: 'HTML'
      };
      if (replyMarkup) body.reply_markup = replyMarkup;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const data = await res.json();
        console.error(`[Telegram Lib] Error sending message to ${id}:`, data);
      }
    } catch (err) {
      console.error(`[Telegram Lib] Exception sending to ${id}:`, err.message);
    }
  }
}

async function sendPhoto(token, chatId, base64Photo, caption = null, replyMarkup = null) {
  if (!token || !chatId || !base64Photo) return;

  const chatIds = String(chatId).split(',').map(id => id.trim()).filter(id => id);
  const base64Data = base64Photo.split(',')[1] || base64Photo;
  const buffer = Buffer.from(base64Data, 'base64');

  for (const id of chatIds) {
    const url = `https://api.telegram.org/bot${token}/sendPhoto`;
    try {
      const formData = new FormData();
      formData.append('chat_id', id);
      
      const blob = new Blob([buffer], { type: 'image/jpeg' });
      formData.append('photo', blob, 'image.jpg');

      if (caption) {
        formData.append('caption', caption);
        formData.append('parse_mode', 'HTML');
      }
      if (replyMarkup) formData.append('reply_markup', JSON.stringify(replyMarkup));

      const res = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        console.error(`[Telegram Lib] Error sending photo to ${id}:`, data);
      }
    } catch (err) {
      console.error(`[Telegram Lib] Exception sending photo to ${id}:`, err.message);
    }
  }
}

export const telegram = {
  sendRecarga: async (text, id) => {
    const config = await getRecargasConfig();
    if (!config.enabled) return;
    const markup = {
      inline_keyboard: [[
        { text: '✅ Aceptar', callback_data: `recarga_aprobar_${id}` },
        { text: '❌ Rechazar', callback_data: `recarga_rechazar_${id}` }
      ]]
    };
    return send(config.token, config.chatId, text, markup);
  },
  sendRecargaConFoto: async (text, base64Photo, id) => {
    const config = await getRecargasConfig();
    if (!config.enabled) return;
    const markup = {
      inline_keyboard: [[
        { text: '✅ Aceptar', callback_data: `recarga_aprobar_${id}` },
        { text: '❌ Rechazar', callback_data: `recarga_rechazar_${id}` }
      ]]
    };
    return sendPhoto(config.token, config.chatId, base64Photo, text, markup);
  },
  sendRetiro: async (text, id) => {
    const config = await getRetirosConfig();
    if (!config.enabled) return;
    const markup = {
      inline_keyboard: [[
        { text: '✅ Aceptar', callback_data: `retiro_aprobar_${id}` },
        { text: '❌ Rechazar', callback_data: `retiro_rechazar_${id}` }
      ]]
    };
    return send(config.token, config.chatId, text, markup);
  },
  sendRetiroConFoto: async (text, base64Photo, id) => {
    const config = await getRetirosConfig();
    if (!config.enabled) return;
    const markup = {
      inline_keyboard: [[
        { text: '✅ Aceptar', callback_data: `retiro_aprobar_${id}` },
        { text: '❌ Rechazar', callback_data: `retiro_rechazar_${id}` }
      ]]
    };
    return sendPhoto(config.token, config.chatId, base64Photo, text, markup);
  },
};
