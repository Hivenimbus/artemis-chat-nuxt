import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/atendimentos/[id]/assign: Iniciando atribuição de atendimento')

    // Obter usuário do contexto (injetado pelo middleware 01-auth-check)
    const user = event.context.user

    if (!user) {
      console.error('API /api/atendimentos/[id]/assign: Usuário não autenticado no contexto')
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

    const client = serverSupabaseServiceRole(event)

    // Obter dados do usuário
    const { data: userData, error: userDataError } = await client
      .from('users')
      .select('empresa_id, role')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData?.empresa_id) {
      console.error('API /api/atendimentos/[id]/assign: Usuário sem empresa:', userDataError)
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

    // Verificar se atendimento já está atribuído
    if (atendimento.usuario_responsavel_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Atendimento já está atribuído a outro usuário'
      })
    }

    // Verificar se atendimento pode ser atribuído (status deve ser 'aguardando')
    if (atendimento.status !== 'aguardando') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Apenas atendimentos com status "aguardando" podem ser atribuídos'
      })
    }

    // Atualizar atendimento
    const { data: atendimentoAtualizado, error: updateError } = await client
      .from('atendimentos')
      .update({
        usuario_responsavel_id: user.id,
        status: 'ativo',
        data_atribuicao: new Date().toISOString(),
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
      console.error('API /api/atendimentos/[id]/assign: Erro ao atribuir atendimento:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao atribuir atendimento'
      })
    }

    console.log('API /api/atendimentos/[id]/assign: Atendimento atribuído com sucesso:', atendimentoId)

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
      unreadCount: atendimentoAtualizado.unread_count || 0,
      status: atendimentoAtualizado.status,
      caixa_entrada: atendimentoAtualizado.inbox_id,
      inbox_name: atendimentoAtualizado.inboxes?.name || 'Sem caixa',
      usuario_responsavel_id: atendimentoAtualizado.usuario_responsavel_id,
      responsavel_name: atendimentoAtualizado.users?.name || null,
      data_atribuicao: atendimentoAtualizado.data_atribuicao,
      created_at: atendimentoAtualizado.created_at,
      updated_at: atendimentoAtualizado.updated_at,
      tags: [],
      messages: []
    }

    return {
      success: true,
      data: atendimentoFormatado,
      message: 'Atendimento atribuído com sucesso'
    }

  } catch (error) {
    console.error('API /api/atendimentos/[id]/assign: Erro no handler:', error)

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
