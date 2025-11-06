import { serverSupabaseClient } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { webhookLogger, contatoLogger, atendimentoLogger, messageLogger } from './logger'

// Criar cliente Supabase com service role key para webhooks (sem autenticação de usuário)
export function createServiceSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para webhooks')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export interface EvolutionWebhookData {
  event: string
  instance: string
  data: {
    key: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
    pushName?: string
    status?: string
    message: {
      conversation?: string
      [key: string]: any
    }
    messageType?: string
    messageTimestamp?: number
    instanceId?: string
    source?: string
  }
  destination?: string
  date_time: string
  sender?: string
  server_url: string
  apikey: string
}

export interface ProcessedMessage {
  contatoId: string
  atendimentoId: string
  mensagemId: string
  inboxId: string
  empresaId: string
}

/**
 * Encontra a inbox correspondente pelo instanceId da Evolution API
 */
export async function findInboxByInstance(supabase: SupabaseClient, instanceId: string): Promise<{ id: string, empresa_id: string } | null> {
  try {
    webhookLogger.debug('inbox.searching', `Buscando inbox por instance: ${instanceId}`)

    const { data, error } = await supabase
      .from('inboxes')
      .select('id, empresa_id')
      .eq('id', instanceId)
      .single()

    if (error) {
      webhookLogger.logInboxNotFound(instanceId)
      return null
    }

    webhookLogger.debug('inbox.found', `Inbox encontrada: ${data.id}`, { inboxId: data.id, empresaId: data.empresa_id })
    return data
  } catch (error) {
    webhookLogger.error('inbox.search_error', `Erro ao buscar inbox por instance: ${instanceId}`, error)
    return null
  }
}

/**
 * Extrai o número de telefone do remoteJid
 */
export function extractPhoneFromRemoteJid(remoteJid: string): string {
  return remoteJid
    .replace('@s.whatsapp.net', '')
    .replace('@g.us', '') // Para grupos
    .replace(/\D/g, '') // Remove caracteres não numéricos
}

/**
 * Busca ou cria um contato baseado no telefone
 */
export async function findOrCreateContact(
  supabase: SupabaseClient,
  phone: string,
  name: string,
  empresaId: string
): Promise<{ id: string, isNew: boolean } | null> {
  try {
    contatoLogger.logContactProcessing(phone, name, empresaId)

    // Primeiro, tenta buscar contato existente
    const { data: contato, error: findError } = await supabase
      .from('contatos')
      .select('id')
      .eq('telefone', phone)
      .eq('empresa_id', empresaId)
      .single()

    if (!findError && contato) {
      contatoLogger.debug('contact.found', `Contato existente encontrado: ${contato.id}`, { contatoId: contato.id })
      return { id: contato.id, isNew: false }
    }

    // Se não encontrou, criar novo contato
    contatoLogger.info('contact.creating', `Criando novo contato: ${name}`, { phone, empresaId })

    const { data: newContato, error: createError } = await supabase
      .from('contatos')
      .insert({
        nome: name,
        telefone: phone,
        empresa_id: empresaId,
        total_mensagens: 0,
        data_ultimo_contato: new Date().toISOString()
      })
      .select('id')
      .single()

    if (createError) {
      contatoLogger.error('contact.create_error', `Erro ao criar contato: ${name}`, createError, { phone, empresaId })
      return null
    }

    contatoLogger.logContactCreated(newContato.id, phone, name, empresaId)
    return { id: newContato.id, isNew: true }

  } catch (error) {
    contatoLogger.error('contact.processing_error', `Erro em findOrCreateContact`, error, { phone, name, empresaId })
    return null
  }
}

/**
 * Busca ou cria um atendimento para o contato
 */
export async function findOrCreateAtendimento(
  supabase: SupabaseClient,
  contatoId: string,
  inboxId: string
): Promise<{ id: string, isNew: boolean } | null> {
  try {
    // Buscar atendimento em aberto
    const { data: atendimento, error: findError } = await supabase
      .from('atendimentos')
      .select('id')
      .eq('contato_id', contatoId)
      .eq('inbox_id', inboxId)
      .in('status', ['aguardando', 'ativo'])
      .single()

    if (!findError && atendimento) {
      console.log('✅ Atendimento encontrado:', atendimento.id)
      return { id: atendimento.id, isNew: false }
    }

    // Se não encontrou, criar novo atendimento
    console.log('🆘 Criando novo atendimento...')

    const { data: newAtendimento, error: createError } = await supabase
      .from('atendimentos')
      .insert({
        contato_id: contatoId,
        inbox_id: inboxId,
        status: 'aguardando',
        ultimo_mensagem: '',
        ultimo_mensagem_time: new Date().toISOString(),
        unread_count: 0
      })
      .select('id')
      .single()

    if (createError) {
      console.error('❌ Erro ao criar atendimento:', createError)
      return null
    }

    console.log('✅ Atendimento criado:', newAtendimento.id)
    return { id: newAtendimento.id, isNew: true }

  } catch (error) {
    console.error('❌ Erro em findOrCreateAtendimento:', error)
    return null
  }
}

