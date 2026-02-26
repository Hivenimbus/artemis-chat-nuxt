<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, agendamentos, agendamentoContatos } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'
=======
import { eq, and } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID inválido' })

    const body = await readBody(event)

<<<<<<< Updated upstream
    // Check ownership/permissions (ensure user belongs to same company)
    const userData = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])
=======
    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)
>>>>>>> Stashed changes

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Erro de permissão' })

<<<<<<< Updated upstream
    // Build update fields
    const updateData: Record<string, any> = {}
=======
    const updateData: any = { updated_at: new Date() }
>>>>>>> Stashed changes
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.start_time !== undefined) updateData.start_time = new Date(body.start_time)
    if (body.end_time !== undefined) updateData.end_time = new Date(body.end_time)
    if (body.status !== undefined) updateData.status = body.status
    if (body.message_text !== undefined) updateData.message_text = body.message_text
    if (body.inbox_id !== undefined) updateData.inbox_id = body.inbox_id
<<<<<<< Updated upstream
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
=======

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
>>>>>>> Stashed changes
    console.error('API agendamentos/[id].put:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar agendamento' })
  }
})
