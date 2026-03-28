import { Router } from 'express';
import { processTelegramUpdate } from '../lib/telegram_logic.js';

const router = Router();

// Ruta GET para verificar que el webhook es accesible desde el navegador
router.get('/', (req, res) => {
  res.send('✅ El endpoint del Webhook de Telegram está activo y listo para recibir señales.');
});

// Endpoint para recibir webhooks de Telegram
router.post('/', async (req, res) => {
  try {
    console.log('[Telegram Webhook] Received update');
    await processTelegramUpdate(req.body);
    res.status(200).send('OK');
  } catch (err) {
    console.error('Error in Telegram Webhook:', err);
    res.status(200).send('OK'); // Siempre responder 200 a Telegram
  }
});

export default router;
