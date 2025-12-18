import { serverSupabaseServiceRole } from '#supabase/server'
import { findEvolutionInstanceId } from '../../lib/evolution'

const config = useRuntimeConfig()

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID da caixa de entrada é obrigatório'
      })
    }

    // Obter usuário do contexto (autenticado via JWT)
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    // Usar Service Role para operações no banco
    const client = serverSupabaseServiceRole(event)

    // Buscar dados do usuário para obter empresa_id
    const { data: userData, error: userError } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.empresa_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não possui empresa vinculada'
      })
    }

    // Verificar se o inbox existe e pertence à empresa do usuário
    const { data: inbox, error: fetchError } = await client
      .from('inboxes')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', userData.empresa_id)
      .single()

    if (fetchError || !inbox) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Caixa de entrada não encontrada ou sem permissão'
      })
    }

    // Deletar instância na Evolution API (se existir)
    try {
      // Buscar o ID interno da Evolution (necessário para deletar)
      // O "name" na Evolution é o nosso "id" do inbox
      const evolutionInstanceId = await findEvolutionInstanceId(config, id)

      if (evolutionInstanceId) {
        console.log(`🗑️ Deletando instância na Evolution: ${evolutionInstanceId} (Nome: ${id})`)
        await $fetch(`${config.evolutionApiUrl}/instance/delete/${evolutionInstanceId}`, {
          method: 'DELETE',
          headers: {
            'apikey': config.evolutionApiKey
          }
        })
        console.log('✅ Instância deletada com sucesso na Evolution API')
      } else {
        console.warn(`⚠️ Instância não encontrada na Evolution para deleção: ${id}`)
        // Tentar deletar usando o ID do inbox diretamente como fallback, caso coincida
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
      }
    } catch (evolutionError) {
      console.error('Erro ao deletar instância na Evolution API:', evolutionError)
      // Continuar mesmo se der erro na Evolution
    }

    // --- CLEANUP RELATED DATA ---
    console.log('🗑️ Iniciando limpeza de dados relacionados à inbox...')

    // 1. Limpar Atendimentos e Mensagens
    const { data: atendimentos } = await client
      .from('atendimentos')
      .select('id')
      .eq('inbox_id', id)
    
    const atendimentoIds = atendimentos?.map(a => a.id) || []

    if (atendimentoIds.length > 0) {
      console.log(`🗑️ Processando ${atendimentoIds.length} atendimentos relacionados...`)
      
      // 1.1 Limpar referência em contatos (ultimo_atendimento_id) para evitar violação de FK
      const { error: updateContactsError } = await client
        .from('contatos')
        .update({ ultimo_atendimento_id: null })
        .in('ultimo_atendimento_id', atendimentoIds)
      
      if (updateContactsError) console.error('Erro ao limpar ultimo_atendimento_id:', updateContactsError)

      // 1.2 Deletar mensagens dos atendimentos
      const { error: deleteMessagesError } = await client
        .from('mensagens')
        .delete()
        .in('atendimento_id', atendimentoIds)

      if (deleteMessagesError) console.error('Erro ao deletar mensagens:', deleteMessagesError)

      // 1.3 Deletar atendimentos
      const { error: deleteAttendancesError } = await client
        .from('atendimentos')
        .delete()
        .in('id', atendimentoIds)

      if (deleteAttendancesError) console.error('Erro ao deletar atendimentos:', deleteAttendancesError)
    }

    // 2. Limpar Relacionamentos de Equipe e Agentes
    await client.from('inbox_agents').delete().eq('inbox_id', id)
    await client.from('inbox_teams').delete().eq('inbox_id', id)
    
    // 3. Limpar Agendamentos
    const { data: agendamentos } = await client
      .from('agendamentos')
      .select('id')
      .eq('inbox_id', id)

    const agendamentoIds = agendamentos?.map(a => a.id) || []

    if (agendamentoIds.length > 0) {
        console.log(`🗑️ Processando ${agendamentoIds.length} agendamentos relacionados...`)
        
        // 3.1 Deletar agendamento_contatos
        await client
            .from('agendamento_contatos')
            .delete()
            .in('agendamento_id', agendamentoIds)

        // 3.2 Deletar agendamentos
        await client
            .from('agendamentos')
            .delete()
            .in('id', agendamentoIds)
    }

    // 4. Desvincular Campanhas (manter histórico, mas remover vínculo)
    await client
      .from('campanhas')
      .update({ inbox_id: null })
      .eq('inbox_id', id)

    console.log('✅ Dados relacionados limpos com sucesso')
    // --- END CLEANUP ---

    // Deletar inbox do Supabase
    const { error: deleteError } = await client
      .from('inboxes')
      .delete()
      .eq('id', id)
      // Redundante com a verificação anterior, mas segurança adicional
      .eq('empresa_id', userData.empresa_id)

    if (deleteError) {
      console.error('Erro ao deletar inbox:', deleteError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao deletar caixa de entrada'
      })
    }

    return {
      success: true,
      message: 'Caixa de entrada deletada com sucesso'
    }

  } catch (error) {
    console.error('Erro no handler de deleção de inbox:', error)

    // Se já for um erro criado, retornar como está
    if (error.statusCode) {
      throw error
    }

    // Erro genérico
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
