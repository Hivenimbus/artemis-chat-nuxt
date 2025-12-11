import { createServiceSupabaseClient, sendTextMessageToWhatsApp, findOrCreateAtendimento, createMessage, updateAtendimentoWithMessage } from '~/server/lib/evolution'

export async function processScheduledMessages() {
  try {
    const client = createServiceSupabaseClient()
    const now = new Date().toISOString()

    // Find pending schedules that are due
    const { data: schedules, error: fetchError } = await client
      .from('agendamentos')
      .select(`
        *,
        agendamento_contatos (
          contato_id,
          contatos (
            id,
            nome,
            telefone,
            empresa_id
          )
        )
      `)
      .eq('type', 'message_schedule')
      .eq('status', 'scheduled')
      .lte('start_time', now)

    if (fetchError) {
      console.error('Error fetching schedules:', fetchError)
      return { success: false, error: fetchError }
    }

    if (!schedules || schedules.length === 0) {
      return { success: true, processed: 0, results: [] }
    }

    console.log(`Found ${schedules.length} schedules to process`)
    const results = []

    for (const schedule of schedules) {
      if (!schedule.inbox_id) {
        console.error(`Schedule ${schedule.id} has no inbox_id, skipping`)
        await client
          .from('agendamentos')
          .update({ status: 'failed', description: (schedule.description || '') + ' [Erro: Inbox não definida]' })
          .eq('id', schedule.id)
        continue
      }

      if (!schedule.message_text) {
        console.error(`Schedule ${schedule.id} has no message_text, skipping`)
         await client
          .from('agendamentos')
          .update({ status: 'failed', description: (schedule.description || '') + ' [Erro: Mensagem vazia]' })
          .eq('id', schedule.id)
        continue
      }

      const contacts = schedule.agendamento_contatos
        ?.map((ac: any) => ac.contatos)
        ?.filter((c: any) => c) || []

      if (contacts.length === 0) {
        console.log(`Schedule ${schedule.id} has no valid contacts`)
         await client
          .from('agendamentos')
          .update({ status: 'completed', description: (schedule.description || '') + ' [Aviso: Sem contatos]' })
          .eq('id', schedule.id)
        continue
      }

      let successCount = 0
      let failCount = 0

      for (const contact of contacts) {
        try {
          console.log(`Processing schedule ${schedule.id} for contact ${contact.id}`)

          // 1. Find or create atendimento to ensure message history
          const atendimentoResult = await findOrCreateAtendimento(client, contact.id, schedule.inbox_id)
          
          if (!atendimentoResult) {
            console.error(`Could not find/create atendimento for contact ${contact.id}`)
            failCount++
            continue
          }

          // 2. Send message via Evolution API
          const sendResult = await sendTextMessageToWhatsApp(
            schedule.inbox_id,
            contact.telefone,
            schedule.message_text
          )

          if (sendResult.success) {
            console.log(`Message sent to ${contact.telefone}`)
            
            // 3. Record message in database
            await createMessage(
              client,
              atendimentoResult.id,
              schedule.message_text,
              'user', // Sent by user (system)
              'text',
              sendResult.messageId
            )

            // 4. Update atendimento (last message, unread count - usually 0 for self sent but whatever)
            // Note: pass incrementUnread=false since it's a message FROM the user (or system acting as user)
            await updateAtendimentoWithMessage(client, atendimentoResult.id, schedule.message_text, undefined, false)

            successCount++
          } else {
            console.error(`Failed to send to ${contact.telefone}: ${sendResult.error}`)
            failCount++
          }

        } catch (contactError) {
          console.error(`Error processing contact ${contact.id}:`, contactError)
          failCount++
        }
      }

      // Update schedule status
      const finalStatus = successCount > 0 ? 'completed' : (failCount > 0 ? 'failed' : 'completed')
      
      await client
        .from('agendamentos')
        .update({ 
          status: finalStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', schedule.id)

      results.push({
        id: schedule.id,
        success: successCount,
        failed: failCount,
        status: finalStatus
      })
    }

    return {
      success: true,
      processed: results.length,
      results
    }

  } catch (error) {
    console.error('Error in processScheduledMessages:', error)
    return { success: false, error }
  }
}

