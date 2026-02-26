import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

// Delete a card
export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

    const cardId = getRouterParam(event, 'cardId')
    if (!cardId) throw createError({ statusCode: 400, statusMessage: 'ID do card inválido' })

    await db.delete(schema.kanbanCards).where(eq(schema.kanbanCards.id, cardId))

    return { success: true }
})
