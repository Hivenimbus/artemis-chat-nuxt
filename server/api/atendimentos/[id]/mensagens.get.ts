import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/atendimentos/[id]/mensagens: Iniciando listagem de mensagens')

    // Obter usuário autenticado
    const client = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await client.auth.getUser()

    if (userError || !user) {
      console.error('API /api/atendimentos/[id]/mensagens: Erro de autenticação:', userError)
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

    // Obter dados do usuário
    const { data: userData, error: userDataError } = await client
      .from('users')
      .select('empresa_id, role')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData?.empresa_id) {
      console.error('API /api/atendimentos/[id]/mensagens: Usuário sem empresa:', userDataError)
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

    // Obter query parameters
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 100
    const offset = (page - 1) * limit

    // Buscar mensagens do atendimento
    const { data: mensagens, error: mensagensError, count } = await client
      .from('mensagens')
      .select(`
        id,
        atendimento_id,
        usuario_id,
        texto,
        remetente,
        lida,
        timestamp,
        created_at,
        message_type,
        media_url,
        media_type,
        media_name,
        evolution_message_id,
        evolution_status,
        users (
          id,
          name,
          email
        )
      `, { count: 'exact' })
      .eq('atendimento_id', atendimentoId)
      .order('timestamp', { ascending: true })
      .range(offset, offset + limit - 1)

    if (mensagensError) {
      console.error('API /api/atendimentos/[id]/mensagens: Erro ao buscar mensagens:', mensagensError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar mensagens'
      })
    }

    console.log('API /api/atendimentos/[id]/mensagens: Mensagens encontradas:', mensagens?.length || 0)

    // Formatar mensagens para o frontend
    const mensagensFormatadas = mensagens?.map(mensagem => ({
      id: mensagem.id,
      atendimento_id: mensagem.atendimento_id,
      text: mensagem.texto,
      texto: mensagem.texto, // Manter ambos para compatibilidade
      sender: mensagem.remetente,
      timestamp: mensagem.timestamp ? new Date(mensagem.timestamp) : new Date(mensagem.created_at),
      lida: mensagem.lida,
      usuario_id: mensagem.usuario_id,
      usuario_name: mensagem.users?.name || null,
      created_at: mensagem.created_at,
      // Campos de mídia
      message_type: mensagem.message_type,
      media_url: mensagem.media_url,
      media_type: mensagem.media_type,
      media_name: mensagem.media_name,
      evolution_message_id: mensagem.evolution_message_id,
      evolution_status: mensagem.evolution_status
    })) || []

    // Marcar mensagens não lidas como lidas (se o usuário for o responsável)
    if (mensagensFormatadas.length > 0) {
      // Verificar se o usuário é o responsável pelo atendimento
      const { data: atendimentoCheck } = await client
        .from('atendimentos')
        .select('usuario_responsavel_id')
        .eq('id', atendimentoId)
        .single()

      if (atendimentoCheck?.usuario_responsavel_id === user.id) {
        // Marcar mensagens não lidas como lidas
        await client
          .from('mensagens')
          .update({ lida: true })
          .eq('atendimento_id', atendimentoId)
          .eq('lida', false)
          .eq('remetente', 'contact')

        // Atualizar contador de mensagens não lidas no atendimento
        await client
          .from('atendimentos')
          .update({ unread_count: 0 })
          .eq('id', atendimentoId)
      }
    }

    // Calcular informações de paginação
    const totalItems = count || 0
    const totalPages = Math.ceil(totalItems / limit)

    console.log('API /api/atendimentos/[id]/mensagens: Retornando dados com sucesso')

    return {
      success: true,
      data: {
        mensagens: mensagensFormatadas,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    }

  } catch (error) {
    console.error('API /api/atendimentos/[id]/mensagens: Erro no handler:', error)

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