import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/atendimentos/[id]/resolve: Iniciando resolução de atendimento')

    // Obter usuário autenticado
    const client = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await client.auth.getUser()

    if (userError || !user) {
      console.error('API /api/atendimentos/[id]/resolve: Erro de autenticação:', userError)
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
      console.error('API /api/atendimentos/[id]/resolve: Usuário sem empresa:', userDataError)
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
        status,
        usuario_responsavel_id,
        contato_id,
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

    // Verificar se usuário pode resolver o atendimento
    if (atendimento.usuario_responsavel_id && atendimento.usuario_responsavel_id !== user.id) {
      // Se não for admin, só o responsável pode resolver
      if (userData.role !== 'admin' && userData.role !== 'superadmin') {
        throw createError({
          statusCode: 403,
          statusMessage: 'Apenas o responsável pelo atendimento pode resolver'
        })
      }
    }

    // Verificar se atendimento já está concluído
    if (atendimento.status === 'concluido') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Atendimento já está concluído'
      })
    }

    // Atualizar atendimento para concluído
    const { data: atendimentoAtualizado, error: updateError } = await client
      .from('atendimentos')
      .update({
        status: 'concluido',
        data_conclusao: new Date().toISOString(),
        unread_count: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', atendimentoId)
      .select(`
        id,
        contato_id,
        inbox_id,
        usuario_responsavel_id,
        status,
        ultimo_mensagem,
        ultimo_mensagem_time,
        unread_count,
        data_atribuicao,
        data_conclusao,
        created_at,
        updated_at,
        contatos!atendimentos_contato_id_fkey (
          id,
          nome,
          telefone,
          email,
          empresa
        ),
        inboxes (
          id,
          name,
          description
        ),
        users!atendimentos_usuario_responsavel_id_fkey (
          id,
          name,
          email
        )
      `)
      .single()

    if (updateError) {
      console.error('API /api/atendimentos/[id]/resolve: Erro ao resolver atendimento:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao resolver atendimento'
      })
    }

    // Marcar todas as mensagens não lidas como lidas
    await client
      .from('mensagens')
      .update({ lida: true })
      .eq('atendimento_id', atendimentoId)
      .eq('lida', false)

    console.log('API /api/atendimentos/[id]/resolve: Atendimento resolvido com sucesso:', atendimentoId)

    // Formatar resposta
    const atendimentoFormatado = {
      id: atendimentoAtualizado.id,
      contato_id: atendimentoAtualizado.contato_id,
      inbox_id: atendimentoAtualizado.inbox_id,
      name: atendimentoAtualizado.contatos?.nome || 'Contato',
      phone: atendimentoAtualizado.contatos?.telefone || '',
      email: atendimentoAtualizado.contatos?.email || '',
      company: atendimentoAtualizado.contatos?.empresa || '',
      lastMessage: atendimentoAtualizado.ultimo_mensagem || '',
      lastMessageTime: atendimentoAtualizado.ultimo_mensagem_time ? new Date(atendimentoAtualizado.ultimo_mensagem_time) : new Date(atendimentoAtualizado.created_at),
      unreadCount: 0,
      status: atendimentoAtualizado.status,
      caixa_entrada: atendimentoAtualizado.inbox_id,
      inbox_name: atendimentoAtualizado.inboxes?.name || 'Sem caixa',
      usuario_responsavel_id: atendimentoAtualizado.usuario_responsavel_id,
      responsavel_name: atendimentoAtualizado.users?.name || null,
      data_atribuicao: atendimentoAtualizado.data_atribuicao,
      data_conclusao: atendimentoAtualizado.data_conclusao,
      created_at: atendimentoAtualizado.created_at,
      updated_at: atendimentoAtualizado.updated_at,
      tags: [],
      messages: []
    }

    return {
      success: true,
      data: atendimentoFormatado,
      message: 'Atendimento resolvido com sucesso'
    }

  } catch (error) {
    console.error('API /api/atendimentos/[id]/resolve: Erro no handler:', error)

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