<<<<<<< Updated upstream
import { db } from '~/server/db'
import { campaignAttachments } from '~/server/db/schema'
import { eq, desc } from 'drizzle-orm'
=======
import { eq, desc } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

// Note: campaign_attachments table — this is a placeholder/minimal implementation
// as it references a table not in the Drizzle schema yet. Returns empty if not present.
export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

<<<<<<< Updated upstream
    // Get user's attachments
    // Assuming we want to show the latest attachments uploaded by this user for the current campaign context
    // We might want to limit this or filter by a specific campaign ID if that existed,
    // but based on the request, we just want to "persist" data for the user's current session/draft.
    const attachments = await db
      .select()
      .from(campaignAttachments)
      .where(eq(campaignAttachments.user_id, user.id))
      .orderBy(desc(campaignAttachments.created_at))

    return {
      success: true,
      data: attachments
    }

  } catch (error: any) {
    console.error('API attachments/index.get:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro interno ao buscar anexos'
    })
=======
    // Return empty array — campaign_attachments not in schema, handled at app level
    return { success: true, data: [] }

  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro interno ao buscar anexos' })
>>>>>>> Stashed changes
  }
})
