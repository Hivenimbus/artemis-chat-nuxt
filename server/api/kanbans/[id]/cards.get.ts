import { eq, asc } from 'drizzle-orm'
import { db, schema } from '~/server/database'

// Get cards for a kanban
export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

    const kanbanId = getRouterParam(event, 'id')
    if (!kanbanId) throw createError({ statusCode: 400, statusMessage: 'ID do kanban inválido' })

    // Get columns first to filter cards
    const colunas = await db.select({ id: schema.kanbanColunas.id })
        .from(schema.kanbanColunas).where(eq(schema.kanbanColunas.kanban_id, kanbanId))

    if (colunas.length === 0) return { success: true, data: [] }

    const { inArray } = await import('drizzle-orm')
    const colunaIds = colunas.map(c => c.id)

    const cards = await db.select().from(schema.kanbanCards)
        .where(inArray(schema.kanbanCards.coluna_id, colunaIds))
        .orderBy(asc(schema.kanbanCards.ordem))

    return { success: true, data: cards.map(c => ({ ...c, title: c.titulo, column_id: c.coluna_id, position: c.ordem, is_urgent: false, description: '' })) }
})
