const getRecargasConfig = () => ({
  token: process.env.TELEGRAM_RECARGAS_TOKEN,
  chatId: process.env.TELEGRAM_RECARGAS_CHAT_ID
});

const getRetirosConfig = () => ({
  token: process.env.TELEGRAM_RETIROS_TOKEN,
  chatId: process.env.TELEGRAM_RETIROS_CHAT_ID
});

async function send(token, chatId, text, replyMarkup = null) {
  if (!token || !chatId) {
    console.error('[Telegram Lib] Missing token or chatId.');
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const body = {
      chat_id: chatId,
      text
    };
    if (replyMarkup) body.reply_markup = replyMarkup;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('[Telegram Lib] Error sending message:', data);
    } else {
      console.log('[Telegram Lib] Text message sent successfully.');
    }
  } catch (err) {
    console.error('[Telegram Lib] Exception in send():', err.message);
  }
}

async function sendPhoto(token, chatId, base64Photo, caption = null, replyMarkup = null) {
  if (!token || !chatId || !base64Photo) return;

  const url = `https://api.telegram.org/bot${token}/sendPhoto`;
  
  try {
    const base64Data = base64Photo.split(',')[1] || base64Photo;
    const buffer = Buffer.from(base64Data, 'base64');
    
    const formData = new FormData();
    formData.append('chat_id', chatId);
    
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    formData.append('photo', blob, 'image.jpg');

    if (caption) formData.append('caption', caption);
    if (replyMarkup) formData.append('reply_markup', JSON.stringify(replyMarkup));

    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[Telegram Lib] Error sending photo:', data);
    } else {
      console.log('[Telegram Lib] Photo with caption sent successfully.');
    }
  } catch (err) {
    console.error('[Telegram Lib] Exception in sendPhoto():', err.message);
  }
}

export const telegram = {
  sendRecarga: (text, id) => {
    const config = getRecargasConfig();
    const markup = {
      inline_keyboard: [[
        { text: '✅ Aceptar', callback_data: `recarga_aprobar_${id}` },
        { text: '❌ Rechazar', callback_data: `recarga_rechazar_${id}` }
      ]]
    };
    return send(config.token, config.chatId, text, markup);
  },
  sendRecargaConFoto: async (text, base64Photo, id) => {
    const config = getRecargasConfig();
    const markup = {
      inline_keyboard: [[
        { text: '✅ Aceptar', callback_data: `recarga_aprobar_${id}` },
        { text: '❌ Rechazar', callback_data: `recarga_rechazar_${id}` }
      ]]
    };
    // Unificado: Enviamos la foto con el texto como caption y los botones
    return sendPhoto(config.token, config.chatId, base64Photo, text, markup);
  },
  sendRetiro: (text, id) => {
    const config = getRetirosConfig();
    const markup = {
      inline_keyboard: [[
        { text: '✅ Aceptar', callback_data: `retiro_aprobar_${id}` },
        { text: '❌ Rechazar', callback_data: `retiro_rechazar_${id}` }
      ]]
    };
    return send(config.token, config.chatId, text, markup);
  },
  sendRetiroConFoto: async (text, base64Photo, id) => {
    const config = getRetirosConfig();
    const markup = {
      inline_keyboard: [[
        { text: '✅ Aceptar', callback_data: `retiro_aprobar_${id}` },
        { text: '❌ Rechazar', callback_data: `retiro_rechazar_${id}` }
      ]]
    };
    // Unificado: Enviamos la foto (QR) con el texto como caption y los botones
    return sendPhoto(config.token, config.chatId, base64Photo, text, markup);
  },
};
