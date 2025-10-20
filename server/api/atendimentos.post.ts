import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/atendimentos POST: Iniciando criação de atendimento')

    // Obter usuário autenticado
    const client = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await client.auth.getUser()

    if (userError || !user) {
      console.error('API /api/atendimentos POST: Erro de autenticação:', userError)
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    // Obter dados do usuário
    const { data: userData, error: userDataError } = await client
      .from('users')
      .select('empresa_id, role')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData?.empresa_id) {
      console.error('API /api/atendimentos POST: Usuário sem empresa:', userDataError)
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Obter corpo da requisição
    const body = await readBody(event)
    const { contato_id, inbox_id, ultimo_mensagem } = body

    // Validar campos obrigatórios
    if (!contato_id || !inbox_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'contato_id e inbox_id são obrigatórios'
      })
    }

    // Verificar se contato pertence à mesma empresa
    const { data: contato, error: contatoError } = await client
      .from('contatos')
      .select('empresa_id')
      .eq('id', contato_id)
      .single()

    if (contatoError || !contato || contato.empresa_id !== userData.empresa_id) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Contato não encontrado ou não pertence à sua empresa'
      })
    }

    // Verificar se inbox pertence à mesma empresa
    const { data: inbox, error: inboxError } = await client
      .from('inboxes')
      .select('empresa_id')
      .eq('id', inbox_id)
      .single()

    if (inboxError || !inbox || inbox.empresa_id !== userData.empresa_id) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Caixa de entrada não encontrada ou não pertence à sua empresa'
      })
    }

    // Verificar se já existe um atendimento ativo para este contato
    const { data: atendimentoExistente, error: atendimentoExistenteError } = await client
      .from('atendimentos')
      .select('id, status')
      .eq('contato_id', contato_id)
      .in('status', ['aguardando', 'ativo'])
      .single()

    if (atendimentoExistente && !atendimentoExistenteError) {
      console.log('API /api/atendimentos POST: Atendimento já existe, retornando existente')
      return {
        success: true,
        data: atendimentoExistente,
        message: 'Atendimento já existe para este contato'
      }
    }

    // Criar novo atendimento
    const { data: novoAtendimento, error: createError } = await client
      .from('atendimentos')
      .insert({
        contato_id,
        inbox_id,
        status: 'aguardando',
        ultimo_mensagem: ultimo_mensagem || null,
        ultimo_mensagem_time: ultimo_mensagem ? new Date().toISOString() : null,
        unread_count: ultimo_mensagem ? 1 : 0
      })
      .select(`
        id,
        contato_id,
        inbox_id,
        usuario_responsavel_id,
        status,
        ultimo_mensagem,
        ultimo_mensagem_time,
        unread_count,
        created_at,
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
        )
      `)
      .single()

    if (createError) {
      console.error('API /api/atendimentos POST: Erro ao criar atendimento:', createError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao criar atendimento'
      })
    }

    // Atualizar contato com informações do atendimento
    await client
      .from('contatos')
      .update({
        ultimo_atendimento_id: novoAtendimento.id,
        data_ultimo_contato: new Date().toISOString()
      })
      .eq('id', contato_id)

    console.log('API /api/atendimentos POST: Atendimento criado com sucesso:', novoAtendimento.id)

    // Formatar resposta
    const atendimentoFormatado = {
      id: novoAtendimento.id,
      contato_id: novoAtendimento.contato_id,
      inbox_id: novoAtendimento.inbox_id,
      name: novoAtendimento.contatos?.nome || 'Contato',
      phone: novoAtendimento.contatos?.telefone || '',
      email: novoAtendimento.contatos?.email || '',
      company: novoAtendimento.contatos?.empresa || '',
      lastMessage: novoAtendimento.ultimo_mensagem || '',
      lastMessageTime: novoAtendimento.ultimo_mensagem_time ? new Date(novoAtendimento.ultimo_mensagem_time) : new Date(novoAtendimento.created_at),
      unreadCount: novoAtendimento.unread_count || 0,
      status: novoAtendimento.status,
      caixa_entrada: novoAtendimento.inbox_id,
      inbox_name: novoAtendimento.inboxes?.name || 'Sem caixa',
      created_at: novoAtendimento.created_at,
      tags: [],
      messages: []
    }

    return {
      success: true,
      data: atendimentoFormatado,
      message: 'Atendimento criado com sucesso'
    }

  } catch (error) {
    console.error('API /api/atendimentos POST: Erro no handler:', error)

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