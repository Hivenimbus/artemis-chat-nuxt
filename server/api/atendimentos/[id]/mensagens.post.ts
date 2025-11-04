import { serverSupabaseClient } from '#supabase/server'
import { createEvolutionClient, formatPhoneNumberForWhatsApp } from '~/server/lib/evolution'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/atendimentos/[id]/mensagens POST: Iniciando envio de mensagem')

    // Obter usuário autenticado
    const client = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await client.auth.getUser()

    if (userError || !user) {
      console.error('API /api/atendimentos/[id]/mensagens POST: Erro de autenticação:', userError)
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
      console.error('API /api/atendimentos/[id]/mensagens POST: Usuário sem empresa:', userDataError)
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Obter corpo da requisição
    const body = await readBody(event)
    const { texto, mediaUrl, mediaType, caption } = body

    // Validar campos obrigatórios
    if (!texto || !texto.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Texto da mensagem é obrigatório'
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
        inbox_id,
        inboxes!inner (
          id,
          empresa_id,
          status,
          name
        ),
        contatos!inner (
          id,
          nome,
          telefone
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

    // Verificar se a inbox está conectada
    if (atendimento.inboxes.status !== 'connected') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Caixa de entrada não está conectada ao WhatsApp'
      })
    }

    // Verificar se usuário pode enviar mensagem
    if (atendimento.usuario_responsavel_id && atendimento.usuario_responsavel_id !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Apenas o responsável pelo atendimento pode enviar mensagens'
      })
    }

    // Se não tiver responsável, atribuir ao usuário atual
    if (!atendimento.usuario_responsavel_id) {
      await client
        .from('atendimentos')
        .update({
          usuario_responsavel_id: user.id,
          status: 'ativo',
          data_atribuicao: new Date().toISOString()
        })
        .eq('id', atendimentoId)
    }

    // Enviar mensagem através da Evolution API
    const evolutionClient = createEvolutionClient()
    const phoneNumber = formatPhoneNumberForWhatsApp(atendimento.contatos.telefone)

    let evolutionResponse: any = null

    try {
      console.log(`Enviando mensagem para ${phoneNumber} via instância ${atendimento.inboxes.id}`)

      if (mediaUrl && mediaType) {
        // Enviar mídia
        evolutionResponse = await evolutionClient.sendMediaMessage(
          atendimento.inboxes.id,
          phoneNumber,
          mediaUrl,
          mediaType,
          caption || texto.trim()
        )
      } else {
        // Enviar texto
        evolutionResponse = await evolutionClient.sendTextMessage(
          atendimento.inboxes.id,
          phoneNumber,
          texto.trim()
        )
      }

      console.log('Mensagem enviada para Evolution API:', evolutionResponse)
    } catch (evolutionError) {
      console.error('Erro ao enviar mensagem para Evolution API:', evolutionError)

      // Não impedir salvamento local, mas logar erro
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao enviar mensagem para o WhatsApp. Tente novamente.'
      })
    }

    // Criar mensagem no banco de dados
    const { data: novaMensagem, error: mensagemError } = await client
      .from('mensagens')
      .insert({
        atendimento_id: atendimentoId,
        usuario_id: user.id,
        texto: texto.trim(),
        remetente: 'user',
        lida: true,
        timestamp: new Date().toISOString(),
        message_type: mediaType ? mediaType : 'text',
        media_url: mediaUrl,
        media_type: mediaType,
        evolution_message_id: evolutionResponse?.key?.id || null
      })
      .select(`
        id,
        atendimento_id,
        usuario_id,
        texto,
        remetente,
        lida,
        timestamp,
        message_type,
        media_url,
        media_type,
        created_at,
        users (
          id,
          name,
          email
        )
      `)
      .single()

    if (mensagemError) {
      console.error('API /api/atendimentos/[id]/mensagens POST: Erro ao criar mensagem:', mensagemError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao salvar mensagem no banco de dados'
      })
    }

    // Atualizar informações do atendimento
    await client
      .from('atendimentos')
      .update({
        ultimo_mensagem: texto.trim(),
        ultimo_mensagem_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', atendimentoId)

    // Atualizar informações do contato
    await client
      .from('contatos')
      .update({
        data_ultimo_contato: new Date().toISOString(),
        total_mensagens: client.rpc('incrementar_total_mensagens', { contato_id: atendimento.contato_id })
      })
      .eq('id', atendimento.contato_id)

    console.log('API /api/atendimentos/[id]/mensagens POST: Mensagem enviada com sucesso:', novaMensagem.id)

    // Formatar resposta
    const mensagemFormatada = {
      id: novaMensagem.id,
      atendimento_id: novaMensagem.atendimento_id,
      text: novaMensagem.texto,
      sender: novaMensagem.remetente,
      timestamp: novaMensagem.timestamp ? new Date(novaMensagem.timestamp) : new Date(novaMensagem.created_at),
      lida: novaMensagem.lida,
      usuario_id: novaMensagem.usuario_id,
      usuario_name: novaMensagem.users?.name || null,
      created_at: novaMensagem.created_at,
      message_type: novaMensagem.message_type,
      media_url: novaMensagem.media_url,
      media_type: novaMensagem.media_type,
      evolution_status: evolutionResponse ? 'sent' : 'pending'
    }

    return {
      success: true,
      data: mensagemFormatada,
      evolution_response: evolutionResponse,
      message: 'Mensagem enviada com sucesso'
    }

  } catch (error) {
    console.error('API /api/atendimentos/[id]/mensagens POST: Erro no handler:', error)

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