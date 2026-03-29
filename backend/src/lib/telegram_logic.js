import { 
  getRecargaById, updateRecarga, 
  getRetiroById, updateRetiro, 
  findUserById, updateUser,
  getLevels, handleLevelUpRewards,
  createMovimiento, boliviaTime,
  findAdminByTelegramId, linkAdminTelegram
} from './queries.js';

export async function processTelegramUpdate(update) {
  const { callback_query, message: incomingMessage } = update;
  
  // Manejo de comandos para vincular admins
  if (incomingMessage && incomingMessage.text?.startsWith('/vincular_admin_')) {
    return handleLinkAdmin(incomingMessage);
  }

  if (incomingMessage && incomingMessage.text?.startsWith('/resumen_retiros')) {
    return handleDailySummary(incomingMessage);
  }

  if (!callback_query) return;

  const { data, message, id: callbackQueryId, from: telegramUser } = callback_query;
  const chatId = message.chat.id;
  const messageId = message.message_id;

  console.log(`[Telegram Logic] Button clicked! Data: ${data}, From: ${telegramUser.username || telegramUser.id}`);

  try {
    const parts = data.split('_'); // ej: retiro_tomar_uuid
    const type = parts[0];
    const action = parts[1];
    const id = parts.slice(2).join('_');

    // 1. Identificar al administrador por su Telegram ID
    let admin = await findAdminByTelegramId(telegramUser.id);
    
    // Si no está vinculado, permitir que proceda pero avisar (solo si es el primer admin que interactúa)
    // Esto es temporal hasta que todos se vinculen
    const adminName = admin ? (admin.nombre_real || admin.nombre_usuario) : (telegramUser.first_name || telegramUser.username || String(telegramUser.id));

    if (type === 'retiro') {
      const retiro = await getRetiroById(id);
      if (!retiro) return answerCallback(callbackQueryId, 'Retiro no encontrado.');

      // Lógica de Concurrencia y Bloqueo
      if (action === 'tomar') {
        if (retiro.estado !== 'pendiente') {
          const taker = retiro.taken_by_admin_name || 'otro administrador';
          return answerCallback(callbackQueryId, `Este retiro ya fue tomado por ${taker}.`);
        }

        // Marcar como en proceso
        await updateRetiro(id, { 
          estado: 'en_proceso',
          taken_by_admin_id: admin?.id || null,
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
        return answerCallback(callbackQueryId, 'Has tomado este retiro. Procésalo pronto.');
      }

      if (action === 'pagar' || action === 'rechazar') {
        // Validar que solo el que lo tomó pueda finalizarlo (si hay trazabilidad)
        if (retiro.taken_by_admin_name && retiro.taken_by_admin_name !== adminName) {
          return answerCallback(callbackQueryId, `Solo ${retiro.taken_by_admin_name} puede finalizar este retiro.`);
        }

        if (action === 'pagar') {
          await updateRetiro(id, { 
            estado: 'pagado',
            procesado_por: admin?.id || null,
            processed_by_admin_name: adminName,
            procesado_at: new Date().toISOString()
          });
          await editTelegramMessage(chatId, messageId, message.text || message.caption, `✅ PAGADO por ${adminName}`);
        } else {
          const user = await findUserById(retiro.usuario_id);
          const updates = {};
          if (retiro.tipo_billetera === 'comisiones') {
            updates.saldo_comisiones = (user.saldo_comisiones || 0) + retiro.monto;
          } else {
            updates.saldo_principal = (user.saldo_principal || 0) + retiro.monto;
          }
          await updateRetiro(id, { 
            estado: 'rechazado',
            rejected_by_admin_id: admin?.id || null,
            rejected_at: new Date().toISOString()
          });
          await updateUser(user.id, updates);
          await editTelegramMessage(chatId, messageId, message.text || message.caption, `❌ RECHAZADO por ${adminName} (Saldo devuelto)`);
        }
        return answerCallback(callbackQueryId, 'Operación finalizada.');
      }
    }

    // Lógica para Recargas (Mantenemos la actual pero con trazabilidad)
    if (type === 'recarga') {
      const recarga = await getRecargaById(id);
      if (!recarga || (recarga.estado !== 'pendiente' && recarga.estado !== 'pendiente_ascenso')) {
        return answerCallback(callbackQueryId, 'Esta solicitud ya no está pendiente.');
      }

      if (action === 'aprobar') {
        console.log(`[Telegram Logic] Approving recharge/level-up ${id} (Mode: ${recarga.modo})`);
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
          await updateRecarga(id, { estado: 'aprobada', procesado_por: admin?.id || null, procesado_at: new Date().toISOString() });
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
          await updateRecarga(id, { estado: 'aprobada', procesado_por: admin?.id || null, procesado_at: new Date().toISOString() });
          await editTelegramMessage(chatId, messageId, message.text || message.caption, `✅ Recarga Aprobada por ${adminName}`);
        }
      } else {
        await updateRecarga(id, { estado: 'rechazada', procesado_por: admin?.id || null, procesado_at: new Date().toISOString() });
        await editTelegramMessage(chatId, messageId, message.text || message.caption, `❌ Rechazada por ${adminName}`);
      }
      await answerCallback(callbackQueryId, 'Operación procesada.');
    }
  } catch (err) {
    console.error('Error in processTelegramUpdate:', err);
  }
}

async function handleLinkAdmin(message) {
  const code = message.text.split('_').pop(); // ej: /vincular_admin_SAV123
  // Aquí podrías validar un código secreto o simplemente el ID de usuario de Supabase
  // Por ahora buscaremos un admin que coincida con un "código" (puedes usar el nombre_usuario)
  const { data: admin } = await supabase.from('usuarios').select('*').eq('nombre_usuario', code).eq('rol', 'admin').maybeSingle();
  
  const token = process.env.TELEGRAM_RECARGAS_TOKEN;
  if (!token) return;

  if (admin) {
    await linkAdminTelegram(admin.id, message.from);
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: message.chat.id,
        text: `✅ Administrador <b>${admin.nombre_real || admin.nombre_usuario}</b> vinculado correctamente a esta cuenta de Telegram.`,
        parse_mode: 'HTML'
      })
    });
  }
}

async function handleDailySummary(message) {
  const token = process.env.TELEGRAM_RETIROS_TOKEN;
  if (!token) return;

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' });
  const { getDailyWithdrawalSummary } = await import('./queries.js');
  const summary = await getDailyWithdrawalSummary(today);

  let text = `<b>📊 RESUMEN DIARIO DE RETIROS (${today})</b>\n\n`;

  if (summary.length === 0) {
    text += "No se procesaron retiros el día de hoy.";
  } else {
    let grandTotal = 0;
    summary.forEach(s => {
      text += `👤 <b>${s.name}</b>\n`;
      text += `   - Cantidad: ${s.count}\n`;
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
      const resText = await fetch(urlText, {
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

      if (!resText.ok) {
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
          show_alert: true
        })
      });
    } catch (e) {}
  }
}
