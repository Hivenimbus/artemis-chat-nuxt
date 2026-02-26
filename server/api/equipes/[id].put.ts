import { db } from '~/server/db'
import { users, equipes, inboxTeams } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const id = event.context.params?.id
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID não fornecido' })

    const body = await readBody(event)
    const { nome, descricao, inbox_ids } = body

    // Verificar se equipe existe e pertence à empresa do usuário
    const teamData = await db
      .select({ empresa_id: equipes.empresa_id })
      .from(equipes)
      .where(eq(equipes.id, id))
      .limit(1)
      .then(r => r[0])

    if (!teamData) {
      throw createError({ statusCode: 404, statusMessage: 'Equipe não encontrada' })
    }

    // Buscar dados do usuário solicitante
    const userData = await db
      .select({ empresa_id: users.empresa_id, role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (userData?.role !== 'superadmin' && userData?.empresa_id !== teamData.empresa_id) {
      throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })
    }

    // Atualizar equipe
    await db
      .update(equipes)
      .set({
        nome,
        updated_at: new Date()
      })
      .where(eq(equipes.id, id))

    // Atualizar associações de inboxes se fornecido
    if (inbox_ids && Array.isArray(inbox_ids)) {
      // Remover associações existentes
      await db
        .delete(inboxTeams)
        .where(eq(inboxTeams.equipe_id, id))

      // Inserir novas associações
      if (inbox_ids.length > 0) {
        const inboxTeamRows = inbox_ids.map((inboxId: string) => ({
          equipe_id: id,
          inbox_id: inboxId
        }))

        await db.insert(inboxTeams).values(inboxTeamRows)
      }
    }

    return { success: true }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})
