import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getMetodosQr, getRecargasByUser, createRecarga, getPublicContent, findUserById, getLevels, boliviaTime } from '../lib/queries.js';
import { supabase } from '../lib/db.js';
import { authenticate } from '../middleware/auth.js';
import { mergePublicContent } from '../data/publicContentDefaults.js';
import { isScheduleOpen } from '../lib/schedule.js';
import { telegram } from '../lib/telegram.js';

const router = Router();

router.get('/metodos', async (req, res) => {
  const metodos = await getMetodosQr();
  res.json(metodos.map(m => ({ id: m.id, nombre_titular: m.nombre_titular, imagen_qr_url: m.imagen_qr_url, imagen_base64: m.imagen_base64 })));
});

router.get('/', authenticate, async (req, res) => {
  try {
    const list = await getRecargasByUser(req.user.id);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tus recargas' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { monto, metodo_qr_id, comprobante_url, modo } = req.body;
    
    if (!monto || isNaN(parseFloat(monto))) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    const config = await getPublicContent();
    const pc = mergePublicContent(config);
    const sched = isScheduleOpen(pc.horario_recarga);
    if (!sched.ok) {
      return res.status(400).json({
        error: `Intento de recargar fuera del horario: ${sched.message}`,
      });
    }
    const user = await findUserById(req.user.id);

    // --- RESTRICCIÓN DE MÁXIMO 3 RECARGAS AL DÍA ---
    try {
      const userRecargas = await getRecargasByUser(req.user.id);
      const todayStr = boliviaTime.todayStr();
      const recargasHoy = userRecargas.filter(r => boliviaTime.getDateString(r.created_at) === todayStr);
      
      if (recargasHoy.length >= 3) {
        return res.status(429).json({ 
          error: 'Has alcanzado el límite máximo de 3 solicitudes de recarga por día. Por favor, vuelve a intentarlo mañana.',
          limit_reached: true
        });
      }
    } catch (err) {
      console.error('[Recharge] Error al validar límite diario:', err);
    }

    // Validar requisitos para S4/S5 (20 subordinados S3)
    const niveles = await getLevels();
    const nivelDestino = niveles.find(l => (l.deposito || l.costo) === parseFloat(monto));
    if (nivelDestino && ['S4', 'S5'].includes(nivelDestino.codigo)) {
      // Usar la configuración global del Admin
      if (pc.require_s3_subordinates !== false) {
        const { data: teamData } = await supabase.from('usuarios').select('nivel_id').eq('invitado_por', user.id);
        const s3Level = niveles.find(l => l.codigo === 'S3');
        const s3Count = (teamData || []).filter(u => String(u.nivel_id) === String(s3Level?.id)).length;
        
        if (s3Count < 20) {
          return res.status(400).json({ error: `Para ascender a ${nivelDestino.nombre} necesitas al menos 20 subordinados de nivel S3. Actualmente tienes ${s3Count}.` });
        }
      }
    }

    const recarga = {
      id: uuidv4(),
      usuario_id: req.user.id,
      metodo_qr_id: metodo_qr_id || null,
      monto: parseFloat(monto) || 0,
      comprobante_url: comprobante_url || '',
      modo: modo || 'Compra VIP',
      estado: 'pendiente',
      created_at: boliviaTime.now().toISOString(),
    };
    
    console.log(`[Recharge] Creating recharge for ${user?.nombre_usuario} - Amount: ${recarga.monto}`);
    const startDb = Date.now();
    await createRecarga(recarga);
    console.log(`[Recharge] Recharge created in DB in ${Date.now() - startDb}ms: ${recarga.id}`);

    // Responder inmediatamente al cliente para evitar timeouts, 
    // y procesar las notificaciones en segundo plano.
    res.json(recarga);

    // Notificar por Telegram (Bot de Recargas) en segundo plano
    (async () => {
      try {
        const msg = `<b>🔔 NUEVA RECARGA PENDIENTE</b>\n\n` +
          `<b>👤 Usuario:</b> ${user?.nombre_usuario || req.user.id}\n` +
          `<b>📛 Nombre Real:</b> ${user?.nombre_real || 'No especificado'}\n` +
          `<b>📱 Teléfono:</b> ${user?.telefono || 'No disponible'}\n\n` +
          `<b>💰 MONTO:</b> <u>${recarga.monto.toFixed(2)} BOB</u>\n` +
          `<b>🛠 MODO:</b> ${recarga.modo}\n\n` +
          `<b>🕒 Fecha:</b> ${new Date(recarga.created_at).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}`;
        
        if (recarga.comprobante_url && recarga.comprobante_url.startsWith('data:image')) {
          console.log(`[Recharge] Sending Telegram with photo for ${recarga.id}`);
          await telegram.sendRecargaConFoto(msg, recarga.comprobante_url, recarga.id);
          console.log(`[Recharge] Telegram with photo sent for ${recarga.id}`);
        } else {
          console.log(`[Recharge] Sending Telegram text only for ${recarga.id}`);
          await telegram.sendRecarga(msg, recarga.id);
          console.log(`[Recharge] Telegram text sent for ${recarga.id}`);
        }
      } catch (tgErr) {
        console.error(`[Recharge] Error en notificación de Telegram:`, tgErr);
      }
    })();
  } catch (err) {
    console.error('[Recharge] Error fatal en POST /:', err);
    res.status(500).json({ error: 'Error interno al procesar la recarga' });
  }
});

export default router;
