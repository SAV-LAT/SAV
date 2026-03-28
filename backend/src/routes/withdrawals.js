import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { findUserById, getRetirosByUser, createRetiro, getTarjetasByUser, getPublicContent, updateUser, boliviaTime } from '../lib/queries.js';
import { authenticate } from '../middleware/auth.js';
import { mergePublicContent } from '../data/publicContentDefaults.js';
import { isScheduleOpen } from '../lib/schedule.js';
import { telegram } from '../lib/telegram.js';

const router = Router();

const MONTOS = [25, 100, 500, 1500, 5000, 10000];

router.get('/montos', (req, res) => {
  res.json(MONTOS);
});

router.get('/', authenticate, async (req, res) => {
  try {
    const list = await getRetirosByUser(req.user.id);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tus retiros' });
  }
});

router.post('/', authenticate, async (req, res) => {
  const { monto, tipo_billetera, password_fondo, qr_retiro, tarjeta_id } = req.body;
  const config = await getPublicContent();
  const pc = mergePublicContent(config);
  const sched = isScheduleOpen(pc.horario_retiro);
  if (!sched.ok) {
    return res.status(400).json({
      error: `Intento de retiro fuera del horario: ${sched.message}`,
    });
  }
  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (!user.password_fondo_hash) return res.status(400).json({ error: 'Debes configurar la contraseña del fondo' });
  const ok = await bcrypt.compare(password_fondo || '', user.password_fondo_hash);
  if (!ok) return res.status(400).json({ error: 'La contraseña de fondos es incorrecta, por favor confirma' });
  if (!qr_retiro) return res.status(400).json({ error: 'Debes subir tu QR para el retiro' });

  // Validar un solo retiro por día (Horario Bolivia)
  const userWithdrawals = await getRetirosByUser(user.id);
  const todayStr = boliviaTime.todayStr();
  
  const hasWithdrawalToday = userWithdrawals.some(w => {
    return boliviaTime.getDateString(w.created_at) === todayStr;
  });

  if (hasWithdrawalToday) {
    return res.status(400).json({ error: 'Solo puedes realizar un retiro por día' });
  }

  const m = parseFloat(monto);
  if (!MONTOS.includes(m)) return res.status(400).json({ error: 'Monto no permitido' });
  
  const comision = m * 0.10;
  const montoARecibir = m - comision;
  
  const saldo = tipo_billetera === 'comisiones' ? (user.saldo_comisiones || 0) : (user.saldo_principal || 0);
  if (saldo < m) return res.status(400).json({ error: 'Saldo insuficiente' });
  
  const tarjetas = await getTarjetasByUser(user.id);
  if (tarjetas.length === 0) {
    return res.status(400).json({ error: 'Debes agregar al menos una cuenta bancaria en Seguridad de la cuenta' });
  }
  let tarjetaElegida = tarjetas[0];
  if (tarjeta_id) {
    tarjetaElegida = tarjetas.find((t) => t.id === tarjeta_id) || tarjetaElegida;
  }
  const retiro = {
    id: uuidv4(),
    usuario_id: user.id,
    tarjeta_id: tarjetaElegida?.id || null,
    monto: m,
    comision: comision,
    monto_a_recibir: montoARecibir,
    tipo_billetera: tipo_billetera || 'principal',
    qr_retiro: qr_retiro,
    estado: 'pendiente',
    created_at: boliviaTime.now().toISOString(),
  };
  await createRetiro(retiro);
  
  const updates = {};
  if (tipo_billetera === 'comisiones') updates.saldo_comisiones = user.saldo_comisiones - m;
  else updates.saldo_principal = user.saldo_principal - m;
  await updateUser(user.id, updates);

  // Notificar por Telegram (Bot de Retiros)
  const msg = `<b>💸 SOLICITUD DE RETIRO PENDIENTE</b>\n\n` +
    `<b>👤 Usuario:</b> ${user.nombre_usuario}\n` +
    `<b>📛 Nombre Real:</b> ${user.nombre_real || 'No especificado'}\n` +
    `<b>📱 Teléfono:</b> ${user.telefono || 'No disponible'}\n\n` +
    `<b>💰 MONTO SOLICITADO:</b> ${retiro.monto.toFixed(2)} BOB\n` +
    `<b>🧾 Comisión (10%):</b> -${retiro.comision.toFixed(2)} BOB\n` +
    `<b>💵 NETO A PAGAR:</b> <u>${retiro.monto_a_recibir.toFixed(2)} BOB</u>\n\n` +
    `<b>🏦 Banco/Billetera:</b> ${tarjetaElegida?.tipo || 'N/A'}\n` +
    `<b>👤 Titular:</b> ${tarjetaElegida?.nombre_banco || 'N/A'}\n` +
    `<b>🔢 Nro. Cuenta:</b> <code>${tarjetaElegida?.numero_masked || 'N/A'}</code>\n\n` +
    `<b>🕒 Fecha:</b> ${new Date(retiro.created_at).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}`;
  
  if (retiro.qr_retiro && retiro.qr_retiro.startsWith('data:image')) {
    telegram.sendRetiroConFoto(msg, retiro.qr_retiro, retiro.id).catch(console.error);
  } else {
    telegram.sendRetiro(msg, retiro.id).catch(console.error);
  }
  
  res.json(retiro);
});

export default router;
