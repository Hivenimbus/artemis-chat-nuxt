import { db } from '~/server/db'
import { users, empresas, equipes, equipesAgentes, inboxTeams } from '~/server/db/schema'
import { eq, inArray, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    // Buscar info do usuário
    const userData = await db
      .select({ empresa_id: users.empresa_id, role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário inválido' })
    }

    // Se não for superadmin e não tiver empresa, retornar vazio
    if (userData.role !== 'superadmin' && !userData.empresa_id) {
      return { success: true, data: [] }
    }

    // Buscar equipes (filtradas por empresa se não for superadmin)
    const equipesList = userData.role === 'superadmin'
      ? await db
          .select()
          .from(equipes)
          .orderBy(desc(equipes.created_at))
      : await db
          .select()
          .from(equipes)
          .where(eq(equipes.empresa_id, userData.empresa_id!))
          .orderBy(desc(equipes.created_at))

    if (equipesList.length === 0) {
      return { success: true, data: [] }
    }

    const equipeIds = equipesList.map(e => e.id)

    // Buscar empresas para enriquecer as equipes
    const empresaIds = [...new Set(equipesList.map(e => e.empresa_id).filter(Boolean))] as string[]
    const empresasList = empresaIds.length > 0
      ? await db
          .select({ id: empresas.id, nome: empresas.nome })
          .from(empresas)
          .where(inArray(empresas.id, empresaIds))
      : []

    // Buscar associações de inboxes para as equipes
    const inboxTeamsList = await db
      .select({ inbox_id: inboxTeams.inbox_id, equipe_id: inboxTeams.equipe_id })
      .from(inboxTeams)
      .where(inArray(inboxTeams.equipe_id, equipeIds))

    // Montar resultado enriquecido
    const teams = equipesList.map(equipe => {
      const empresa = empresasList.find(em => em.id === equipe.empresa_id) || null
      const inboxAssocs = inboxTeamsList
        .filter(it => it.equipe_id === equipe.id)
        .map(it => ({ inbox_id: it.inbox_id }))

      return {
        ...equipe,
        empresas: empresa,
        inbox_teams: inboxAssocs
      }
    })

    return {
      success: true,
      data: teams
    }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})
