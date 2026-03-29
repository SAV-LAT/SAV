import { 
  getRecargaById, updateRecarga, 
  getRetiroById, updateRetiro, 
  findUserById, updateUser,
  getLevels, handleLevelUpRewards,
  createMovimiento, boliviaTime,
  findAdminByTelegramId, getDailyWithdrawalSummary
} from './queries.js';

export async function processTelegramUpdate(update) {
  const { callback_query, message: incomingMessage } = update;
  
  // 1. Manejo de comandos (Resumen Diario)
  if (incomingMessage && incomingMessage.text?.startsWith('/resumen')) {
    return handleDailySummary(incomingMessage);
  }

  if (!callback_query) return;

  const { data, message, id: callbackQueryId, from: telegramUser } = callback_query;
  const chatId = message.chat.id;
  const messageId = message.message_id;

  try {
    const parts = data.split('_');
    const type = parts[0];
    const action = parts[1];
    const id = parts.slice(2).join('_');

    // 2. VALIDACIÓN DE ADMINISTRADOR
    const admin = await findAdminByTelegramId(telegramUser.id);
    if (!admin) {
      return answerCallback(callbackQueryId, '❌ No tienes permisos para realizar esta acción.');
    }

    const adminName = admin.nombre;

    // --- MÓDULO DE RETIROS ---
    if (type === 'retiro') {
      const retiro = await getRetiroById(id);
      if (!retiro) return answerCallback(callbackQueryId, 'Retiro no encontrado.');

      // ACCIÓN: TOMAR RETIRO
      if (action === 'tomar') {
        if (retiro.estado !== 'pendiente') {
          const taker = retiro.taken_by_admin_name || 'otro administrador';
          return answerCallback(callbackQueryId, `⚠️ Este retiro ya está siendo ejecutado por ${taker}.`);
        }

        await updateRetiro(id, { 
          estado: 'en_proceso',
          taken_by_admin_id: admin.id,
          taken_by_admin_name: adminName,
          taken_at: new Date().toISOString(),
          telegram_message_id: String(messageId),
          telegram_chat_id: String(chatId)
        });

        const statusMsg = `⏳ EN PROCESO\n👤 Tomado por: ${adminName}\n🕒 Hora: ${new Date().toLocaleTimeString('es-BO', { timeZone: 'America/La_Paz' })}`;
        const buttons = {
          inline_keyboard: [[
            { text: '✅ Marcar como Pagado', callback_data: `retiro_pagar_${id}` },
            { text: '❌ Rechazar', callback_data: `retiro_rechazar_${id}` }
          ]]
        };
        
        await editTelegramMessage(chatId, messageId, message.text || message.caption, statusMsg, buttons);
        return answerCallback(callbackQueryId, '✅ Retiro asignado. Procede con el pago.');
      }

      // ACCIÓN: PAGAR O RECHAZAR
      if (action === 'pagar' || action === 'rechazar') {
        // VALIDACIÓN: Solo el admin que tomó el retiro
        if (retiro.taken_by_admin_id && retiro.taken_by_admin_id !== admin.id) {
          return answerCallback(callbackQueryId, `⚠️ Solo ${retiro.taken_by_admin_name} puede finalizar este retiro.`);
        }

        if (action === 'pagar') {
          await updateRetiro(id, { 
            estado: 'pagado',
            processed_by_admin_id: admin.id,
            processed_by_admin_name: adminName,
            processed_at: new Date().toISOString()
          });
          await editTelegramMessage(chatId, messageId, message.text || message.caption, `✅ PAGADO por ${adminName}`);
        } else {
          const user = await findUserById(retiro.usuario_id);
          const updates = {};
          if (retiro.tipo_billetera === 'comisiones') {
            updates.saldo_comisiones = (Number(user.saldo_comisiones) || 0) + Number(retiro.monto);
          } else {
            updates.saldo_principal = (Number(user.saldo_principal) || 0) + Number(retiro.monto);
          }
          await updateRetiro(id, { 
            estado: 'rechazado',
            rejected_by_admin_id: admin.id,
            rejected_at: new Date().toISOString()
          });
          await updateUser(user.id, updates);
          await editTelegramMessage(chatId, messageId, message.text || message.caption, `❌ RECHAZADO por ${adminName} (Saldo devuelto)`);
        }
        return answerCallback(callbackQueryId, 'Operación finalizada.');
      }
    }

    // --- MÓDULO DE RECARGAS ---
    if (type === 'recarga') {
      const recarga = await getRecargaById(id);
      if (!recarga || (recarga.estado !== 'pendiente' && recarga.estado !== 'pendiente_ascenso')) {
        return answerCallback(callbackQueryId, 'Esta solicitud ya no está pendiente.');
      }

      if (action === 'aprobar') {
        const user = await findUserById(recarga.usuario_id);
        const niveles = await getLevels();
        const nivelDestino = niveles.find(n => (n.deposito || n.costo) === recarga.monto);
        const nivelActual = niveles.find(n => n.id === user.nivel_id);

        if (recarga.modo === 'Compra VIP' && nivelDestino) {
          const updates = { nivel_id: nivelDestino.id };
          if (nivelActual && (nivelActual.deposito > 0 || nivelActual.costo > 0)) {
            const montoADevolver = nivelActual.deposito || nivelActual.costo;
            updates.saldo_comisiones = Number((Number(user.saldo_comisiones || 0) + montoADevolver).toFixed(2));
            await createMovimiento({
              usuario_id: user.id,
              tipo_movimiento: 'ajuste_admin',
              monto: montoADevolver,
              descripcion: `Reembolso de inversión anterior (${nivelActual.nombre}) por ascenso`,
              referencia: `REF-${id.substring(0,8)}`,
              fecha: boliviaTime.now().toISOString()
            });
          }
          await updateUser(user.id, updates);
          await updateRecarga(id, { 
            estado: 'aprobada', 
            procesado_por_admin_id: admin.id, 
            procesado_por_admin_name: adminName,
            procesado_at: new Date().toISOString() 
          });
          await handleLevelUpRewards(user.id, user.nivel_id, nivelDestino.id);
          await editTelegramMessage(chatId, messageId, message.text || message.caption, `✅ Ascenso Aprobado por ${adminName} a ${nivelDestino.nombre}`);
        } else {
          await createMovimiento({
            usuario_id: user.id,
            tipo_movimiento: 'ajuste_admin',
            monto: recarga.monto,
            descripcion: `Recarga de saldo aprobada`,
            referencia: `REC-${id.substring(0,8)}`,
            fecha: boliviaTime.now().toISOString()
          });
          const nuevoSaldo = Number((Number(user.saldo_principal || 0) + recarga.monto).toFixed(2));
          await updateUser(user.id, { saldo_principal: nuevoSaldo });
          await updateRecarga(id, { 
            estado: 'aprobada', 
            procesado_por_admin_id: admin.id, 
            procesado_por_admin_name: adminName,
            procesado_at: new Date().toISOString() 
          });
          await editTelegramMessage(chatId, messageId, message.text || message.caption, `✅ Recarga Aprobada por ${adminName}`);
        }
      } else {
        await updateRecarga(id, { 
          estado: 'rechazada', 
          procesado_por_admin_id: admin.id, 
          procesado_por_admin_name: adminName,
          procesado_at: new Date().toISOString() 
        });
        await editTelegramMessage(chatId, messageId, message.text || message.caption, `❌ Rechazada por ${adminName}`);
      }
      await answerCallback(callbackQueryId, 'Operación procesada.');
    }
  } catch (err) {
    console.error('Error in processTelegramUpdate:', err);
  }
}

