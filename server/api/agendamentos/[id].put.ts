import { eq, and } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID inválido' })

    const body = await readBody(event)

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Erro de permissão' })

    const updateData: any = { updated_at: new Date() }
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.start_time !== undefined) updateData.start_time = new Date(body.start_time)
    if (body.end_time !== undefined) updateData.end_time = new Date(body.end_time)
    if (body.status !== undefined) updateData.status = body.status
    if (body.message_text !== undefined) updateData.message_text = body.message_text
    if (body.inbox_id !== undefined) updateData.inbox_id = body.inbox_id

    const [updatedAgendamento] = await db.update(schema.agendamentos)
      .set(updateData)
      .where(and(eq(schema.agendamentos.id, id), eq(schema.agendamentos.empresa_id, userData.empresa_id)))
      .returning()

    if (!updatedAgendamento) throw createError({ statusCode: 404, statusMessage: 'Agendamento não encontrado' })

    // Update contact if provided
    if (body.contact_ids && Array.isArray(body.contact_ids) && body.contact_ids.length > 0) {
      await db.update(schema.agendamentos)
        .set({ contato_id: body.contact_ids[0] })
        .where(eq(schema.agendamentos.id, id))
    }

    return { success: true, data: updatedAgendamento }

  } catch (error: any) {
    console.error('API agendamentos/[id].put:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar agendamento' })
  }
})
