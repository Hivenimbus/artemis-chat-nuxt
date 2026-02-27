import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

// Create a card in a specific column
export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

    const kanbanId = getRouterParam(event, 'id')
    if (!kanbanId) throw createError({ statusCode: 400, statusMessage: 'ID do kanban inválido' })

    const body = await readBody(event)
    if (!body.column_id) throw createError({ statusCode: 400, statusMessage: 'column_id é obrigatório' })

    const existing = await db.select({ ordem: schema.kanbanCards.ordem })
        .from(schema.kanbanCards).where(eq(schema.kanbanCards.coluna_id, body.column_id))

    const maxOrdem = existing.length > 0 ? Math.max(...existing.map(e => e.ordem)) + 1 : 0

    const [card] = await db.insert(schema.kanbanCards).values({
        coluna_id: body.column_id,
        titulo: body.title?.trim() || 'Novo Card',
        ordem: maxOrdem,
    }).returning()

    return { success: true, data: { ...card, title: card.titulo, column_id: card.coluna_id, position: card.ordem } }
})
