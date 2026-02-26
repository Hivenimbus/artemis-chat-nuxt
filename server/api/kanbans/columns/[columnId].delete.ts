import { db } from '~/server/db'
import { users, kanbans, kanbanColumns, kanbanCards } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    try {
        const user = event.context.user

        if (!user) {
            throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
        }

        const columnId = getRouterParam(event, 'columnId')
        if (!columnId) {
            throw createError({ statusCode: 400, statusMessage: 'ID da coluna é obrigatório' })
        }

        const [dbUser] = await db.select({ empresa_id: users.empresa_id })
            .from(users).where(eq(users.id, user.id)).limit(1)

        if (!dbUser?.empresa_id) {
            throw createError({ statusCode: 403, statusMessage: 'Usuário sem empresa associada' })
        }

        // Verificar se a coluna existe e pertence à empresa (via kanban)
        const [column] = await db
            .select({ id: kanbanColumns.id, kanban_id: kanbanColumns.kanban_id, empresa_id: kanbans.empresa_id })
            .from(kanbanColumns)
            .innerJoin(kanbans, eq(kanbanColumns.kanban_id, kanbans.id))
            .where(eq(kanbanColumns.id, columnId))
            .limit(1)

        if (!column || column.empresa_id !== dbUser.empresa_id) {
            throw createError({ statusCode: 404, statusMessage: 'Coluna não encontrada' })
        }

        // Mover cards para a primeira coluna disponível (mesma kanban)
        const remainingColumns = await db.select({ id: kanbanColumns.id })
            .from(kanbanColumns)
            .where(eq(kanbanColumns.kanban_id, column.kanban_id!))

        const otherColumns = remainingColumns.filter(c => c.id !== columnId)

        if (otherColumns.length > 0) {
            // Mover cards para a primeira coluna disponível
            await db.update(kanbanCards)
                .set({ column_id: otherColumns[0].id })
                .where(eq(kanbanCards.column_id, columnId))
        } else {
            // Se não houver outra coluna, excluir os cards
            await db.delete(kanbanCards).where(eq(kanbanCards.column_id, columnId))
        }

        await db.delete(kanbanColumns).where(eq(kanbanColumns.id, columnId))

        return { success: true, message: 'Coluna excluída com sucesso' }

    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Erro interno do servidor'
        })
    }
})
