import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    // Get user's template draft (filtered by user/created_by)
    const [template] = await db.select({ content: schema.messageTemplates.content })
      .from(schema.messageTemplates)
      .where(eq(schema.messageTemplates.created_by, user.id))
      .limit(1)

    return { success: true, data: template || null }

  } catch (error: any) {
    console.error('API templates/index.get:', error)
    return { success: true, data: null }
  }
})
