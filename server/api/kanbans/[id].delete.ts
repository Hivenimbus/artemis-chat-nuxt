import { db } from '~/server/db'
import { users, kanbans } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

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
        const [existing] = await db.select({ id: kanbans.id, empresa_id: kanbans.empresa_id })
            .from(kanbans).where(eq(kanbans.id, kanbanId)).limit(1)

        if (!existing || existing.empresa_id !== dbUser.empresa_id) {
            throw createError({ statusCode: 404, statusMessage: 'Kanban não encontrado' })
        }

        await db.delete(kanbans).where(eq(kanbans.id, kanbanId))

        return { success: true, message: 'Kanban excluído com sucesso' }

    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Erro interno do servidor'
        })
    }
})
