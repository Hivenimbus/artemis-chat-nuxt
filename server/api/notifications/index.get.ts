<<<<<<< Updated upstream
import { db } from '~/server/db'
import { notifications } from '~/server/db/schema'
import { eq, desc } from 'drizzle-orm'
=======
import { eq, desc } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

<<<<<<< Updated upstream
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
=======
    const data = await db.select().from(schema.notifications)
      .where(eq(schema.notifications.user_id, user.id))
      .orderBy(desc(schema.notifications.created_at))
      .limit(50)

    return { success: true, data: data || [] }

  } catch (error: any) {
>>>>>>> Stashed changes
    console.error('API notifications error:', error)
    throw error
  }
})
