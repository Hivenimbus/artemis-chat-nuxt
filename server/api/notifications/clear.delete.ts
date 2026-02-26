<<<<<<< Updated upstream
import { db } from '~/server/db'
import { notifications } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
=======
import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

<<<<<<< Updated upstream
    await db
      .delete(notifications)
      .where(eq(notifications.user_id, user.id))

    return {
      success: true
    }

  } catch (error) {
=======
    await db.delete(schema.notifications).where(eq(schema.notifications.user_id, user.id))

    return { success: true }

  } catch (error: any) {
>>>>>>> Stashed changes
    console.error('API notifications/clear error:', error)
    throw error
  }
})
