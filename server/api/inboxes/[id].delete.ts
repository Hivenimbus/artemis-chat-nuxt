import { eq, and, inArray } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID da caixa de entrada é obrigatório' })

    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Usuário não possui empresa vinculada' })

    const [inbox] = await db.select().from(schema.inboxes)
      .where(and(eq(schema.inboxes.id, id), eq(schema.inboxes.empresa_id, userData.empresa_id)))
      .limit(1)

    if (!inbox) throw createError({ statusCode: 404, statusMessage: 'Caixa de entrada não encontrada ou sem permissão' })

    // Deletar instância na API-MEOW
    try {
      await $fetch(`${config.meowApiUrl}/api/instances/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${config.meowApiKey}` }
      })
    } catch (meowError) {
      console.error('Erro ao deletar instância na API-MEOW:', meowError)
    }

    // Limpar dados relacionados
    const atendimentosList = await db.select({ id: schema.atendimentos.id })
      .from(schema.atendimentos).where(eq(schema.atendimentos.inbox_id, id))

    const atendimentoIds = atendimentosList.map(a => a.id)

    if (atendimentoIds.length > 0) {
      await db.delete(schema.mensagens).where(inArray(schema.mensagens.atendimento_id, atendimentoIds))
      await db.delete(schema.atendimentos).where(inArray(schema.atendimentos.id, atendimentoIds))
    }

    await db.delete(schema.inboxAgents).where(eq(schema.inboxAgents.inbox_id, id))
    await db.delete(schema.inboxTeams).where(eq(schema.inboxTeams.inbox_id, id))

    // Desvincular campanhas (mantém histórico)
    await db.update(schema.campanhas).set({ inbox_id: null }).where(eq(schema.campanhas.inbox_id, id))

    // Deletar inbox
    await db.delete(schema.inboxes)
      .where(and(eq(schema.inboxes.id, id), eq(schema.inboxes.empresa_id, userData.empresa_id)))

    return { success: true, message: 'Caixa de entrada deletada com sucesso' }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
