import { db } from '~/server/db'
import { users, inboxAgents } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID não fornecido' })

    const body = await readBody(event)
    const { name, email, role, inbox_ids } = body

    // Verificar permissão (mesma empresa)
    const requestorData = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    const targetUser = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
      .then(r => r[0])

    if (!requestorData?.empresa_id || requestorData.empresa_id !== targetUser?.empresa_id) {
      throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })
    }

    // Atualizar usuário
    await db
      .update(users)
      .set({ name, email, role })
      .where(eq(users.id, id))

    // Atualizar associações de inboxes se fornecido
    if (inbox_ids && Array.isArray(inbox_ids)) {
      // Primeiro remover todas as associações existentes
      try {
        await db
          .delete(inboxAgents)
          .where(eq(inboxAgents.user_id, id))
      } catch (deleteError) {
        console.error('Erro ao limpar inboxes do agente:', deleteError)
        throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar associações de inboxes' })
      }

      // Inserir novas associações se houver
      if (inbox_ids.length > 0) {
        const inboxAgentsValues = inbox_ids.map((inboxId: string) => ({
          user_id: id,
          inbox_id: inboxId
        }))

        try {
          await db.insert(inboxAgents).values(inboxAgentsValues)
        } catch (insertError) {
          console.error('Erro ao adicionar inboxes ao agente:', insertError)
          throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar associações de inboxes' })
        }
      }
    }

    return { success: true }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})
