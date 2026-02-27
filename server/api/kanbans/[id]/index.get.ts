import { eq, asc, inArray } from 'drizzle-orm'
import { db, schema } from '~/server/database'

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

        const [dbUser] = await db.select({ empresa_id: schema.users.empresa_id })
            .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

        if (!dbUser?.empresa_id) {
            throw createError({ statusCode: 403, statusMessage: 'Usuário sem empresa associada' })
        }

        // Verificar se o kanban pertence à empresa
        const [kanban] = await db.select()
            .from(schema.kanbans)
            .where(eq(schema.kanbans.id, kanbanId))
            .limit(1)

        if (!kanban || kanban.empresa_id !== dbUser.empresa_id) {
            throw createError({ statusCode: 404, statusMessage: 'Kanban não encontrado' })
        }

        // Buscar colunas
        const columnsData = await db.select().from(schema.kanbanColunas)
            .where(eq(schema.kanbanColunas.kanban_id, kanbanId))
            .orderBy(asc(schema.kanbanColunas.ordem))

        const columnIds = columnsData.map(c => c.id)
        let cardsData: any[] = []
        if (columnIds.length > 0) {
            cardsData = await db.select().from(schema.kanbanCards)
                .where(inArray(schema.kanbanCards.coluna_id, columnIds))
                .orderBy(asc(schema.kanbanCards.ordem))
        }

        const columns = columnsData.map(c => ({ ...c, title: c.nome, position: c.ordem, icon: c.icone, color: c.cor }))
        const cards = cardsData.map(c => ({ ...c, column_id: c.coluna_id, position: c.ordem, title: c.titulo }))

        return {
            success: true,
            data: { kanban: { ...kanban, title: kanban.nome }, columns, cards }
        }

    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Erro interno do servidor'
        })
    }
})