/**
 * Faz upload de mídia para o Supabase Storage
 */
export async function uploadMediaToStorage(
  supabase: SupabaseClient,
  empresaId: string,
  atendimentoId: string,
  mediaData: {
    base64: string
    mimetype: string
    filename: string
    fileLength?: number
  }
): Promise<{ url: string; path: string } | null> {
  try {
    // Extrair conteúdo base64 (remover prefixo data:...;base64,)
    const base64Content = mediaData.base64.includes(',')
      ? mediaData.base64.split(',')[1]
      : mediaData.base64

    // Converter base64 para buffer
    const buffer = Buffer.from(base64Content, 'base64')

    // Gerar caminho único no storage
    const timestamp = Date.now()
    const hash = mediaData.filename.substring(0, 8)
    const extension = mediaData.mimetype.split('/')[1] || 'bin'
    const filename = `${timestamp}_${hash}.${extension}`
    const path = `empresas/${empresaId}/atendimentos/${atendimentoId}/${filename}`

    console.log(`📤 Fazendo upload de mídia: ${path} (${mediaData.mimetype})`)

    // Upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from('Midias')
      .upload(path, buffer, {
        contentType: mediaData.mimetype,
        upsert: false
      })

    if (error) {
      console.error('❌ Erro no upload da mídia:', error)
      return null
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('Midias')
      .getPublicUrl(path)

    console.log('✅ Mídia uploaded com sucesso:', publicUrl)
    return {
      url: publicUrl,
      path: path
    }

  } catch (error) {
    console.error('❌ Erro em uploadMediaToStorage:', error)
    return null
  }
}

/**
 * Extrai informações da míria da mensagem baseado no tipo
 */
export function extractMediaInfo(message: any, messageType: string): {
  base64: string
  mimetype: string
  filename: string
  fileLength?: number
  caption?: string
} | null {
  try {
    let mediaMessage: any = null

    switch (messageType) {
      case 'imageMessage':
        mediaMessage = message.imageMessage
        break
      case 'videoMessage':
        mediaMessage = message.videoMessage
        break
      case 'audioMessage':
        mediaMessage = message.audioMessage
        break
      case 'documentMessage':
        mediaMessage = message.documentMessage
        break
      default:
        return null
    }

    if (!mediaMessage || !mediaMessage.base64) {
      return null
    }

    // Gerar nome de arquivo baseado no tipo e metadados
    let extension = 'bin'
    let filename = 'media'

    if (mediaMessage.mimetype) {
      const mimeParts = mediaMessage.mimetype.split('/')
      extension = mimeParts[1] || 'bin'
      filename = `${messageType.replace('Message', '')}_${Date.now()}`
    }

    return {
      base64: mediaMessage.base64,
      mimetype: mediaMessage.mimetype,
      filename: `${filename}.${extension}`,
      fileLength: mediaMessage.fileLength,
      caption: mediaMessage.caption || undefined
    }

  } catch (error) {
    console.error('❌ Erro ao extrair informações da mídia:', error)
    return null
  }
}

/**
 * Cria uma nova mensagem no banco de dados
 */
export async function createMessage(
  supabase: SupabaseClient,
  atendimentoId: string,
  texto: string,
  remetente: 'contact' | 'user',
  messageType: string = 'text',
  evolutionMessageId?: string,
  messageTimestamp?: number,
  mediaInfo?: {
    url: string
    type: string
    name: string
  }
): Promise<string | null> {
  try {
    const messageData: any = {
      atendimento_id: atendimentoId,
      texto: texto,
      remetente: remetente,
      lida: remetente === 'user', // Mensagens do usuário já vêm como lidas
      timestamp: messageTimestamp
        ? new Date(messageTimestamp * 1000).toISOString()
        : new Date().toISOString(),
      message_type: messageType === 'conversation' ? 'text' : messageType,
      evolution_status: 'delivered'
    }

    if (evolutionMessageId) {
      messageData.evolution_message_id = evolutionMessageId
    }

    // Adicionar informações de mídia se existirem
    if (mediaInfo) {
      messageData.media_url = mediaInfo.url
      messageData.media_type = mediaInfo.type
      messageData.media_name = mediaInfo.name
    }

    const { data: mensagem, error } = await supabase
      .from('mensagens')
      .insert(messageData)
      .select('id')
      .single()

    if (error) {
      console.error('❌ Erro ao criar mensagem:', error)
      return null
    }

    console.log('✅ Mensagem criada:', mensagem.id)
    return mensagem.id

  } catch (error) {
    console.error('❌ Erro em createMessage:', error)
    return null
  }
}

/**
 * Atualiza o atendimento com a nova mensagem
 */
export async function updateAtendimentoWithMessage(
  supabase: SupabaseClient,
  atendimentoId: string,
  messageText: string,
  messageTimestamp?: number,
  incrementUnread: boolean = true
): Promise<boolean> {
  try {
    const updateData: any = {
      ultimo_mensagem: messageText,
      ultimo_mensagem_time: messageTimestamp
        ? new Date(messageTimestamp * 1000).toISOString()
        : new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (incrementUnread) {
      // Primeiro, buscar o valor atual
      const { data: currentAtendimento } = await supabase
        .from('atendimentos')
        .select('unread_count')
        .eq('id', atendimentoId)
        .single()

      updateData.unread_count = (currentAtendimento?.unread_count || 0) + 1
    }

    const { error } = await supabase
      .from('atendimentos')
      .update(updateData)
      .eq('id', atendimentoId)

    if (error) {
      console.error('❌ Erro ao atualizar atendimento:', error)
      return false
    }

    return true

  } catch (error) {
    console.error('❌ Erro em updateAtendimentoWithMessage:', error)
    return false
  }
}

/**
 * Atualiza os dados do contato
 */
export async function updateContactData(
  supabase: SupabaseClient,
  contatoId: string,
  atendimentoId: string,
  messageTimestamp?: number
): Promise<boolean> {
  try {
    // Primeiro, buscar o valor atual
    const { data: currentContato } = await supabase
      .from('contatos')
      .select('total_mensagens')
      .eq('id', contatoId)
      .single()

    const { error } = await supabase
      .from('contatos')
      .update({
        data_ultimo_contato: messageTimestamp
          ? new Date(messageTimestamp * 1000).toISOString()
          : new Date().toISOString(),
        total_mensagens: (currentContato?.total_mensagens || 0) + 1,
        ultimo_atendimento_id: atendimentoId,
        updated_at: new Date().toISOString()
      })
      .eq('id', contatoId)

    if (error) {
      console.error('❌ Erro ao atualizar contato:', error)
      return false
    }

    return true

  } catch (error) {
    console.error('❌ Erro em updateContactData:', error)
    return false
  }
}

/**
 * Processa uma mensagem completa do webhook da Evolution API
 */
export async function processEvolutionMessage(supabase: SupabaseClient, webhookData: EvolutionWebhookData): Promise<ProcessedMessage | null> {
  const { data, instance } = webhookData

  try {
    webhookLogger.logWebhookReceived(webhookData.event, instance, {
      remoteJid: data.key?.remoteJid,
      pushName: data.pushName,
      messageType: data.messageType,
      fromMe: data.key?.fromMe
    })

    // Ignorar mensagens enviadas por mim
    if (data.key?.fromMe === true) {
      webhookLogger.debug('message.ignored', 'Mensagem enviada por mim, ignorando...', { instance })
      return null
    }

    // Extrair informações básicas
    const remoteJid = data.key?.remoteJid
    const pushName = data.pushName || 'Contato'
    const messageType = data.messageType || 'conversation'
    const messageTimestamp = data.messageTimestamp || Date.now()
    const evolutionMessageId = data.key?.id

    if (!remoteJid) {
      webhookLogger.warn('message.invalid_data', 'Mensagem sem remoteJid', {
        remoteJid,
        instance
      })
      return null
    }

    // Extrair texto ou legenda da mídia
    let messageText = data.message?.conversation || ''
    let mediaInfo: { url: string; type: string; name: string } | undefined

    // Verificar se é mensagem de mídia
    const isMediaMessage = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(messageType)

    if (isMediaMessage) {
      webhookLogger.info('media.detected', `Detectada mensagem de mídia: ${messageType}`, {
        remoteJid,
        instance,
        messageType
      })

      // Extrair informações da mídia
      const extractedMedia = extractMediaInfo(data.message, messageType)
      if (extractedMedia) {
        // 1. Encontrar inbox primeiro para obter empresa_id
        const inbox = await findInboxByInstance(supabase, instance)
        if (!inbox) {
          webhookLogger.logInboxNotFound(instance)
          return null
        }

        // 2. Buscar ou criar contato
        const phone = extractPhoneFromRemoteJid(remoteJid)
        const contato = await findOrCreateContact(supabase, phone, pushName, inbox.empresa_id)
        if (!contato) {
          webhookLogger.error('contact.not_found', `Não foi possível encontrar/criar contato: ${pushName}`, null, { phone, instance })
          return null
        }

        // 3. Buscar ou criar atendimento
        const atendimento = await findOrCreateAtendimento(supabase, contato.id, inbox.id)
        if (!atendimento) {
          webhookLogger.error('atendimento.not_found', `Não foi possível encontrar/criar atendimento`, null, { contatoId: contato.id, instance })
          return null
        }

        // 4. Fazer upload da mídia
        const uploadResult = await uploadMediaToStorage(
          supabase,
          inbox.empresa_id,
          atendimento.id,
          extractedMedia
        )

        if (uploadResult) {
          mediaInfo = {
            url: uploadResult.url,
            type: extractedMedia.mimetype,
            name: extractedMedia.filename
          }

          // Usar legenda da mídia ou texto padrão
          messageText = extractedMedia.caption || `📎 ${messageType.replace('Message', '')} enviado`

          webhookLogger.info('media.uploaded', `Mídia processada com sucesso: ${extractedMedia.filename}`, {
            url: uploadResult.url,
            mimetype: extractedMedia.mimetype,
            size: extractedMedia.fileLength
          })
        } else {
          webhookLogger.error('media.upload_failed', 'Falha no upload da mídia', null, {
            messageType,
            filename: extractedMedia.filename
          })
          // Continuar processando mesmo sem upload da mídia
          messageText = `📎 ${messageType.replace('Message', '')} (erro no processamento)`
        }
      } else {
        webhookLogger.warn('media.extraction_failed', 'Não foi possível extrair informações da mídia', {
          messageType,
          instance
        })
        messageText = `📎 ${messageType.replace('Message', '')}`
      }
    }

    // Validar se temos texto para processar
    if (!messageText?.trim() && !isMediaMessage) {
      webhookLogger.warn('message.invalid_data', 'Mensagem sem conteúdo para processar', {
        remoteJid,
        messageText,
        instance,
        messageType
      })
      return null
    }

    webhookLogger.info('message.processing', `Processando mensagem de ${pushName}`, {
      remoteJid,
      messageText: messageText.substring(0, 50),
      instance,
      messageType,
      hasMedia: !!mediaInfo
    })

    // 1. Encontrar inbox (se não foi encontrado no processamento de mídia)
    const inbox = await findInboxByInstance(supabase, instance)
    if (!inbox) {
      webhookLogger.logInboxNotFound(instance)
      return null
    }

    // 2. Buscar ou criar contato (se não foi criado no processamento de mídia)
    const phone = extractPhoneFromRemoteJid(remoteJid)
    const contato = await findOrCreateContact(supabase, phone, pushName, inbox.empresa_id)
    if (!contato) {
      webhookLogger.error('contact.not_found', `Não foi possível encontrar/criar contato: ${pushName}`, null, { phone, instance })
      return null
    }

    // 3. Buscar ou criar atendimento (se não foi criado no processamento de mídia)
    const atendimento = await findOrCreateAtendimento(supabase, contato.id, inbox.id)
    if (!atendimento) {
      webhookLogger.error('atendimento.not_found', `Não foi possível encontrar/criar atendimento`, null, { contatoId: contato.id, instance })
      return null
    }

    // 4. Criar mensagem
    const mensagemId = await createMessage(
      supabase,
      atendimento.id,
      messageText,
      'contact',
      messageType,
      evolutionMessageId,
      messageTimestamp,
      mediaInfo
    )

    if (!mensagemId) {
      webhookLogger.error('message.create_failed', `Não foi possível criar mensagem`, null, {
        atendimentoId: atendimento.id,
        messageText: messageText.substring(0, 50)
      })
      return null
    }

    // 5. Atualizar atendimento
    await updateAtendimentoWithMessage(
      supabase,
      atendimento.id,
      messageText,
      messageTimestamp,
      true // incrementar não lidas
    )

    // 6. Atualizar contato
    await updateContactData(
      supabase,
      contato.id,
      atendimento.id,
      messageTimestamp
    )

    const result = {
      contatoId: contato.id,
      atendimentoId: atendimento.id,
      mensagemId: mensagemId,
      inboxId: inbox.id,
      empresaId: inbox.empresa_id
    }

    webhookLogger.logWebhookProcessed(webhookData.event, instance, result)
    messageLogger.logMessageReceived(mensagemId, atendimento.id, phone)

    return result

  } catch (error) {
    webhookLogger.logWebhookError(webhookData.event, instance, error, webhookData)
    return null
  }
}

/**
 * Valida se o webhook vem de uma fonte confiável
 */
export function validateWebhookOrigin(headers: any, apiKey: string): boolean {
  // TODO: Implementar validação mais robusta
  // Por enquanto, apenas verifica se tem os dados básicos
  return !!(headers && apiKey)
}