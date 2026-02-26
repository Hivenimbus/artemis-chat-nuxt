<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, inboxes, inboxAgents, inboxTeams, atendimentos, mensagens, contatos, agendamentos, agendamentoContatos, campanhas } from '~/server/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
=======
import { eq, and, inArray } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes
import { findEvolutionInstanceId } from '../../lib/evolution'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID da caixa de entrada é obrigatório' })

<<<<<<< Updated upstream
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID da caixa de entrada é obrigatório'
      })
    }

=======
>>>>>>> Stashed changes
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

<<<<<<< Updated upstream
    // Buscar empresa do usuário
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

    // Verificar se o inbox existe e pertence à empresa do usuário
    const inbox = await db
      .select()
      .from(inboxes)
      .where(and(eq(inboxes.id, id), eq(inboxes.empresa_id, userData.empresa_id)))
      .limit(1)
      .then(r => r[0])

    if (!inbox) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Caixa de entrada não encontrada ou sem permissão'
      })
    }

    // Deletar instância na Evolution API (se existir)
=======
    if (!userData?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Usuário não possui empresa vinculada' })

    const [inbox] = await db.select().from(schema.inboxes)
      .where(and(eq(schema.inboxes.id, id), eq(schema.inboxes.empresa_id, userData.empresa_id)))
      .limit(1)

    if (!inbox) throw createError({ statusCode: 404, statusMessage: 'Caixa de entrada não encontrada ou sem permissão' })

    // Delete Evolution instance
>>>>>>> Stashed changes
    try {
      const evolutionInstanceId = await findEvolutionInstanceId(config, id)
      if (evolutionInstanceId) {
<<<<<<< Updated upstream
        console.log(`Deletando instância na Evolution: ${evolutionInstanceId} (Nome: ${id})`)
=======
>>>>>>> Stashed changes
        await $fetch(`${config.evolutionApiUrl}/instance/delete/${evolutionInstanceId}`, {
          method: 'DELETE',
          headers: { 'apikey': config.evolutionApiKey }
        })
<<<<<<< Updated upstream
        console.log('Instância deletada com sucesso na Evolution API')
      } else {
        console.warn(`Instância não encontrada na Evolution para deleção: ${id}`)
        try {
          await $fetch(`${config.evolutionApiUrl}/instance/delete/${id}`, {
            method: 'DELETE',
            headers: {
              'apikey': config.evolutionApiKey
            }
          })
        } catch (e) {
          // Ignorar erro do fallback
        }
=======
>>>>>>> Stashed changes
      }
    } catch (evolutionError) {
      console.error('Erro ao deletar instância na Evolution API:', evolutionError)
    }

<<<<<<< Updated upstream
    // --- CLEANUP RELACIONADO ---
    console.log('Iniciando limpeza de dados relacionados à inbox...')

    // 1. Buscar atendimentos da inbox
    const atendimentoRows = await db
      .select({ id: atendimentos.id })
      .from(atendimentos)
      .where(eq(atendimentos.inbox_id, id))

    const atendimentoIds = atendimentoRows.map(a => a.id)

    if (atendimentoIds.length > 0) {
      console.log(`Processando ${atendimentoIds.length} atendimentos relacionados...`)

      // 1.1 Limpar referência em contatos (ultimo_atendimento_id) para evitar violação de FK
      await db
        .update(contatos)
        .set({ ultimo_atendimento_id: null })
        .where(inArray(contatos.ultimo_atendimento_id, atendimentoIds))

      // 1.2 Deletar mensagens dos atendimentos
      await db
        .delete(mensagens)
        .where(inArray(mensagens.atendimento_id, atendimentoIds))

      // 1.3 Deletar atendimentos
      await db
        .delete(atendimentos)
        .where(inArray(atendimentos.id, atendimentoIds))
    }

    // 2. Limpar relacionamentos de equipe e agentes
    await db.delete(inboxAgents).where(eq(inboxAgents.inbox_id, id))
    await db.delete(inboxTeams).where(eq(inboxTeams.inbox_id, id))

    // 3. Limpar agendamentos
    const agendamentoRows = await db
      .select({ id: agendamentos.id })
      .from(agendamentos)
      .where(eq(agendamentos.inbox_id, id))

    const agendamentoIds = agendamentoRows.map(a => a.id)

    if (agendamentoIds.length > 0) {
      console.log(`Processando ${agendamentoIds.length} agendamentos relacionados...`)

      await db
        .delete(agendamentoContatos)
        .where(inArray(agendamentoContatos.agendamento_id, agendamentoIds))

      await db
        .delete(agendamentos)
        .where(inArray(agendamentos.id, agendamentoIds))
    }

    // 4. Desvincular campanhas (manter histórico, mas remover vínculo)
    await db
      .update(campanhas)
      .set({ inbox_id: null })
      .where(eq(campanhas.inbox_id, id))

    console.log('Dados relacionados limpos com sucesso')
    // --- END CLEANUP ---

    // Deletar o inbox
    await db
      .delete(inboxes)
      .where(and(eq(inboxes.id, id), eq(inboxes.empresa_id, userData.empresa_id)))

    return {
      success: true,
      message: 'Caixa de entrada deletada com sucesso'
    }

  } catch (error: any) {
    console.error('Erro no handler de deleção de inbox:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
=======
    // Cleanup related data - get atendimento ids
    const atendimentosList = await db.select({ id: schema.atendimentos.id })
      .from(schema.atendimentos).where(eq(schema.atendimentos.inbox_id, id))

    const atendimentoIds = atendimentosList.map(a => a.id)

    if (atendimentoIds.length > 0) {
      await db.delete(schema.mensagens).where(inArray(schema.mensagens.atendimento_id, atendimentoIds))
      await db.delete(schema.atendimentos).where(inArray(schema.atendimentos.id, atendimentoIds))
    }

    await db.delete(schema.inboxAgents).where(eq(schema.inboxAgents.inbox_id, id))
    await db.delete(schema.inboxTeams).where(eq(schema.inboxTeams.inbox_id, id))

    // Unlink campanhas (keep history)
    await db.update(schema.campanhas).set({ inbox_id: null }).where(eq(schema.campanhas.inbox_id, id))

    // Delete inbox
    await db.delete(schema.inboxes)
      .where(and(eq(schema.inboxes.id, id), eq(schema.inboxes.empresa_id, userData.empresa_id)))

    return { success: true, message: 'Caixa de entrada deletada com sucesso' }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
>>>>>>> Stashed changes
  }
})
