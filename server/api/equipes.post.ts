import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const body = await readBody(event)
    const { nome, descricao, empresa_id, inbox_ids } = body

    if (!nome || !empresa_id) throw createError({ statusCode: 400, statusMessage: 'Dados incompletos' })

    const [requestorData] = await db.select({ empresa_id: schema.users.empresa_id, role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1)

    if (requestorData?.role !== 'superadmin' && requestorData?.empresa_id !== empresa_id) {
      throw createError({ statusCode: 403, statusMessage: 'Sem permissão para esta empresa' })
    }

    const [newTeam] = await db.insert(schema.equipes).values({ nome, descricao, empresa_id }).returning()

    if (!newTeam) throw createError({ statusCode: 500, statusMessage: 'Erro ao criar equipe' })

    if (inbox_ids && Array.isArray(inbox_ids) && inbox_ids.length > 0) {
      const inboxTeams = inbox_ids.map((inboxId: string) => ({ equipe_id: newTeam.id, inbox_id: inboxId }))
      await db.insert(schema.inboxTeams).values(inboxTeams)
    }

    return { success: true, data: newTeam }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})
