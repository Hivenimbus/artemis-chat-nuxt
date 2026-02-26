import { db } from '~/server/db'
import { messageTemplates } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

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

  } catch (error: any) {
    console.error('API templates/index.get:', error)
    // Return empty success to not break the page load
    return {
      success: true,
      data: null
    }
  }
})
