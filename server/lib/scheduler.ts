import {
  sendTextMessageToWhatsApp,
  findOrCreateAtendimento,
  createMessage,
  updateAtendimentoWithMessage
} from '~/server/lib/evolution'
import { createNotification } from './notifications'
import { db } from '~/server/db'
import { agendamentos, agendamentoContatos, contatos } from '~/server/db/schema'
import { eq, and, inArray, lte } from 'drizzle-orm'

export async function processScheduledMessages() {
  try {
    const now = new Date()

    // Buscar agendamentos pendentes que já venceram
    const schedules = await db
      .select()
      .from(agendamentos)
      .where(and(
        inArray(agendamentos.type, ['message_schedule', 'reminder']),
        eq(agendamentos.status, 'scheduled'),
        lte(agendamentos.start_time, now)
      ))

    if (!schedules || schedules.length === 0) {
      return { success: true, processed: 0, results: [] }
    }

    console.log(`Found ${schedules.length} schedules to process`)
    const results = []

    for (const schedule of schedules) {
      // Buscar contatos do agendamento
      const contatoLinks = await db
        .select({ contato_id: agendamentoContatos.contato_id })
        .from(agendamentoContatos)
        .where(eq(agendamentoContatos.agendamento_id, schedule.id))

      const contatoIds = contatoLinks.map(c => c.contato_id).filter(Boolean) as string[]

      // Processar Reminder
      if (schedule.type === 'reminder') {
        await createNotification({
          userId: schedule.user_id!,
          empresaId: schedule.empresa_id!,
          title: 'Lembrete: ' + schedule.title,
          message: schedule.description || 'Você tem um lembrete agendado.',
          type: 'reminder',
          link: '/agendamentos'
        })

        await db
          .update(agendamentos)
          .set({ status: 'completed', updated_at: new Date() })
          .where(eq(agendamentos.id, schedule.id))

        results.push({ id: schedule.id, status: 'completed', type: 'reminder' })
        continue
      }

      // Processar Message Schedule
      if (!schedule.inbox_id) {
        console.error(`Schedule ${schedule.id} has no inbox_id, skipping`)
        await db
          .update(agendamentos)
          .set({ status: 'failed' })
          .where(eq(agendamentos.id, schedule.id))
        continue
      }

      if (!schedule.message_text) {
        console.error(`Schedule ${schedule.id} has no message_text, skipping`)
        await db
          .update(agendamentos)
          .set({ status: 'failed' })
          .where(eq(agendamentos.id, schedule.id))
        continue
      }

      if (contatoIds.length === 0) {
        console.log(`Schedule ${schedule.id} has no valid contacts`)
        await db
          .update(agendamentos)
          .set({ status: 'completed' })
          .where(eq(agendamentos.id, schedule.id))
        continue
      }

      // Buscar dados dos contatos
      const contacts = await db
        .select({ id: contatos.id, telefone: contatos.telefone, empresa_id: contatos.empresa_id })
        .from(contatos)
        .where(inArray(contatos.id, contatoIds))

      let successCount = 0
      let failCount = 0

      for (const contact of contacts) {
        try {
          const atendimentoResult = await findOrCreateAtendimento(contact.id, schedule.inbox_id)
          if (!atendimentoResult) {
            failCount++
            continue
          }

          const sendResult = await sendTextMessageToWhatsApp(
            schedule.inbox_id,
            contact.telefone!,
            schedule.message_text
          )

          if (sendResult.success) {
            await createMessage(
              atendimentoResult.id,
              schedule.message_text,
              'user',
              'text',
              sendResult.messageId
            )
            await updateAtendimentoWithMessage(atendimentoResult.id, schedule.message_text, undefined, false)
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

      const finalStatus = successCount > 0 ? 'completed' : (failCount > 0 ? 'failed' : 'completed')

      await db
        .update(agendamentos)
        .set({ status: finalStatus, updated_at: new Date() })
        .where(eq(agendamentos.id, schedule.id))

      if (successCount > 0) {
        await createNotification({
          userId: schedule.user_id!,
          empresaId: schedule.empresa_id!,
          title: 'Mensagem Agendada Enviada',
          message: `Sua mensagem "${schedule.title}" foi enviada para ${successCount} contatos.`,
          type: 'reminder',
          link: '/agendamentos'
        })
      } else if (failCount > 0) {
        await createNotification({
          userId: schedule.user_id!,
          empresaId: schedule.empresa_id!,
          title: 'Falha no Envio de Mensagem',
          message: `Falha ao enviar sua mensagem "${schedule.title}". Verifique os detalhes.`,
          type: 'reminder',
          link: '/agendamentos'
        })
      }

      results.push({ id: schedule.id, success: successCount, failed: failCount, status: finalStatus })
    }

    return { success: true, processed: results.length, results }
  } catch (error) {
    console.error('Error in processScheduledMessages:', error)
    return { success: false, error }
  }
}
