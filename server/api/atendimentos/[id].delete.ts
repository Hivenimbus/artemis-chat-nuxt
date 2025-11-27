import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/atendimentos/[id].delete: Iniciando exclusão de atendimento')

    // Obter usuário autenticado
    const client = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await client.auth.getUser()

    if (userError || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    // Obter ID do atendimento
    const atendimentoId = getRouterParam(event, 'id')
    if (!atendimentoId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do atendimento é obrigatório'
      })
    }

    // Obter dados do usuário (para verificar empresa)
    const { data: userData, error: userDataError } = await client
      .from('users')
      .select('empresa_id, role')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData?.empresa_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Verificar se atendimento existe e pertence à empresa
    const { data: atendimento, error: atendimentoError } = await client
      .from('atendimentos')
      .select(`
        id,
        inboxes!inner (
          empresa_id
        )
      `)
      .eq('id', atendimentoId)
      .single()

    if (atendimentoError || !atendimento || atendimento.inboxes.empresa_id !== userData.empresa_id) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Atendimento não encontrado ou não pertence à sua empresa'
      })
    }

    // Excluir mensagens vinculadas (caso não haja CASCADE)
    // Isso é uma boa prática para garantir integridade
    const { error: deleteMessagesError } = await client
      .from('mensagens')
      .delete()
      .eq('atendimento_id', atendimentoId)

    if (deleteMessagesError) {
      console.error('Erro ao excluir mensagens do atendimento:', deleteMessagesError)
      // Continuamos mesmo assim, pois o banco pode ter CASCADE
    }

    // Excluir o atendimento
    const { error: deleteError } = await client
      .from('atendimentos')
      .delete()
      .eq('id', atendimentoId)

    if (deleteError) {
      console.error('Erro ao excluir atendimento:', deleteError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao excluir atendimento do banco de dados'
      })
    }

    console.log(`✅ Atendimento ${atendimentoId} excluído com sucesso`)

    return {
      success: true,
      message: 'Atendimento excluído com sucesso'
    }

  } catch (error) {
    console.error('API /api/atendimentos/[id].delete: Erro:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})

