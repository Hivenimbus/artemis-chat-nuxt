import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const id = event.context.params?.id
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID não fornecido' })

    const body = await readBody(event)
    const { nome, descricao, inbox_ids } = body

    const [teamData] = await db.select({ empresa_id: schema.equipes.empresa_id }).from(schema.equipes).where(eq(schema.equipes.id, id)).limit(1)
    if (!teamData) throw createError({ statusCode: 404, statusMessage: 'Equipe não encontrada' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id, role: schema.users.role }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1)
    if (userData?.role !== 'superadmin' && userData?.empresa_id !== teamData.empresa_id) {
      throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })
    }

    await db.update(schema.equipes)
      .set({ nome, descricao, updated_at: new Date() })
      .where(eq(schema.equipes.id, id))

    if (inbox_ids && Array.isArray(inbox_ids)) {
      await db.delete(schema.inboxTeams).where(eq(schema.inboxTeams.equipe_id, id))
      if (inbox_ids.length > 0) {
        const inboxTeams = inbox_ids.map((inboxId: string) => ({ equipe_id: id, inbox_id: inboxId }))
        await db.insert(schema.inboxTeams).values(inboxTeams)
      }
    }

    return { success: true }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})
