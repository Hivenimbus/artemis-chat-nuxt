import { db } from '~/server/db'
import { notifications } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const body = await readBody(event)
    const { id, all } = body

    if (!all) {
      if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID da notificação é obrigatório' })
      }

      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.user_id, user.id), eq(notifications.id, id)))
    } else {
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.user_id, user.id), eq(notifications.read, false)))
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('API notifications/mark-read error:', error)
    throw error
  }
})
