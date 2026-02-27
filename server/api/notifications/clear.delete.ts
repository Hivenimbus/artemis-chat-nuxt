import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    await db.delete(schema.notifications).where(eq(schema.notifications.user_id, user.id))

    return { success: true }

  } catch (error: any) {
    console.error('API notifications/clear error:', error)
    throw error
  }
})
