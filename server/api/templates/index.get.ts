<<<<<<< Updated upstream
import { db } from '~/server/db'
import { messageTemplates } from '~/server/db/schema'
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
    // Get user's template (draft); return null if none exists
    const rows = await db
      .select({ content: messageTemplates.content })
      .from(messageTemplates)
      .where(eq(messageTemplates.user_id, user.id))
      .limit(1)

    const template = rows.length > 0 ? rows[0] : null

    return {
      success: true,
      data: template
    }
=======
    // Get user's template draft (filtered by user/created_by)
    const [template] = await db.select({ content: schema.messageTemplates.content })
      .from(schema.messageTemplates)
      .where(eq(schema.messageTemplates.created_by, user.id))
      .limit(1)

    return { success: true, data: template || null }
>>>>>>> Stashed changes

  } catch (error: any) {
    console.error('API templates/index.get:', error)
    return { success: true, data: null }
  }
})
