import { db } from '~/server/db'
import { users, kanbans, kanbanColumns, kanbanCards } from '~/server/db/schema'
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

        const body = await readBody(event)

        const updateData: any = { updated_at: new Date() }
        if (body.title !== undefined) updateData.title = body.title
        if (body.description !== undefined) updateData.description = body.description
        if (body.is_urgent !== undefined) updateData.is_urgent = body.is_urgent
        if (body.column_id !== undefined) updateData.column_id = body.column_id
        if (body.position !== undefined) updateData.position = body.position

        const [updated] = await db.update(kanbanCards)
            .set(updateData)
            .where(eq(kanbanCards.id, cardId))
            .returning()

        return { success: true, data: updated }

    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Erro interno do servidor'
        })
    }
})
