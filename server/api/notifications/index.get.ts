import { db } from '~/server/db'
import { notifications } from '~/server/db/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const data = await db
      .select()
      .from(notifications)
      .where(eq(notifications.user_id, user.id))
      .orderBy(desc(notifications.created_at))
      .limit(50)

    return {
      success: true,
      data
    }

  } catch (error) {
    console.error('API notifications error:', error)
    throw error
  }
})
