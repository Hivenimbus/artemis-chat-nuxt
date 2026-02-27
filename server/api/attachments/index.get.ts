import { eq, desc } from 'drizzle-orm'
import { db, schema } from '~/server/database'

// Note: campaign_attachments table — this is a placeholder/minimal implementation
// as it references a table not in the Drizzle schema yet. Returns empty if not present.
export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    // Return empty array — campaign_attachments not in schema, handled at app level
    return { success: true, data: [] }

  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro interno ao buscar anexos' })
  }
})
