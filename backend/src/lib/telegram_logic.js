import { 
  getRecargaById, updateRecarga, 
  getRetiroById, updateRetiro, 
  findUserById, updateUser,
  getLevels, handleLevelUpRewards,
  createMovimiento, boliviaTime
} from './queries.js';

export async function processTelegramUpdate(update) {
  const { callback_query } = update;
  
  if (!callback_query) return;

  const { data, message, id: callbackQueryId } = callback_query;
  const chatId = message.chat.id;
  const messageId = message.message_id;

  console.log(`[Telegram Logic] Button clicked! Data: ${data}, From: ${callback_query.from.username || callback_query.from.id}`);

  try {
    const parts = data.split('_'); // ej: recarga_aprobar_uuid
    const type = parts[0];
    const action = parts[1];
    const id = parts.slice(2).join('_'); // Reensamblar el ID

    console.log(`[Telegram Logic] Type: ${type}, Action: ${action}, ID: ${id}`);

    if (type === 'recarga') {
      const recarga = await getRecargaById(id);
      console.log(`[Telegram Logic] Found recarga:`, recarga ? 'YES' : 'NOT FOUND');
      
      if (!recarga || (recarga.estado !== 'pendiente' && recarga.estado !== 'pendiente_ascenso')) {
        console.warn(`[Telegram Logic] Recarga ${id} not found or not pending.`);
        return answerCallback(callbackQueryId, 'Esta solicitud ya no está pendiente.');
      }

      if (action === 'aprobar') {
        console.log(`[Telegram Logic] Approving recharge/level-up ${id} (Mode: ${recarga.modo})`);
        const user = await findUserById(recarga.usuario_id);
        const niveles = await getLevels();
        const nivelDestino = niveles.find(n => (n.deposito || n.costo) === recarga.monto);
        const nivelActual = niveles.find(n => n.id === user.nivel_id);

        // Solo subir de nivel si el modo es 'Compra VIP' Y el monto coincide con un nivel
        if (recarga.modo === 'Compra VIP' && nivelDestino) {
          // CASO: Ascenso de Nivel (No se acredita el monto de recarga al saldo principal)
          const updates = { nivel_id: nivelDestino.id };
          
          console.log(`[Telegram Logic] Nivel Destino: ${nivelDestino.nombre}. No se acredita saldo principal por ser compra de nivel.`);

          // 1. Reembolsar nivel anterior si existía (a Saldo de Comisiones)
          if (nivelActual && (nivelActual.deposito > 0 || nivelActual.costo > 0)) {
            const montoADevolver = nivelActual.deposito || nivelActual.costo;
            
            // Actualizar saldo_comisiones sumando el reembolso
            updates.saldo_comisiones = Number((Number(user.saldo_comisiones || 0) + montoADevolver).toFixed(2));
            
            console.log(`[Telegram Logic] Reembolsando ${montoADevolver} BOB (Nivel ${nivelActual.nombre}) a Comisiones.`);
            
            await createMovimiento({
              usuario_id: user.id,
              tipo_movimiento: 'ajuste_admin', // Ajuste para que aparezca en el resumen
              monto: montoADevolver,
              descripcion: `Reembolso de inversión anterior (${nivelActual.nombre}) por ascenso`,
              referencia: `REF-${id.substring(0,8)}`,
              fecha: boliviaTime.now().toISOString()
            });
          }

          // 2. Aplicar los cambios al usuario (Nivel y posible Saldo Comisiones)
          await updateUser(user.id, updates);
          
          // 3. Marcar recarga como aprobada
          await updateRecarga(id, { estado: 'aprobada' });
          
          // 4. Ejecutar recompensas por ascenso (tickets de ruleta al invitador)
          await handleLevelUpRewards(user.id, user.nivel_id, nivelDestino.id);
          
          await editTelegramMessage(chatId, messageId, message.text || message.caption, `✅ Ascenso Aprobado a ${nivelDestino.nombre}`);
        } else {
          // CASO: Recarga de Saldo Simple (Ya sea porque el modo es 'Recarga Saldo' o no coincide con nivel)
          console.log(`[Telegram Logic] Acreditando ${recarga.monto} a Saldo Principal.`);
          
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
          await updateRecarga(id, { estado: 'aprobada' });
          await editTelegramMessage(chatId, messageId, message.text || message.caption, '✅ Recarga Aprobada al Saldo');
        }
      } else {
        await updateRecarga(id, { estado: 'rechazada' });
        await editTelegramMessage(chatId, messageId, message.text || message.caption, '❌ Rechazada');
      }
      await answerCallback(callbackQueryId, 'Operación procesada.');
    } 
    else if (type === 'retiro') {
      const retiro = await getRetiroById(id);
      if (!retiro || retiro.estado !== 'pendiente') {
        return answerCallback(callbackQueryId, 'Este retiro ya no está pendiente.');
      }

      if (action === 'aprobar') {
        await updateRetiro(id, { estado: 'completado' });
        await editTelegramMessage(chatId, messageId, message.text || message.caption, '✅ Aprobado (Completado)');
      } else {
        const user = await findUserById(retiro.usuario_id);
        const updates = {};
        if (retiro.tipo_billetera === 'comisiones') {
          updates.saldo_comisiones = (user.saldo_comisiones || 0) + retiro.monto;
        } else {
          updates.saldo_principal = (user.saldo_principal || 0) + retiro.monto;
        }
        await updateRetiro(id, { estado: 'rechazado' });
        await updateUser(user.id, updates);
        await editTelegramMessage(chatId, messageId, message.text || message.caption, '❌ Rechazado (Saldo devuelto)');
      }
      await answerCallback(callbackQueryId, 'Operación procesada.');
    }
  } catch (err) {
    console.error('Error in processTelegramUpdate:', err);
  }
}

async function editTelegramMessage(chatId, messageId, oldText, statusText) {
  const tokens = [process.env.TELEGRAM_RECARGAS_TOKEN, process.env.TELEGRAM_RETIROS_TOKEN];
  const newText = `${oldText}\n\n📢 Estado: ${statusText}`;

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
          reply_markup: { inline_keyboard: [] }
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
            reply_markup: { inline_keyboard: [] }
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
