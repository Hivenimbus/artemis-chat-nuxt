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
        const [kanban] = await db.select()
            .from(kanbans)
            .where(eq(kanbans.id, kanbanId))
            .limit(1)

        if (!kanban || kanban.empresa_id !== dbUser.empresa_id) {
            throw createError({ statusCode: 404, statusMessage: 'Kanban não encontrado' })
        }

        // Buscar colunas e cartões
        const [columns, cards] = await Promise.all([
            db.select().from(kanbanColumns).where(eq(kanbanColumns.kanban_id, kanbanId)).orderBy(asc(kanbanColumns.position)),
            db.select().from(kanbanCards).where(eq(kanbanCards.kanban_id, kanbanId)).orderBy(asc(kanbanCards.position))
        ])

        return {
            success: true,
            data: { kanban, columns, cards }
        }

    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Erro interno do servidor'
        })
    }
})
