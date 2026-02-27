import { eq, desc } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const data = await db.select().from(schema.notifications)
      .where(eq(schema.notifications.user_id, user.id))
      .orderBy(desc(schema.notifications.created_at))
      .limit(50)

    return { success: true, data: data || [] }

  } catch (error: any) {
    console.error('API notifications error:', error)
    throw error
  }
})
