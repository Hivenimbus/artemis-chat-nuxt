import { db } from '~/server/db'
import { notifications } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
    }

    await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.user_id, user.id)))

    return {
      success: true
    }

  } catch (error) {
    console.error('API notifications/[id].delete error:', error)
    throw error
  }
})
