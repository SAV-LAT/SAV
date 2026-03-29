import { getPublicContent, getAdminsInShift } from './queries.js';

const getRecargasConfig = async () => {
  const config = await getPublicContent();
  const adminsInShift = await getAdminsInShift();
  
  // Si hay admins en turno, priorizamos sus IDs personales de chat si los tienen,
  // pero según el requerimiento, enviamos al grupo pero solo si el admin está en turno.
  // Para simplificar y cumplir con "solo a él le llegue", si hay un admin en turno,
  // enviamos a su ID de Telegram personal si lo tenemos, de lo contrario al grupo.
  
  let targetChatId = config.telegram_recargas_chat_id || process.env.TELEGRAM_RECARGAS_CHAT_ID;
  
  if (adminsInShift.length > 0) {
    // Si hay admins en turno, enviamos a sus IDs personales concatenados por coma
    const adminIds = adminsInShift.map(a => a.telegram_user_id).filter(id => id);
    if (adminIds.length > 0) {
      targetChatId = adminIds.join(',');
    }
  }

  return {
    token: config.telegram_recargas_token || process.env.TELEGRAM_RECARGAS_TOKEN,
    chatId: targetChatId,
    enabled: config.telegram_recargas_enabled !== 'false'
  };
};

const getRetirosConfig = async () => {
  const config = await getPublicContent();
  const adminsInShift = await getAdminsInShift();
  
  let targetChatId = config.telegram_retiros_chat_id || process.env.TELEGRAM_RETIROS_CHAT_ID;
  
  if (adminsInShift.length > 0) {
    const adminIds = adminsInShift.map(a => a.telegram_user_id).filter(id => id);
    if (adminIds.length > 0) {
      targetChatId = adminIds.join(',');
    }
  }

  return {
    token: config.telegram_retiros_token || process.env.TELEGRAM_RETIROS_TOKEN,
    chatId: targetChatId,
    enabled: config.telegram_retiros_enabled !== 'false'
  };
};

async function send(token, chatId, text, replyMarkup = null) {
  if (!token || !chatId) {
    console.warn('[Telegram Lib] Missing token or chatId for text message');
    return;
  }

  const chatIds = String(chatId).split(',').map(id => id.trim()).filter(id => id);
  console.log(`[Telegram Lib] Sending text message to ${chatIds.length} recipients: ${chatIds.join(', ')}`);
  
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
      } else {
        console.log(`[Telegram Lib] Text message successfully sent to ${id}`);
      }
    } catch (err) {
      console.error(`[Telegram Lib] Exception sending to ${id}:`, err.message);
    }
  }
}

async function sendPhoto(token, chatId, base64Photo, caption = null, replyMarkup = null) {
  if (!token || !chatId || !base64Photo) {
    console.warn('[Telegram Lib] Missing data for photo message:', { token: !!token, chatId: !!chatId, photo: !!base64Photo });
    return;
  }

  const chatIds = String(chatId).split(',').map(id => id.trim()).filter(id => id);
  console.log(`[Telegram Lib] Sending photo to ${chatIds.length} recipients: ${chatIds.join(', ')}`);
  
  // Detectar MIME type y datos base64 reales
  let mimeType = 'image/jpeg';
  let extension = 'jpg';
  let base64Data = base64Photo;

  if (base64Photo.includes(';base64,')) {
    const parts = base64Photo.split(';base64,');
    mimeType = parts[0].split(':')[1];
    base64Data = parts[1];
    
    // Mapear extensiones comunes
    if (mimeType === 'image/png') extension = 'png';
    else if (mimeType === 'image/webp') extension = 'webp';
    else if (mimeType === 'image/gif') extension = 'gif';
  }

  const buffer = Buffer.from(base64Data, 'base64');
  console.log(`[Telegram Lib] Photo buffer created. Size: ${buffer.length} bytes. Type: ${mimeType}`);

  for (const id of chatIds) {
    const url = `https://api.telegram.org/bot${token}/sendPhoto`;
    try {
      const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
      
      // Añadir otros campos opcionales
      let middleParts = [];
      if (caption) {
        middleParts.push(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`);
        middleParts.push(`--${boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nHTML\r\n`);
      }
      if (replyMarkup) {
        middleParts.push(`--${boundary}\r\nContent-Disposition: form-data; name="reply_markup"\r\n\r\n${JSON.stringify(replyMarkup)}\r\n`);
      }
      const middleBuffer = Buffer.from(middleParts.join(''));
      const footerBuffer = Buffer.from(`\r\n--${boundary}--\r\n`);

      // Combinar todo en un solo Buffer para el cuerpo
      const bodyBuffer = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${id}\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="image.${extension}"\r\nContent-Type: ${mimeType}\r\n\r\n`),
        buffer,
        Buffer.from(`\r\n`),
        middleBuffer,
        footerBuffer
      ]);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: bodyBuffer
      });

      if (!res.ok) {
        const data = await res.json();
        console.error(`[Telegram Lib] Error sending photo to ${id}:`, data);
      } else {
        console.log(`[Telegram Lib] Photo successfully sent to ${id}`);
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
        { text: '🔒 Tomar Retiro', callback_data: `retiro_tomar_${id}` },
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
        { text: '🔒 Tomar Retiro', callback_data: `retiro_tomar_${id}` },
        { text: '❌ Rechazar', callback_data: `retiro_rechazar_${id}` }
      ]]
    };
    return sendPhoto(config.token, config.chatId, base64Photo, text, markup);
  },
};
