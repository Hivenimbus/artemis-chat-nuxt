<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, inboxes, inboxAgents, inboxTeams, equipesAgentes } from '~/server/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
=======
import { eq, and, inArray, desc } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id, role: schema.users.role })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Usuário não possui empresa vinculada' })

    const isAdmin = userData.role === 'admin' || userData.role === 'superadmin'

    if (isAdmin) {
      const inboxesList = await db.select().from(schema.inboxes)
        .where(eq(schema.inboxes.empresa_id, userData.empresa_id))
        .orderBy(desc(schema.inboxes.created_at))
      return { success: true, data: inboxesList || [] }
    }

<<<<<<< Updated upstream
    // Buscar empresa do usuário
    const userData = await db
      .select({ empresa_id: users.empresa_id, role: users.role })
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

    // Admins e superadmins veem todas as inboxes da empresa
    if (userData.role === 'admin' || userData.role === 'superadmin') {
      const data = await db
        .select()
        .from(inboxes)
        .where(eq(inboxes.empresa_id, userData.empresa_id))
        .orderBy(inboxes.created_at)

      return { success: true, data }
    }

    // Agentes: buscar inboxes atribuídas diretamente
    const directAssignments = await db
      .select({ inbox_id: inboxAgents.inbox_id })
      .from(inboxAgents)
      .where(eq(inboxAgents.user_id, user.id))

    // Buscar equipes que o agente participa
    const userTeams = await db
      .select({ equipe_id: equipesAgentes.equipe_id })
      .from(equipesAgentes)
      .where(eq(equipesAgentes.agente_id, user.id))

    const teamIds = userTeams.map(t => t.equipe_id)

    let teamInboxIds: string[] = []

    if (teamIds.length > 0) {
      const teamAssignments = await db
        .select({ inbox_id: inboxTeams.inbox_id })
        .from(inboxTeams)
        .where(inArray(inboxTeams.equipe_id, teamIds))

      teamInboxIds = teamAssignments.map(t => t.inbox_id)
    }

    const directIds = directAssignments.map(a => a.inbox_id)
    const allAllowedInboxIds = [...new Set([...directIds, ...teamInboxIds])]

    if (allAllowedInboxIds.length === 0) {
      return { success: true, data: [] }
    }

    const data = await db
      .select()
      .from(inboxes)
      .where(
        and(
          eq(inboxes.empresa_id, userData.empresa_id),
          inArray(inboxes.id, allAllowedInboxIds)
        )
      )
      .orderBy(inboxes.created_at)

    return { success: true, data }

  } catch (error: any) {
    console.error('Erro no handler de listagem de inboxes:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
=======
    // Agent: find directly-assigned inbox IDs
    const directAssignments = await db.select({ inbox_id: schema.inboxAgents.inbox_id })
      .from(schema.inboxAgents).where(eq(schema.inboxAgents.user_id, user.id))

    // Find team inboxes
    const userTeams = await db.select({ equipe_id: schema.equipesAgentes.equipe_id })
      .from(schema.equipesAgentes).where(eq(schema.equipesAgentes.user_id, user.id))

    const teamIds = userTeams.map(t => t.equipe_id)
    let teamInboxIds: string[] = []

    if (teamIds.length > 0) {
      const teamAssignments = await db.select({ inbox_id: schema.inboxTeams.inbox_id })
        .from(schema.inboxTeams).where(inArray(schema.inboxTeams.equipe_id, teamIds))
      teamInboxIds = teamAssignments.map(t => t.inbox_id)
    }

    const directIds = directAssignments.map(a => a.inbox_id)
    const allAllowedInboxIds = [...new Set([...directIds, ...teamInboxIds])]

    if (allAllowedInboxIds.length === 0) {
      return { success: true, data: [] }
    }

    const inboxesList = await db.select().from(schema.inboxes)
      .where(and(eq(schema.inboxes.empresa_id, userData.empresa_id), inArray(schema.inboxes.id, allAllowedInboxIds)))
      .orderBy(desc(schema.inboxes.created_at))

    return { success: true, data: inboxesList || [] }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
>>>>>>> Stashed changes
  }
})
