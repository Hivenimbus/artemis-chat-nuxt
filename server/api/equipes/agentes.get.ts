import { db } from '~/server/db'
import { users, equipes, equipesAgentes } from '~/server/db/schema'
import { eq, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    try {
        const user = event.context.user
        if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

        const [dbUser] = await db.select({ empresa_id: users.empresa_id })
            .from(users).where(eq(users.id, user.id)).limit(1)

        if (!dbUser?.empresa_id) {
            throw createError({ statusCode: 403, statusMessage: 'Usuário sem empresa associada' })
        }

        // Buscar equipes da empresa
        const equipesList = await db.select({ id: equipes.id })
            .from(equipes)
            .where(eq(equipes.empresa_id, dbUser.empresa_id))

        if (equipesList.length === 0) return { success: true, data: [] }

        const equipeIds = equipesList.map(e => e.id)

        // Buscar todos os equipes_agentes dessas equipes
        const teamAgentsData = await db.select()
            .from(equipesAgentes)
            .where(inArray(equipesAgentes.equipe_id, equipeIds))

        return {
            success: true,
            data: teamAgentsData.map(ta => ({
                equipe_id: ta.equipe_id,
                agente_id: ta.agente_id
            }))
        }

    } catch (error: any) {
        if (error.statusCode) throw error
        throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
    }
})
