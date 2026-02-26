<<<<<<< Updated upstream
import {
  sendTextMessageToWhatsApp,
  findOrCreateAtendimento,
  createMessage,
  updateAtendimentoWithMessage
} from '~/server/lib/evolution'
=======
import { eq, and, lte, inArray } from 'drizzle-orm'
import { db, schema } from '~/server/database'
import { sendTextMessageToWhatsApp, findOrCreateAtendimento, createMessage, updateAtendimentoWithMessage } from '~/server/lib/evolution'
>>>>>>> Stashed changes
import { createNotification } from './notifications'
import { db } from '~/server/db'
import { agendamentos, agendamentoContatos, contatos } from '~/server/db/schema'
import { eq, and, inArray, lte } from 'drizzle-orm'

export async function processScheduledMessages() {
  try {
    const now = new Date()

<<<<<<< Updated upstream
    // Buscar agendamentos pendentes que já venceram
    const schedules = await db
      .select()
      .from(agendamentos)
      .where(and(
        inArray(agendamentos.type, ['message_schedule', 'reminder']),
        eq(agendamentos.status, 'scheduled'),
        lte(agendamentos.start_time, now)
=======
    // Find pending schedules that are due
    const schedules = await db.select().from(schema.agendamentos)
      .where(and(
        inArray(schema.agendamentos.type as any, ['message_schedule', 'reminder']),
        eq(schema.agendamentos.status, 'scheduled'),
        lte(schema.agendamentos.start_time as any, now)
>>>>>>> Stashed changes
      ))

    if (!schedules || schedules.length === 0) {
      return { success: true, processed: 0, results: [] }
    }

    console.log(`Found ${schedules.length} schedules to process`)
    const results = []

    for (const schedule of schedules) {
<<<<<<< Updated upstream
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
=======
      const s = schedule as any

      // Handle Reminder
      if (s.type === 'reminder') {
        await createNotification({
          userId: s.user_id,
          empresaId: s.empresa_id,
          title: 'Lembrete: ' + s.title,
          message: s.description || 'Você tem um lembrete agendado.',
>>>>>>> Stashed changes
          type: 'reminder',
          link: '/agendamentos'
        })

<<<<<<< Updated upstream
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
=======
        await db.update(schema.agendamentos)
          .set({ status: 'completed', updated_at: new Date() })
          .where(eq(schema.agendamentos.id, s.id))

        results.push({ id: s.id, status: 'completed', type: 'reminder' })
        continue
      }

      // Handle Message Schedule
      if (!s.inbox_id) {
        console.error(`Schedule ${s.id} has no inbox_id, skipping`)
        await db.update(schema.agendamentos)
          .set({ status: 'failed' })
          .where(eq(schema.agendamentos.id, s.id))
        continue
      }

      if (!s.message_text) {
        console.error(`Schedule ${s.id} has no message_text, skipping`)
        await db.update(schema.agendamentos)
          .set({ status: 'failed' })
          .where(eq(schema.agendamentos.id, s.id))
        continue
      }

      // Fetch contacts for this schedule
      const agendamentoContatos = await db.query.agendamentos.findFirst({
        where: eq(schema.agendamentos.id, s.id),
      })

      // For simplicity, get the contato from agendamento via contato_id
      const contacts: any[] = []
      if (s.contato_id) {
        const [contato] = await db.select()
          .from(schema.contatos)
          .where(eq(schema.contatos.id, s.contato_id))
          .limit(1)
        if (contato) contacts.push(contato)
      }

      if (contacts.length === 0) {
        console.log(`Schedule ${s.id} has no valid contacts`)
        await db.update(schema.agendamentos)
          .set({ status: 'completed' })
          .where(eq(schema.agendamentos.id, s.id))
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
          const atendimentoResult = await findOrCreateAtendimento(contact.id, schedule.inbox_id)
=======
          console.log(`Processing schedule ${s.id} for contact ${contact.id}`)

          // 1. Find or create atendimento
          const atendimentoResult = await findOrCreateAtendimento(contact.id, s.inbox_id)

>>>>>>> Stashed changes
          if (!atendimentoResult) {
            failCount++
            continue
          }

          const sendResult = await sendTextMessageToWhatsApp(
<<<<<<< Updated upstream
            schedule.inbox_id,
            contact.telefone!,
            schedule.message_text
          )

          if (sendResult.success) {
            await createMessage(
              atendimentoResult.id,
              schedule.message_text,
=======
            s.inbox_id,
            contact.telefone,
            s.message_text
          )

          if (sendResult.success) {
            console.log(`Message sent to ${contact.telefone}`)

            // 3. Record message in database
            await createMessage(
              atendimentoResult.id,
              s.message_text,
>>>>>>> Stashed changes
              'user',
              'text',
              sendResult.messageId
            )
<<<<<<< Updated upstream
            await updateAtendimentoWithMessage(atendimentoResult.id, schedule.message_text, undefined, false)
=======

            // 4. Update atendimento
            await updateAtendimentoWithMessage(atendimentoResult.id, s.message_text, undefined, false)

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======

      await db.update(schema.agendamentos)
        .set({ status: finalStatus, updated_at: new Date() })
        .where(eq(schema.agendamentos.id, s.id))
>>>>>>> Stashed changes

      await db
        .update(agendamentos)
        .set({ status: finalStatus, updated_at: new Date() })
        .where(eq(agendamentos.id, schedule.id))

      if (successCount > 0) {
        await createNotification({
<<<<<<< Updated upstream
          userId: schedule.user_id!,
          empresaId: schedule.empresa_id!,
          title: 'Mensagem Agendada Enviada',
          message: `Sua mensagem "${schedule.title}" foi enviada para ${successCount} contatos.`,
=======
          userId: s.user_id,
          empresaId: s.empresa_id,
          title: 'Mensagem Agendada Enviada',
          message: `Sua mensagem "${s.title}" foi enviada para ${successCount} contatos.`,
>>>>>>> Stashed changes
          type: 'reminder',
          link: '/agendamentos'
        })
      } else if (failCount > 0) {
        await createNotification({
<<<<<<< Updated upstream
          userId: schedule.user_id!,
          empresaId: schedule.empresa_id!,
=======
          userId: s.user_id,
          empresaId: s.empresa_id,
>>>>>>> Stashed changes
          title: 'Falha no Envio de Mensagem',
          message: `Falha ao enviar sua mensagem "${s.title}". Verifique os detalhes.`,
          type: 'reminder',
          link: '/agendamentos'
        })
      }

<<<<<<< Updated upstream
      results.push({ id: schedule.id, success: successCount, failed: failCount, status: finalStatus })
    }
=======
      results.push({ id: s.id, success: successCount, failed: failCount, status: finalStatus })
    }

    return { success: true, processed: results.length, results }
>>>>>>> Stashed changes

    return { success: true, processed: results.length, results }
  } catch (error) {
    console.error('Error in processScheduledMessages:', error)
    return { success: false, error }
  }
}
<<<<<<< Updated upstream
=======

export async function processScheduledCampaigns() {
  try {
    const now = new Date()

    // Find scheduled campaigns that are due
    const campaigns = await db.select().from(schema.campanhas)
      .where(and(
        eq(schema.campanhas.status, 'scheduled'),
        lte(schema.campanhas.scheduled_at as any, now)
      ))

    const results = []

    for (const campaign of campaigns || []) {
      const c = campaign as any

      // Update to processing so worker picks it up
      await db.update(schema.campanhas)
        .set({ status: 'running', updated_at: new Date() })
        .where(eq(schema.campanhas.id, c.id))

      // Notify user
      await createNotification({
        userId: c.created_by,
        empresaId: c.empresa_id,
        title: 'Campanha Iniciada',
        message: `Sua campanha agendada iniciou o envio.`,
        type: 'campaign',
        link: '/campanhas/historico'
      })

      results.push({ id: c.id, status: 'processing' })
    }

    return { success: true, processed: results.length, results }

  } catch (error) {
    console.error('Error processing campaigns:', error)
    return { success: false, error }
  }
}
>>>>>>> Stashed changes
