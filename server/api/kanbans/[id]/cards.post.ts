<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, kanbans, kanbanColumns, kanbanCards } from '~/server/db/schema'
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    try {
        const user = event.context.user

        if (!user) {
            throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
        }

        const kanbanId = getRouterParam(event, 'id')
        if (!kanbanId) {
            throw createError({ statusCode: 400, statusMessage: 'ID do kanban é obrigatório' })
        }

        const [dbUser] = await db.select({ empresa_id: users.empresa_id })
            .from(users).where(eq(users.id, user.id)).limit(1)

        if (!dbUser?.empresa_id) {
            throw createError({ statusCode: 403, statusMessage: 'Usuário sem empresa associada' })
        }

        // Verificar se o kanban pertence à empresa
        const [kanban] = await db.select({ id: kanbans.id, empresa_id: kanbans.empresa_id })
            .from(kanbans).where(eq(kanbans.id, kanbanId)).limit(1)

        if (!kanban || kanban.empresa_id !== dbUser.empresa_id) {
            throw createError({ statusCode: 404, statusMessage: 'Kanban não encontrado' })
        }

        const body = await readBody(event)

        if (!body.column_id || !body.title) {
            throw createError({ statusCode: 400, statusMessage: 'column_id e title são obrigatórios' })
        }

        // Calcular posição
        const existingCards = await db.select({ position: kanbanCards.position })
            .from(kanbanCards)
            .where(eq(kanbanCards.column_id, body.column_id))

        const maxPosition = existingCards.reduce((max, c) => Math.max(max, c.position || 0), -1)

        const [newCard] = await db.insert(kanbanCards)
            .values({
                kanban_id: kanbanId,
                column_id: body.column_id,
                title: body.title,
                description: body.description || null,
                is_urgent: body.is_urgent || false,
                position: maxPosition + 1
            })
            .returning()

        return { success: true, data: newCard }

    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Erro interno do servidor'
        })
    }
=======
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
>>>>>>> Stashed changes
})
