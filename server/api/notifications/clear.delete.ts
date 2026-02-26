import { db } from '~/server/db'
import { notifications } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    await db
      .delete(notifications)
      .where(eq(notifications.user_id, user.id))

    return {
      success: true
    }

  } catch (error) {
    console.error('API notifications/clear error:', error)
    throw error
  }
})
