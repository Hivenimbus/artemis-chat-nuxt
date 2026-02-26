import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

// Update a card (title, column, position, etc.)
export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

    const cardId = getRouterParam(event, 'cardId')
    if (!cardId) throw createError({ statusCode: 400, statusMessage: 'ID do card inválido' })

    const body = await readBody(event)
    const updateData: any = { updated_at: new Date() }
    if (body.title !== undefined) updateData.titulo = body.title
    if (body.column_id !== undefined) updateData.coluna_id = body.column_id
    if (body.position !== undefined) updateData.ordem = body.position

    const [updated] = await db.update(schema.kanbanCards)
        .set(updateData)
        .where(eq(schema.kanbanCards.id, cardId))
        .returning()

    if (!updated) throw createError({ statusCode: 404, statusMessage: 'Card não encontrado' })

    return { success: true, data: { ...updated, title: updated.titulo, column_id: updated.coluna_id, position: updated.ordem } }
})
