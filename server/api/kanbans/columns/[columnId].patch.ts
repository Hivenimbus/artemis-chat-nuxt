import { db } from '~/server/db'
import { users, kanbans, kanbanColumns, kanbanCards } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

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

        const body = await readBody(event)

        const updateData: any = { updated_at: new Date() }
        if (body.title !== undefined) updateData.title = body.title
        if (body.icon !== undefined) updateData.icon = body.icon
        if (body.color !== undefined) updateData.color = body.color
        if (body.position !== undefined) updateData.position = body.position

        const [updated] = await db.update(kanbanColumns)
            .set(updateData)
            .where(eq(kanbanColumns.id, columnId))
            .returning()

        return { success: true, data: updated }

    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Erro interno do servidor'
        })
    }
})
