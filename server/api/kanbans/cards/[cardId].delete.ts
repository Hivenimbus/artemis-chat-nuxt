import { db } from '~/server/db'
import { users, kanbans, kanbanCards } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    try {
        const user = event.context.user

        if (!user) {
            throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
        }

        const cardId = getRouterParam(event, 'cardId')
        if (!cardId) {
            throw createError({ statusCode: 400, statusMessage: 'ID do cartão é obrigatório' })
        }

        const [dbUser] = await db.select({ empresa_id: users.empresa_id })
            .from(users).where(eq(users.id, user.id)).limit(1)

        if (!dbUser?.empresa_id) {
            throw createError({ statusCode: 403, statusMessage: 'Usuário sem empresa associada' })
        }

        // Verificar se o card pertence à empresa (via kanban)
        const [card] = await db
            .select({ id: kanbanCards.id, empresa_id: kanbans.empresa_id })
            .from(kanbanCards)
            .innerJoin(kanbans, eq(kanbanCards.kanban_id, kanbans.id))
            .where(eq(kanbanCards.id, cardId))
            .limit(1)

        if (!card || card.empresa_id !== dbUser.empresa_id) {
            throw createError({ statusCode: 404, statusMessage: 'Cartão não encontrado' })
        }

        await db.delete(kanbanCards).where(eq(kanbanCards.id, cardId))

        return { success: true, message: 'Cartão excluído com sucesso' }

    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Erro interno do servidor'
        })
    }
})
