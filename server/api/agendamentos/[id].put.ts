import { db } from '~/server/db'
import { users, agendamentos, agendamentoContatos } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const id = event.context.params?.id
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
    }

    const body = await readBody(event)

    // Check ownership/permissions (ensure user belongs to same company)
    const userData = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Erro de permissão' })
    }

    // Build update fields
    const updateData: Record<string, any> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.start_time !== undefined) updateData.start_time = new Date(body.start_time)
    if (body.end_time !== undefined) updateData.end_time = new Date(body.end_time)
    if (body.status !== undefined) updateData.status = body.status
    if (body.message_text !== undefined) updateData.message_text = body.message_text
    if (body.inbox_id !== undefined) updateData.inbox_id = body.inbox_id
    if (body.color !== undefined) updateData.color = body.color
    updateData.updated_at = new Date()

    const updatedAgendamento = await db
      .update(agendamentos)
      .set(updateData)
      .where(and(eq(agendamentos.id, id), eq(agendamentos.empresa_id, userData.empresa_id)))
      .returning()
      .then(r => r[0])

    if (!updatedAgendamento) {
      throw createError({ statusCode: 404, statusMessage: 'Agendamento não encontrado' })
    }

    // Update contacts if provided
    if (body.contact_ids && Array.isArray(body.contact_ids)) {
      // First delete existing links
      await db
        .delete(agendamentoContatos)
        .where(eq(agendamentoContatos.agendamento_id, id))

      // Then insert new ones
      if (body.contact_ids.length > 0) {
        const contactLinks = body.contact_ids.map((contactId: string) => ({
          agendamento_id: id,
          contato_id: contactId
        }))

        await db.insert(agendamentoContatos).values(contactLinks)
      }
    }

    return {
      success: true,
      data: updatedAgendamento
    }

  } catch (error) {
    console.error('API agendamentos/[id].put:', error)
    throw error
  }
})
