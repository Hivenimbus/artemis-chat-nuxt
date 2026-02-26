<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, agendamentos, agendamentoContatos } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
=======
import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const body = await readBody(event)

<<<<<<< Updated upstream
    // Get user data to find empresa_id
    const userData = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
    }
=======
    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
>>>>>>> Stashed changes

    const [agendamento] = await db.insert(schema.agendamentos).values({
      empresa_id: userData.empresa_id,
      user_id: user.id,
      title: body.title,
<<<<<<< Updated upstream
      description: body.description || null,
      start_time: new Date(body.start_time),
      end_time: body.end_time ? new Date(body.end_time) : null,
      type: body.type,
      status: body.status || 'scheduled',
      message_text: body.message_text || null,
      inbox_id: body.inbox_id || null,
      color: body.color || null
    }

    // Insert agendamento
    const agendamento = await db
      .insert(agendamentos)
      .values(agendamentoData)
      .returning()
      .then(r => r[0])

    // Link contacts if provided
    if (body.contact_ids && Array.isArray(body.contact_ids) && body.contact_ids.length > 0) {
      const contactLinks = body.contact_ids.map((contactId: string) => ({
        agendamento_id: agendamento.id,
        contato_id: contactId
      }))

      try {
        await db.insert(agendamentoContatos).values(contactLinks)
      } catch (linksError) {
        console.error('Error linking contacts:', linksError)
        // Note: The agendamento was created, but contacts failed.
        // We could delete the agendamento here or just return a warning.
      }
    }

    return {
      success: true,
      data: agendamento
    }

  } catch (error) {
=======
      description: body.description,
      start_time: body.start_time ? new Date(body.start_time) : undefined,
      end_time: body.end_time ? new Date(body.end_time) : undefined,
      type: body.type || 'message_schedule',
      status: body.status || 'scheduled',
      message_text: body.message_text,
      inbox_id: body.inbox_id || undefined,
      contato_id: body.contact_ids?.[0] || undefined, // First contact for now
    }).returning()

    return { success: true, data: agendamento }

  } catch (error: any) {
>>>>>>> Stashed changes
    console.error('API agendamentos/index.post:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro ao criar agendamento' })
  }
})
