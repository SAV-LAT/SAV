import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getMetodosQr, getRecargasByUser, createRecarga, getPublicContent, findUserById, getLevels } from '../lib/queries.js';
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
  const list = await getRecargasByUser(req.user.id);
  res.json(list);
});

router.post('/', authenticate, async (req, res) => {
  const { monto, metodo_qr_id, comprobante_url, modo } = req.body;
  const config = await getPublicContent();
  const pc = mergePublicContent(config);
  const sched = isScheduleOpen(pc.horario_recarga);
  if (!sched.ok) {
    return res.status(400).json({
      error: `Intento de recargar fuera del horario: ${sched.message}`,
    });
  }
  const user = await findUserById(req.user.id);
  // Validar requisitos para S4/S5 (20 subordinados S3)
  const nivelDestino = (await getLevels()).find(l => (l.deposito || l.costo) === parseFloat(monto));
  if (nivelDestino && ['S4', 'S5'].includes(nivelDestino.codigo)) {
    // Usar la configuración global del Admin
    if (pc.require_s3_subordinates !== false) {
      const { data: teamData } = await supabase.from('usuarios').select('nivel_id').eq('invitado_por', user.id);
      const levels = await getLevels();
      const s3Level = levels.find(l => l.codigo === 'S3');
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
    created_at: new Date().toISOString(),
  };
  await createRecarga(recarga);

  console.log(`[Recharge] New recharge created: ${recarga.id} for user: ${user?.nombre_usuario}`);

  // Notificar por Telegram (Bot de Recargas)
  const msg = `🔔 Nueva Recarga Pendiente\n\n` +
    `👤 Usuario: ${user?.nombre_usuario || req.user.id}\n` +
    `📛 Nombre Real: ${user?.nombre_real || 'No especificado'}\n` +
    `📱 Teléfono: ${user?.telefono || 'No disponible'}\n` +
    `💰 Monto: ${recarga.monto} BOB\n` +
    `🛠 Modo: ${recarga.modo}\n` +
    `🕒 Fecha: ${new Date(recarga.created_at).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}`;
  
  if (recarga.comprobante_url && recarga.comprobante_url.startsWith('data:image')) {
    console.log(`[Recharge] Sending Telegram with photo for ${recarga.id}`);
    telegram.sendRecargaConFoto(msg, recarga.comprobante_url, recarga.id).catch(err => {
      console.error(`[Recharge] Telegram sendPhoto error:`, err);
    });
  } else {
    console.log(`[Recharge] Sending Telegram text only for ${recarga.id}`);
    telegram.sendRecarga(msg, recarga.id).catch(err => {
      console.error(`[Recharge] Telegram send error:`, err);
    });
  }

  res.json(recarga);
});

export default router;
