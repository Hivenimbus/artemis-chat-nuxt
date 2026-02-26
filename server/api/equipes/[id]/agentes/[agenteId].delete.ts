import { db } from '~/server/db'
import { users, equipes, equipesAgentes } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    try {
        const user = event.context.user
        if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

        const equipeId = getRouterParam(event, 'id')
        const agenteId = getRouterParam(event, 'agenteId')

        if (!equipeId || !agenteId) {
            throw createError({ statusCode: 400, statusMessage: 'IDs são obrigatórios' })
        }

        const [dbUser] = await db.select({ empresa_id: users.empresa_id })
            .from(users).where(eq(users.id, user.id)).limit(1)

        if (!dbUser?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Usuário sem empresa' })

        // Verificar se a equipe pertence à empresa
        const [equipe] = await db.select({ id: equipes.id, empresa_id: equipes.empresa_id })
            .from(equipes).where(eq(equipes.id, equipeId)).limit(1)

        if (!equipe || equipe.empresa_id !== dbUser.empresa_id) {
            throw createError({ statusCode: 404, statusMessage: 'Equipe não encontrada' })
        }

        await db.delete(equipesAgentes)
            .where(and(
                eq(equipesAgentes.equipe_id, equipeId),
                eq(equipesAgentes.agente_id, agenteId)
            ))

        return { success: true }

    } catch (error: any) {
        if (error.statusCode) throw error
        throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
    }
})