async function handleDailySummary(message) {
  const admin = await findAdminByTelegramId(message.from.id);
  if (!admin) return;

  const token = process.env.TELEGRAM_RETIROS_TOKEN;
  if (!token) return;

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' });
  const summary = await getDailyWithdrawalSummary(today);

  let text = `<b>📊 RESUMEN DIARIO DE RETIROS (${today})</b>\n\n`;

  if (summary.length === 0) {
    text += "No se procesaron retiros el día de hoy.";
  } else {
    let grandTotal = 0;
    summary.forEach(s => {
      text += `👤 <b>${s.name}</b>\n`;
      text += `   - Cantidad: ${s.count} retiros\n`;
      text += `   - Total: ${s.total.toFixed(2)} BOB\n\n`;
      grandTotal += s.total;
    });
    text += `💰 <b>TOTAL GENERAL: ${grandTotal.toFixed(2)} BOB</b>`;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: message.chat.id,
      text: text,
      parse_mode: 'HTML'
    })
  });
}

async function editTelegramMessage(chatId, messageId, oldText, statusText, replyMarkup = { inline_keyboard: [] }) {
  const tokens = [process.env.TELEGRAM_RECARGAS_TOKEN, process.env.TELEGRAM_RETIROS_TOKEN];
  const newText = `${oldText}\n\n📢 <b>${statusText}</b>`;

  for (const token of tokens) {
    if (!token) continue;
    const urlText = `https://api.telegram.org/bot${token}/editMessageText`;
    try {
      const res = await fetch(urlText, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: newText,
          parse_mode: 'HTML',
          reply_markup: replyMarkup
        })
      });

      if (!res.ok) {
        const urlCaption = `https://api.telegram.org/bot${token}/editMessageCaption`;
        await fetch(urlCaption, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            caption: newText,
            parse_mode: 'HTML',
            reply_markup: replyMarkup
          })
        });
      }
    } catch (e) {}
  }
}

async function answerCallback(callbackQueryId, text) {
  const tokens = [process.env.TELEGRAM_RECARGAS_TOKEN, process.env.TELEGRAM_RETIROS_TOKEN];
  for (const token of tokens) {
    if (!token) continue;
    try {
      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text,
          show_alert: false
        })
      });
    } catch (e) {}
  }
}
