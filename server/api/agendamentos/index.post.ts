import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const body = await readBody(event)

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })

    const [agendamento] = await db.insert(schema.agendamentos).values({
      empresa_id: userData.empresa_id,
      user_id: user.id,
      title: body.title,
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
    console.error('API agendamentos/index.post:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro ao criar agendamento' })
  }
})
