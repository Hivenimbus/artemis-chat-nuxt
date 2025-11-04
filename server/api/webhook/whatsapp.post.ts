import { serverSupabaseClient } from '#supabase/server'
import { createStorageManager, getFileExtensionFromMimeType } from '~/server/lib/storage'

// Tipos para os eventos da Evolution API
interface EvolutionWebhookEvent {
  event: string
  instance: string
  data: any
  date_time: string
}

interface MessageData {
  key: {
    id: string
    remoteJid: string
    fromMe: boolean
  }
  // Propriedades adicionais da Evolution API
  pushName?: string         // Nome do contato
  participant?: string      // ID do participante (para grupos)
  broadcast?: boolean       // Se é mensagem de broadcast
  messageExtendedTextMessage?: string // Mensagem estendida
  ack?: number              // Status de confirmação
  messageStubType?: string  // Tipo de mensagem stub

  message: {
    conversation?: string
    extendedTextMessage?: {
      text: string
    }
    imageMessage?: {
      caption: string
      mimetype: string
      fileLength: string
      mediaKey: string
      directPath: string
      mediaUrl: string
    }
    videoMessage?: {
      caption: string
      mimetype: string
      fileLength: string
      mediaKey: string
      directPath: string
      mediaUrl: string
    }
    audioMessage?: {
      mimetype: string
      fileLength: string
      mediaKey: string
      directPath: string
      mediaUrl: string
    }
    documentMessage?: {
      fileName: string
      mimetype: string
      fileLength: string
      mediaKey: string
      directPath: string
      mediaUrl: string
      caption?: string
    }
  }
  messageTimestamp: number
  status: string
}

