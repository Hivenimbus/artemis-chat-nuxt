<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, inboxAgents, equipesAgentes } from '~/server/db/schema'
import { eq, inArray, desc } from 'drizzle-orm'
=======
import { eq, desc, inArray } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

<<<<<<< Updated upstream
    // Buscar empresa do usuário logado
    const userData = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData?.empresa_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não possui empresa vinculada'
      })
    }

    // Buscar agentes da mesma empresa
    const agentes = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        empresa_id: users.empresa_id,
        created_at: users.created_at
      })
      .from(users)
      .where(eq(users.empresa_id, userData.empresa_id))
      .orderBy(desc(users.created_at))

    // Buscar inbox_agents para cada agente
    const agenteIds = agentes.map(a => a.id)

    let inboxAgentsData: { user_id: string; inbox_id: string }[] = []
    let equipesAgentesData: { agente_id: string; equipe_id: string }[] = []

    if (agenteIds.length > 0) {
      inboxAgentsData = await db
        .select({ user_id: inboxAgents.user_id, inbox_id: inboxAgents.inbox_id })
        .from(inboxAgents)
        .where(inArray(inboxAgents.user_id, agenteIds))

      equipesAgentesData = await db
        .select({ agente_id: equipesAgentes.agente_id, equipe_id: equipesAgentes.equipe_id })
        .from(equipesAgentes)
        .where(inArray(equipesAgentes.agente_id, agenteIds))
    }

    // Agrupar por agente
    const agentesComRelacoes = agentes.map(agente => ({
      ...agente,
      inbox_agents: inboxAgentsData
        .filter(ia => ia.user_id === agente.id)
        .map(ia => ({ inbox_id: ia.inbox_id })),
      equipes_agentes: equipesAgentesData
        .filter(ea => ea.agente_id === agente.id)
        .map(ea => ({ equipe_id: ea.equipe_id }))
    }))

    return {
      success: true,
      data: agentesComRelacoes
    }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
=======
    if (!userData?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Usuário não possui empresa vinculada' })

    const agentes = await db.query.users.findMany({
      where: eq(schema.users.empresa_id, userData.empresa_id),
      orderBy: [desc(schema.users.created_at)],
      with: {
        empresa: { columns: { id: true, nome: true } },
        equipesAgentes: { with: { equipe: { columns: { id: true, nome: true } } } },
        inboxAgents: { columns: { inbox_id: true } }
      }
>>>>>>> Stashed changes
    })

    return { success: true, data: agentes }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
