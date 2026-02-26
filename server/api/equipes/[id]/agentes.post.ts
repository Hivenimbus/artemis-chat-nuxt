import { db } from '~/server/db'
import { users, equipes, equipesAgentes } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    try {
        const user = event.context.user
        if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

        const equipeId = getRouterParam(event, 'id')
        if (!equipeId) throw createError({ statusCode: 400, statusMessage: 'ID da equipe é obrigatório' })

        const [dbUser] = await db.select({ empresa_id: users.empresa_id })
            .from(users).where(eq(users.id, user.id)).limit(1)

        if (!dbUser?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Usuário sem empresa' })

        // Verificar se a equipe pertence à empresa
        const [equipe] = await db.select({ id: equipes.id, empresa_id: equipes.empresa_id })
            .from(equipes).where(eq(equipes.id, equipeId)).limit(1)

        if (!equipe || equipe.empresa_id !== dbUser.empresa_id) {
            throw createError({ statusCode: 404, statusMessage: 'Equipe não encontrada' })
        }

        const body = await readBody(event)
        if (!body?.agente_id) throw createError({ statusCode: 400, statusMessage: 'agente_id é obrigatório' })

        await db.insert(equipesAgentes)
            .values({ equipe_id: equipeId, agente_id: body.agente_id })
            .onConflictDoNothing()

        return { success: true }

    } catch (error: any) {
        if (error.statusCode) throw error
        throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
    }
})
