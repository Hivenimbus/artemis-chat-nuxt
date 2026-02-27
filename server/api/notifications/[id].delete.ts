import { eq, and } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID inválido' })

    await db.delete(schema.notifications)
      .where(and(eq(schema.notifications.id, id), eq(schema.notifications.user_id, user.id)))

    return { success: true }

  } catch (error: any) {
    console.error('API notifications/[id].delete error:', error)
    throw error
  }
})
