import { getPublicContent } from './queries.js';
import { processTelegramUpdate } from './telegram_logic.js';

let pollingActive = false;
let lastUpdateIds = new Map(); // token -> lastUpdateId

async function getUpdates(token) {
  if (!token) return [];
  const lastId = lastUpdateIds.get(token) || 0;
  const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastId + 1}&timeout=30`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.ok ? data.result : [];
  } catch (err) {
    console.error(`[Telegram Polling] Error fetching updates for ${token.substring(0, 10)}...:`, err.message);
    return [];
  }
}

export async function startTelegramPolling() {
  if (pollingActive) return;
  pollingActive = true;
  console.log('[Telegram Polling] Polling system started.');

  const poll = async () => {
    try {
      const config = await getPublicContent();
      const tokens = [
        config.telegram_recargas_token || process.env.TELEGRAM_RECARGAS_TOKEN,
        config.telegram_retiros_token || process.env.TELEGRAM_RETIROS_TOKEN
      ].filter(t => t && t.includes(':')); // Validar que parezca un token

      for (const token of tokens) {
        const updates = await getUpdates(token);
        for (const update of updates) {
          lastUpdateIds.set(token, update.update_id);
          await processTelegramUpdate(update);
        }
      }
    } catch (err) {
      console.error('[Telegram Polling] Critical error in poll loop:', err);
    }
    
    // Esperar 2 segundos antes de la siguiente vuelta
    if (pollingActive) {
      setTimeout(poll, 2000);
    }
  };

  poll();
}

export function stopTelegramPolling() {
  pollingActive = false;
  console.log('[Telegram Polling] Polling system stopped.');
}
