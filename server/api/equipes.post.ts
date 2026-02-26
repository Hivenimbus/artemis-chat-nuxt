<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, equipes, inboxTeams } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
=======
import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
    // Verificar permissão
    const requestorData = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (requestorData?.empresa_id !== empresa_id) {
      if (user.role !== 'superadmin') {
        throw createError({ statusCode: 403, statusMessage: 'Sem permissão para esta empresa' })
      }
    }

    // Criar equipe
    const newTeam = await db
      .insert(equipes)
      .values({
        nome,
        empresa_id
      })
      .returning()
      .then(r => r[0])

    if (!newTeam) {
      console.error('Erro ao criar equipe: nenhum registro retornado')
      throw createError({ statusCode: 500, statusMessage: 'Erro ao criar equipe' })
    }

    // Associar caixas de entrada se fornecidas
    if (inbox_ids && Array.isArray(inbox_ids) && inbox_ids.length > 0) {
      const inboxTeamRows = inbox_ids.map((inboxId: string) => ({
        equipe_id: newTeam.id,
        inbox_id: inboxId
      }))

      try {
        await db.insert(inboxTeams).values(inboxTeamRows)
      } catch (inboxError) {
        console.error('Erro ao associar inboxes à equipe:', inboxError)
      }
=======
    const [newTeam] = await db.insert(schema.equipes).values({ nome, descricao, empresa_id }).returning()

    if (!newTeam) throw createError({ statusCode: 500, statusMessage: 'Erro ao criar equipe' })

    if (inbox_ids && Array.isArray(inbox_ids) && inbox_ids.length > 0) {
      const inboxTeams = inbox_ids.map((inboxId: string) => ({ equipe_id: newTeam.id, inbox_id: inboxId }))
      await db.insert(schema.inboxTeams).values(inboxTeams)
>>>>>>> Stashed changes
    }

    return { success: true, data: newTeam }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})
