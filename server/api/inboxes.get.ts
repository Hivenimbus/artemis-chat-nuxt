import { eq, and, inArray, desc } from 'drizzle-orm'
import { db, schema } from '~/server/database'

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
  }
})
