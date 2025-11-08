import { serverSupabaseClient } from '#supabase/server'
import { sendTextMessageToWhatsApp, sendMediaToWhatsApp } from '~/server/lib/evolution'

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

    // Obter corpo da requisição (suporta JSON e multipart/form-data)
    const contentType = getHeader(event, 'content-type') || ''
    let texto = ''
    let arquivo: any = null

    if (contentType.includes('multipart/form-data')) {
      // Processar form-data (com arquivo)
      const formData = await readMultipartFormData(event)

      if (!formData) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Dados do formulário não foram enviados'
        })
      }

      // Extrair campos
      for (const field of formData) {
        if (field.name === 'texto') {
          texto = field.data.toString('utf-8')
        } else if (field.name === 'file') {
          arquivo = field
        }
      }
    } else {
      // Processar JSON
      const body = await readBody(event)
      texto = body.texto || ''
    }

    // Validar: precisa ter texto OU arquivo (texto pode ser vazio se houver arquivo)
    if (!arquivo && (!texto || !texto.trim())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Texto ou arquivo é obrigatório'
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
        inboxes (
          id,
          empresa_id
        ),
        contatos!atendimentos_contato_id_fkey (
          id,
          telefone
        )
      `)
      .eq('id', atendimentoId)
      .single()

    // Validação 1: Verificar se atendimento existe
    if (atendimentoError || !atendimento) {
      console.error('API /api/atendimentos/[id]/mensagens POST: Erro ao buscar atendimento:', atendimentoError)
      throw createError({
        statusCode: 404,
        statusMessage: 'Atendimento não encontrado'
      })
    }

    // Validação 2: Verificar se relações foram carregadas
    if (!atendimento.inboxes || !atendimento.contatos) {
      console.error('API /api/atendimentos/[id]/mensagens POST: Relações não carregadas', {
        hasInbox: !!atendimento.inboxes,
        hasContato: !!atendimento.contatos,
        atendimentoId
      })
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao carregar dados do atendimento'
      })
    }

    // Validação 3: Verificar se pertence à empresa do usuário
    if (atendimento.inboxes.empresa_id !== userData.empresa_id) {
      console.error('API /api/atendimentos/[id]/mensagens POST: Empresa diferente', {
        inboxEmpresaId: atendimento.inboxes.empresa_id,
        userEmpresaId: userData.empresa_id
      })
      throw createError({
        statusCode: 403,
        statusMessage: 'Atendimento não pertence à sua empresa'
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

    // Variáveis para armazenar dados de mídia
    let mediaUrl: string | null = null
    let mediaType: string | null = null
    let mediaName: string | null = null
    let messageType: 'text' | 'image' | 'video' | 'audio' | 'document' = 'text'
    let evolutionMediaType: 'image' | 'video' | 'audio' | 'document' | null = null

    // Processar upload de arquivo se existir
    if (arquivo) {
      console.log('API /api/atendimentos/[id]/mensagens POST: Processando upload de arquivo:', arquivo.filename)

      // Validar tamanho (16MB máximo)
      const maxSize = 16 * 1024 * 1024 // 16MB
      if (arquivo.data.length > maxSize) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Arquivo muito grande. Máximo: 16MB'
        })
      }

      // Detectar tipo de mídia pelo MIME type
      const mimeType = arquivo.type || 'application/octet-stream'
      mediaType = mimeType

      // Determinar tipo de mensagem e tipo para Evolution API
      if (mimeType.startsWith('image/')) {
        messageType = 'image'
        evolutionMediaType = 'image'
      } else if (mimeType.startsWith('video/')) {
        messageType = 'video'
        evolutionMediaType = 'video'
      } else if (mimeType.startsWith('audio/')) {
        messageType = 'audio'
        evolutionMediaType = 'audio'
      } else {
        messageType = 'document'
        evolutionMediaType = 'document'
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const ext = arquivo.filename?.split('.').pop() || 'bin'
      const uniqueFileName = `${messageType}_${timestamp}_${random}.${ext}`
      mediaName = arquivo.filename || uniqueFileName

      // Caminho no storage: empresa_id/uniqueFileName
      const storagePath = `${userData.empresa_id}/${uniqueFileName}`

      console.log('API /api/atendimentos/[id]/mensagens POST: Fazendo upload para Supabase Storage:', storagePath)

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await client.storage
        .from('midias')
        .upload(storagePath, arquivo.data, {
          contentType: mimeType,
          upsert: false
        })

      if (uploadError) {
        console.error('API /api/atendimentos/[id]/mensagens POST: Erro no upload:', uploadError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Erro ao fazer upload do arquivo'
        })
      }

      // Obter URL pública
      const { data: urlData } = client.storage
        .from('midias')
        .getPublicUrl(storagePath)

      mediaUrl = urlData.publicUrl
      console.log('API /api/atendimentos/[id]/mensagens POST: Arquivo enviado:', mediaUrl)
    }

    // Criar mensagem no banco
    const mensagemData: any = {
      atendimento_id: atendimentoId,
      usuario_id: user.id,
      texto: texto?.trim() || '',
      remetente: 'user',
      lida: true,
      timestamp: new Date().toISOString(),
      message_type: messageType
    }

    // Adicionar campos de mídia se houver arquivo
    if (arquivo && mediaUrl) {
      mensagemData.media_url = mediaUrl
      mensagemData.media_type = mediaType
      mensagemData.media_name = mediaName
    }

    const { data: novaMensagem, error: mensagemError } = await client
      .from('mensagens')
      .insert(mensagemData)
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
        statusMessage: 'Erro ao enviar mensagem'
      })
    }

    // Enviar via Evolution API para WhatsApp
    console.log('API /api/atendimentos/[id]/mensagens POST: Enviando para WhatsApp via Evolution API')

    const inboxId = atendimento.inboxes.id
    const phoneNumber = atendimento.contatos.telefone
    let evolutionResult: any

    if (arquivo && mediaUrl && evolutionMediaType) {
      // Enviar mídia
      evolutionResult = await sendMediaToWhatsApp(
        inboxId,
        phoneNumber,
        mediaUrl,
        evolutionMediaType,
        texto?.trim(), // caption
        mediaType || undefined,
        mediaName || undefined
      )
    } else {
      // Enviar texto
      evolutionResult = await sendTextMessageToWhatsApp(
        inboxId,
        phoneNumber,
        texto.trim()
      )
    }

    // Atualizar mensagem com dados da Evolution API
    if (evolutionResult.success && evolutionResult.messageId) {
      await client
        .from('mensagens')
        .update({
          evolution_message_id: evolutionResult.messageId,
          evolution_status: evolutionResult.status || 'sent'
        })
        .eq('id', novaMensagem.id)

      console.log('API /api/atendimentos/[id]/mensagens POST: Mensagem enviada para WhatsApp com sucesso:', evolutionResult.messageId)
    } else {
      console.error('API /api/atendimentos/[id]/mensagens POST: Falha ao enviar para WhatsApp:', evolutionResult.error)
      // Não falhar a requisição se o envio para WhatsApp falhar, pois a mensagem já foi salva
      // TODO: Implementar retry ou notificação de falha
    }

    // Atualizar informações do atendimento
    const ultimaMensagem = arquivo ? `📎 ${mediaName}` : texto.trim()
    await client
      .from('atendimentos')
      .update({
        ultimo_mensagem: ultimaMensagem,
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
      media_url: novaMensagem.media_url || null,
      media_type: novaMensagem.media_type || null,
      media_name: novaMensagem.media_name || null
    }

    return {
      success: true,
      data: mensagemFormatada,
      message: arquivo ? 'Arquivo enviado com sucesso' : 'Mensagem enviada com sucesso'
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