export default defineEventHandler(async (event) => {
  try {
    // Obter dados do webhook
    const body = await readBody(event) as EvolutionWebhookEvent

    console.log('Webhook recebido:', JSON.stringify(body, null, 2))

    // Validar estrutura básica dos dados do webhook
    if (!body || !body.event) {
      console.error('Estrutura inválida: evento ausente')
      throw createError({
        statusCode: 400,
        statusMessage: 'Estrutura de dados inválida: evento ausente'
      })
    }

    // Verificar se é um evento de mensagem
    if (body.event !== 'MESSAGES_UPSERT') {
      console.log(`Evento ignorado: ${body.event}`)
      return { success: true, message: 'Evento ignorado' }
    }

    // Validar estrutura da mensagem
    if (!body.data || typeof body.data !== 'object') {
      console.error('Estrutura inválida: data ausente')
      throw createError({
        statusCode: 400,
        statusMessage: 'Estrutura de dados inválida: data ausente'
      })
    }

    const messageData = body.data as MessageData

    // Validar campos obrigatórios da mensagem
    if (!messageData.key || !messageData.message || !messageData.messageTimestamp) {
      console.error('Estrutura inválida: campos obrigatórios ausentes', {
        hasKey: !!messageData.key,
        hasMessage: !!messageData.message,
        hasTimestamp: !!messageData.messageTimestamp
      })
      throw createError({
        statusCode: 400,
        statusMessage: 'Estrutura de dados inválida: campos obrigatórios ausentes'
      })
    }

    // Ignorar mensagens enviadas por nós mesmos
    if (messageData.key.fromMe) {
      console.log('Mensagem enviada por nós, ignorando...')
      return { success: true, message: 'Mensagem própria ignorada' }
    }

    const client = await serverSupabaseClient(event)

    // Encontrar a inbox usando o instance name
    const { data: inbox, error: inboxError } = await client
      .from('inboxes')
      .select('*')
      .eq('id', body.instance)
      .single()

    if (inboxError || !inbox) {
      console.error('Inbox não encontrada:', body.instance, inboxError)
      return { success: false, error: 'Inbox não encontrada' }
    }

    console.log('Inbox encontrada:', inbox.name)

    // Extrair informações do contato
    const phoneNumber = messageData.key.remoteJid.split('@')[0]
    const contactName = messageData.pushName || phoneNumber

    // Encontrar ou criar contato
    let { data: contato, error: contatoError } = await client
      .from('contatos')
      .select('*')
      .eq('telefone', phoneNumber)
      .eq('empresa_id', inbox.empresa_id)
      .single()

    if (contatoError && contatoError.code === 'PGRST116') {
      // Contato não existe, criar novo
      console.log('Criando novo contato:', contactName)
      const { data: novoContato, error: createError } = await client
        .from('contatos')
        .insert({
          nome: contactName,
          telefone: phoneNumber,
          empresa_id: inbox.empresa_id,
          data_ultimo_contato: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Erro ao criar contato:', createError)
        return { success: false, error: 'Erro ao criar contato' }
      }

      contato = novoContato
      console.log('Contato criado:', contato)
    } else if (contatoError) {
      console.error('Erro ao buscar contato:', contatoError)
      return { success: false, error: 'Erro ao buscar contato' }
    } else {
      console.log('Contato encontrado:', contato)

      // Atualizar último contato
      await client
        .from('contatos')
        .update({
          data_ultimo_contato: new Date().toISOString(),
          total_mensagens: (contato.total_mensagens || 0) + 1
        })
        .eq('id', contato.id)
    }

    // Encontrar atendimento aberto ou criar novo
    let { data: atendimento, error: atendimentoError } = await client
      .from('atendimentos')
      .select('*')
      .eq('contato_id', contato.id)
      .eq('inbox_id', inbox.id)
      .in('status', ['aguardando', 'ativo'])
      .single()

    if (atendimentoError && atendimentoError.code === 'PGRST116') {
      // Não há atendimento aberto, criar novo
      console.log('Criando novo atendimento')
      const { data: novoAtendimento, error: createAtendimentoError } = await client
        .from('atendimentos')
        .insert({
          contato_id: contato.id,
          inbox_id: inbox.id,
          status: 'aguardando',
          ultimo_mensagem: getMessageText(messageData),
          ultimo_mensagem_time: new Date(messageData.messageTimestamp * 1000).toISOString(),
          unread_count: 1
        })
        .select()
        .single()

      if (createAtendimentoError) {
        console.error('Erro ao criar atendimento:', createAtendimentoError)
        return { success: false, error: 'Erro ao criar atendimento' }
      }

      atendimento = novoAtendimento
      console.log('Atendimento criado:', atendimento)
    } else if (atendimentoError) {
      console.error('Erro ao buscar atendimento:', atendimentoError)
      return { success: false, error: 'Erro ao buscar atendimento' }
    } else {
      console.log('Atendimento encontrado:', atendimento)

      // Atualizar atendimento existente
      const { error: updateAtendimentoError } = await client
        .from('atendimentos')
        .update({
          ultimo_mensagem: getMessageText(messageData),
          ultimo_mensagem_time: new Date(messageData.messageTimestamp * 1000).toISOString(),
          unread_count: (atendimento.unread_count || 0) + 1
        })
        .eq('id', atendimento.id)

      if (updateAtendimentoError) {
        console.error('Erro ao atualizar atendimento:', updateAtendimentoError)
        return { success: false, error: 'Erro ao atualizar atendimento' }
      }
    }

    // Extrair tipo de mensagem
    const messageType = getMessageType(messageData)
    const messageText = getMessageText(messageData)
    const mediaData = getMediaData(messageData)

    // Salvar mensagem
    const { data: mensagem, error: mensagemError } = await client
      .from('mensagens')
      .insert({
        atendimento_id: atendimento.id,
        texto: messageText,
        remetente: 'contact',
        lida: false,
        timestamp: new Date(messageData.messageTimestamp * 1000).toISOString(),
        message_type: messageType,
        media_url: mediaData?.url,
        media_type: mediaData?.type,
        media_name: mediaData?.name,
        evolution_message_id: messageData.key.id
      })
      .select()
      .single()

    if (mensagemError) {
      console.error('Erro ao salvar mensagem:', mensagemError)
      return { success: false, error: 'Erro ao salvar mensagem' }
    }

    console.log('Mensagem salva com sucesso:', mensagem)

    // Processar mídia se existir (download e salvar no Supabase Storage)
    if (mediaData && mediaData.url) {
      console.log('Mídia detectada, processando:', mediaData)

      try {
        const storageManager = createStorageManager(client)

        // Gerar caminho único para a mídia
        const fileExtension = getFileExtensionFromMimeType(mediaData.type)
        const uniqueFileName = `${messageData.key.id}.${fileExtension}`
        const storagePath = storageManager.generateMediaPath(
          atendimento.id,
          messageData.key.id,
          uniqueFileName,
          mediaData.type
        )

        console.log('Fazendo download da mídia:', mediaData.url)
        console.log('Salvando no caminho:', storagePath)

        // Fazer upload da mídia a partir da URL
        const uploadResult = await storageManager.uploadFromUrl(
          mediaData.url,
          storagePath,
          {
            contentType: mediaData.type,
            cacheControl: '86400' // 24 horas
          }
        )

        if (uploadResult.success) {
          // Gerar URL assinada para acesso à mídia
          const signedUrlResult = await storageManager.getSignedUrl(storagePath, 7200) // 2 horas

          if (signedUrlResult.success) {
            // Atualizar mensagem com a URL da mídia armazenada
            await client
              .from('mensagens')
              .update({
                media_url: signedUrlResult.url,
                media_name: mediaData.name
              })
              .eq('id', mensagem.id)

            console.log('Mídia processada e armazenada com sucesso:', {
              messageId: mensagem.id,
              storagePath,
              signedUrl: signedUrlResult.url
            })
          } else {
            console.error('Erro ao criar URL assinada:', signedUrlResult.error)
          }
        } else {
          console.error('Erro ao fazer upload da mídia:', uploadResult.error)
        }
      } catch (mediaError) {
        console.error('Erro ao processar mídia:', mediaError)
        // Não falhar o webhook completamente se a mídia não puder ser processada
      }
    }

    return {
      success: true,
      message: 'Mensagem processada com sucesso',
      data: {
        contato: contato.nome,
        atendimento: atendimento.id,
        mensagem: mensagem.id,
        messageType
      }
    }

  } catch (error) {
    console.error('Erro no webhook:', {
      error: error?.message || error,
      stack: error?.stack,
      instance: body?.instance,
      event: body?.event
    })

    // Log detalhado para debugging
    console.error('Detalhes do erro:', {
      errorMessage: error?.message,
      errorType: error?.constructor?.name,
      bodyStructure: {
        hasEvent: !!body?.event,
        hasData: !!body?.data,
        hasInstance: !!body?.instance
      }
    })

    // Retornar erro mais específico se possível
    let errorMessage = 'Erro interno no webhook'
    let statusCode = 500

    if (error?.message) {
      errorMessage = error.message
    }

    // Erros específicos do Supabase
    if (error?.message?.includes('duplicate key')) {
      errorMessage = 'Mensagem duplicada'
      statusCode = 409
    } else if (error?.message?.includes('foreign key')) {
      errorMessage = 'Erro de relacionamento no banco de dados'
      statusCode = 400
    } else if (error?.message?.includes('timeout')) {
      errorMessage = 'Timeout no banco de dados'
      statusCode = 504
    }

    throw createError({
      statusCode: statusCode,
      statusMessage: errorMessage
    })
  }
})

// Funções auxiliares
function getMessageType(data: MessageData): string {
  if (data.message.conversation) return 'text'
  if (data.message.extendedTextMessage) return 'text'
  if (data.message.imageMessage) return 'image'
  if (data.message.videoMessage) return 'video'
  if (data.message.audioMessage) return 'audio'
  if (data.message.documentMessage) return 'document'
  return 'text'
}

function getMessageText(data: MessageData): string {
  if (data.message.conversation) return data.message.conversation
  if (data.message.extendedTextMessage?.text) return data.message.extendedTextMessage.text
  if (data.message.imageMessage?.caption) return data.message.imageMessage.caption
  if (data.message.videoMessage?.caption) return data.message.videoMessage.caption
  if (data.message.documentMessage?.caption) return data.message.documentMessage.caption
  if (data.message.documentMessage?.fileName) return `📄 ${data.message.documentMessage.fileName}`
  if (data.message.audioMessage) return '🎵 Mensagem de áudio'
  if (data.message.imageMessage) return '🖼️ Imagem'
  if (data.message.videoMessage) return '🎥 Vídeo'
  return 'Mídia'
}

function getMediaData(data: MessageData): { url: string, type: string, name: string } | null {
  const imageMessage = data.message.imageMessage
  if (imageMessage) {
    return {
      url: imageMessage.mediaUrl,
      type: imageMessage.mimetype,
      name: `image_${Date.now()}`
    }
  }

  const videoMessage = data.message.videoMessage
  if (videoMessage) {
    return {
      url: videoMessage.mediaUrl,
      type: videoMessage.mimetype,
      name: `video_${Date.now()}`
    }
  }

  const audioMessage = data.message.audioMessage
  if (audioMessage) {
    return {
      url: audioMessage.mediaUrl,
      type: audioMessage.mimetype,
      name: `audio_${Date.now()}`
    }
  }

  const documentMessage = data.message.documentMessage
  if (documentMessage) {
    return {
      url: documentMessage.mediaUrl,
      type: documentMessage.mimetype,
      name: documentMessage.fileName || `document_${Date.now()}`
    }
  }

  return null
}