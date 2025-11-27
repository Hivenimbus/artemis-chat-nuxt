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

// Formato antigo do webhook (messages.upsert)
export interface EvolutionWebhookDataLegacy {
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

// Formato novo do webhook (Message)
export interface EvolutionWebhookDataNew {
  event: string
  instanceId: string
  instanceName: string
  instanceToken?: string
  data: {
    Info: {
      AddressingMode?: string
      BroadcastListOwner?: string
      BroadcastRecipients?: any
      Category?: string
      Chat: string
      DeviceSentMeta?: any
      Edit?: string
      ID: string
      IsFromMe: boolean
      IsGroup: boolean
      MediaType?: string
      MsgBotInfo?: any
      MsgMetaInfo?: any
      Multicast?: boolean
      PushName: string
      RecipientAlt?: string
      Sender: string
      SenderAlt?: string
      ServerID?: number
      Timestamp: string
      Type: string
      VerifiedName?: any
    }
    IsBotInvoke?: boolean
    IsDocumentWithCaption?: boolean
    IsEdit?: boolean
    IsEphemeral?: boolean
    IsLottieSticker?: boolean
    IsViewOnce?: boolean
    IsViewOnceV2?: boolean
    IsViewOnceV2Extension?: boolean
    Message: {
      conversation?: string
      extendedTextMessage?: {
        text: string
        contextInfo?: any
      }
      imageMessage?: any
      videoMessage?: any
      audioMessage?: any
      documentMessage?: any
      messageContextInfo?: any
      [key: string]: any
    }
    NewsletterMeta?: any
    RetryCount?: number
    SourceWebMsg?: any
    UnavailableRequestID?: string
  }
}

// Tipo unificado que aceita ambos formatos
export type EvolutionWebhookData = EvolutionWebhookDataLegacy | EvolutionWebhookDataNew

// Interface normalizada para processamento interno
export interface NormalizedWebhookData {
  instance: string
  remoteJid: string
  fromMe: boolean
  messageId: string
  pushName: string
  messageType: string
  messageTimestamp: number
  messageText: string
  message: any // Objeto message original para extração de mídia
}

export interface ProcessedMessage {
  contatoId: string
  atendimentoId: string
  mensagemId: string
  inboxId: string
  empresaId: string
}

/**
 * Verifica se o webhook está no formato novo (Message)
 */
function isNewWebhookFormat(webhookData: any): webhookData is EvolutionWebhookDataNew {
  return webhookData.event === 'Message' && webhookData.data?.Info !== undefined
}

/**
 * Extrai o texto da mensagem do formato novo
 */
function extractMessageTextFromNewFormat(message: any): string {
  // Primeiro tenta extendedTextMessage (mensagens com contexto/resposta)
  if (message?.extendedTextMessage?.text) {
    return message.extendedTextMessage.text
  }
  
  // Depois tenta conversation (mensagens simples)
  if (message?.conversation) {
    return message.conversation
  }
  
  // Verificar se há caption em mensagens de mídia
  if (message?.imageMessage?.caption) {
    return message.imageMessage.caption
  }
  if (message?.videoMessage?.caption) {
    return message.videoMessage.caption
  }
  if (message?.documentMessage?.caption) {
    return message.documentMessage.caption
  }
  
  return ''
}

/**
 * Detecta o tipo de mensagem do formato novo
 */
function detectMessageTypeFromNewFormat(data: any): string {
  const infoType = data.Info?.Type?.toLowerCase()
  const message = data.Message
  
  // Primeiro verifica pelo Info.Type
  if (infoType === 'text') {
    return 'conversation'
  }
  if (infoType === 'image') {
    return 'imageMessage'
  }
  if (infoType === 'video') {
    return 'videoMessage'
  }
  if (infoType === 'audio' || infoType === 'ptt') {
    return 'audioMessage'
  }
  if (infoType === 'document') {
    return 'documentMessage'
  }
  
  // Fallback: verifica pelos campos do Message
  if (message?.imageMessage) return 'imageMessage'
  if (message?.videoMessage) return 'videoMessage'
  if (message?.audioMessage) return 'audioMessage'
  if (message?.documentMessage) return 'documentMessage'
  if (message?.extendedTextMessage) return 'conversation'
  if (message?.conversation) return 'conversation'
  
  return 'conversation'
}

/**
 * Converte timestamp ISO para Unix timestamp em segundos
 */
function parseTimestamp(timestamp: string | number | undefined): number {
  if (!timestamp) {
    return Math.floor(Date.now() / 1000)
  }
  
  if (typeof timestamp === 'number') {
    // Se for muito grande, já é em milissegundos
    if (timestamp > 10000000000) {
      return Math.floor(timestamp / 1000)
    }
    return timestamp
  }
  
  // Parse ISO string
  const parsed = new Date(timestamp).getTime()
  if (isNaN(parsed)) {
    return Math.floor(Date.now() / 1000)
  }
  return Math.floor(parsed / 1000)
}

/**
 * Normaliza os dados do webhook para um formato comum,
 * suportando tanto o formato antigo (messages.upsert) quanto o novo (Message)
 */
export function normalizeWebhookData(webhookData: any): NormalizedWebhookData | null {
  try {
    if (isNewWebhookFormat(webhookData)) {
      // Formato novo (Message)
      const { data } = webhookData
      const info = data.Info
      
      return {
        instance: webhookData.instanceName || webhookData.instanceId,
        remoteJid: info.Chat || info.Sender,
        fromMe: info.IsFromMe,
        messageId: info.ID,
        pushName: info.PushName || 'Contato',
        messageType: detectMessageTypeFromNewFormat(data),
        messageTimestamp: parseTimestamp(info.Timestamp),
        messageText: extractMessageTextFromNewFormat(data.Message),
        message: data.Message
      }
    } else {
      // Formato antigo (messages.upsert)
      const { data, instance } = webhookData
      
      return {
        instance: instance,
        remoteJid: data.key?.remoteJid || '',
        fromMe: data.key?.fromMe || false,
        messageId: data.key?.id || '',
        pushName: data.pushName || 'Contato',
        messageType: data.messageType || 'conversation',
        messageTimestamp: data.messageTimestamp || Math.floor(Date.now() / 1000),
        messageText: data.message?.conversation || '',
        message: data.message
      }
    }
  } catch (error) {
    console.error('❌ Erro ao normalizar dados do webhook:', error)
    return null
  }
}

/**
 * Encontra o ID interno da instância na Evolution API buscando pelo nome (que usamos como ID da inbox)
 */
export async function findEvolutionInstanceId(
  config: any,
  instanceName: string
): Promise<string | null> {
  try {
    console.log(`🔍 Buscando ID interno da instância Evolution para: ${instanceName}`)
    
    const response = await $fetch(`${config.evolutionApiUrl}/instance/all`, {
      method: 'GET',
      headers: {
        'apikey': config.evolutionApiKey
      }
    })

    const instances = (response as any)?.data || []
    
    // Procurar instância onde name === instanceName
    // instanceName no nosso sistema é o ID da inbox
    const instance = instances.find((inst: any) => inst.name === instanceName)

    if (instance) {
      console.log(`✅ Instância Evolution encontrada: ID Interno=${instance.id} para Nome=${instanceName}`)
      return instance.id
    }

    console.warn(`⚠️ Nenhuma instância Evolution encontrada com nome: ${instanceName}`)
    return null
  } catch (error) {
    console.error('❌ Erro ao buscar instâncias na Evolution API:', error)
    return null
  }
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

    // Normalizar telefone: adicionar código do país 55 se não estiver presente
    let normalizedPhone = phone.replace(/\D/g, '')
    if (!normalizedPhone.startsWith('55')) {
      normalizedPhone = '55' + normalizedPhone
    }

    // Primeiro, tenta buscar contato existente
    // Usamos maybeSingle() + limit(1) + order para evitar erros caso existam duplicatas,
    // pegando sempre o contato mais recente criado.
    const { data: contato, error: findError } = await supabase
      .from('contatos')
      .select('id')
      .eq('telefone', normalizedPhone)
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!findError && contato) {
      contatoLogger.debug('contact.found', `Contato existente encontrado: ${contato.id}`, { contatoId: contato.id })
      return { id: contato.id, isNew: false }
    }

    // Se não encontrou, criar novo contato
    contatoLogger.info('contact.creating', `Criando novo contato: ${name}`, { phone: normalizedPhone, empresaId })

    const { data: newContato, error: createError } = await supabase
      .from('contatos')
      .insert({
        nome: name,
        telefone: normalizedPhone,
        empresa_id: empresaId,
        total_mensagens: 0,
        data_ultimo_contato: new Date().toISOString()
      })
      .select('id')
      .single()

    if (createError) {
      contatoLogger.error('contact.create_error', `Erro ao criar contato: ${name}`, createError, { phone: normalizedPhone, empresaId })
      return null
    }

    contatoLogger.logContactCreated(newContato.id, normalizedPhone, name, empresaId)
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
    // Usamos maybeSingle() + limit(1) + order para evitar erros caso existam duplicatas
    const { data: atendimento, error: findError } = await supabase
      .from('atendimentos')
      .select('id')
      .eq('contato_id', contatoId)
      .eq('inbox_id', inboxId)
      .in('status', ['aguardando', 'ativo'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

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
  mediaData?: {
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

    // Adicionar dados de mídia se fornecidos
    if (mediaData) {
      messageData.media_url = mediaData.url
      messageData.media_type = mediaData.type
      messageData.media_name = mediaData.name
    }

    if (evolutionMessageId) {
      messageData.evolution_message_id = evolutionMessageId
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

    const mediaInfo = mediaData ? ` (mídia: ${mediaData.name})` : ''
    console.log(`✅ Mensagem criada: ${mensagem.id}${mediaInfo}`)
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
 * Suporta tanto o formato antigo (messages.upsert) quanto o novo (Message)
 */
export async function processEvolutionMessage(supabase: SupabaseClient, webhookData: any): Promise<ProcessedMessage | null> {
  // Normalizar dados do webhook para formato comum
  const normalized = normalizeWebhookData(webhookData)
  
  if (!normalized) {
    console.error('❌ Falha ao normalizar dados do webhook')
    return null
  }

  const { 
    instance, 
    remoteJid, 
    fromMe, 
    messageId: evolutionMessageId, 
    pushName, 
    messageType, 
    messageTimestamp, 
    messageText: initialMessageText,
    message 
  } = normalized

  try {
    webhookLogger.logWebhookReceived(webhookData.event, instance, {
      remoteJid,
      pushName,
      messageType,
      fromMe
    })

    // Ignorar mensagens enviadas por mim
    if (fromMe === true) {
      webhookLogger.debug('message.ignored', 'Mensagem enviada por mim, ignorando...', { instance })
      return null
    }

    if (!remoteJid) {
      webhookLogger.warn('message.invalid_data', 'Mensagem sem remoteJid', { instance })
      return null
    }

    // Processar texto ou mídia
    let messageText = initialMessageText
    let mediaData = null
    let processedMessageType = 'text'

    // Verificar se é mensagem de mídia
    if (messageType && messageType !== 'conversation') {
      console.log(`🎯 Detectado tipo de mídia: ${messageType}`)

      // Extrair informações da mídia
      const mediaInfo = extractMediaInfo(message, messageType)

      if (mediaInfo && mediaInfo.base64) {
        console.log(`📸 Processando mídia: ${mediaInfo.fileName}`)

        // Prosseguir com as outras etapas primeiro para obter empresa_id
        // 1. Encontrar inbox
        const inbox = await findInboxByInstance(supabase, instance)
        if (!inbox) {
          webhookLogger.logInboxNotFound(instance)
          return null
        }

        // Fazer upload da mídia
        const uploadResult = await uploadMediaToSupabase(
          supabase,
          inbox.empresa_id,
          mediaInfo.base64,
          mediaInfo.mimeType,
          mediaInfo.fileName
        )

        if (uploadResult) {
          mediaData = {
            url: uploadResult.url,
            type: mediaInfo.mimeType,
            name: mediaInfo.fileName
          }

          // Criar texto de preview para a mídia (usar caption se disponível)
          if (messageType === 'imageMessage') {
            messageText = mediaInfo.caption || ''
            processedMessageType = 'image'
          } else if (messageType === 'videoMessage') {
            messageText = mediaInfo.caption || ''
            processedMessageType = 'video'
          } else if (messageType === 'audioMessage') {
            messageText = ''
            processedMessageType = 'audio'
          } else if (messageType === 'documentMessage') {
            messageText = mediaInfo.caption || ''
            processedMessageType = 'document'
          }

          console.log(`✅ Mídia processada: ${messageText}`)
        } else {
          console.log(`❌ Falha no upload da mídia, tratando como mensagem sem conteúdo`)
          messageText = `[Mídia não processada: ${messageType}]`
        }
      } else {
        console.log(`⚠️ Mídia não pôde ser extraída: ${messageType}`)
        messageText = `[Mídia inválida: ${messageType}]`
      }
    } else if (!messageText?.trim()) {
      webhookLogger.warn('message.invalid_data', 'Mensagem sem conteúdo de texto ou mídia', {
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
      messageType: processedMessageType,
      hasMedia: !!mediaData
    })

    // 1. Encontrar inbox (se já não foi encontrado acima)
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

    // 4. Criar mensagem (com ou sem mídia)
    const mensagemId = await createMessage(
      supabase,
      atendimento.id,
      messageText,
      'contact',
      processedMessageType,
      evolutionMessageId,
      messageTimestamp,
      mediaData
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
 * Faz upload de mídia para o Supabase Storage
 */
export async function uploadMediaToSupabase(
  supabase: SupabaseClient,
  empresaId: string,
  base64Data: string,
  mimeType: string,
  fileName: string
): Promise<{ url: string, path: string } | null> {
  try {
    console.log(`📤 Fazendo upload de mídia: ${fileName} (${mimeType})`)

    // Extrair extensão do arquivo
    const extension = fileName.split('.').pop() || getFileExtensionFromMimeType(mimeType)

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const uniqueFileName = `msg_${timestamp}_${random}.${extension}`

    // Caminho completo no storage
    const storagePath = `${empresaId}/${uniqueFileName}`

    // Converter base64 para buffer
    // Remover prefixo data:image/jpeg;base64, se existir
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(cleanBase64, 'base64')

    console.log(`💾 Armazenando em: midias/${storagePath}`)

    // Fazer upload para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('midias')
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true
      })

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError)
      return null
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from('midias')
      .getPublicUrl(storagePath)

    if (!urlData?.publicUrl) {
      console.error('❌ Erro ao obter URL pública')
      return null
    }

    console.log(`✅ Upload realizado com sucesso: ${urlData.publicUrl}`)

    return {
      url: urlData.publicUrl,
      path: storagePath
    }

  } catch (error) {
    console.error('❌ Erro em uploadMediaToSupabase:', error)
    return null
  }
}

/**
 * Obtém extensão de arquivo a partir do MIME type
 */
function getFileExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/3gpp': '3gp',
    'video/quicktime': 'mov',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/amr': 'amr',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
  }

  return mimeToExt[mimeType.toLowerCase()] || 'bin'
}

/**
 * Extrai informações de mídia da mensagem da Evolution API
 */
function extractMediaInfo(message: any, messageType: string): {
  base64: string | null
  mimeType: string
  fileName: string
  caption?: string
  fileLength?: number
  duration?: number
  width?: number
  height?: number
} | null {
  try {
    console.log(`🔍 Extraindo mídia do tipo: ${messageType}`)
    console.log(`📋 Estrutura da mensagem:`, {
      hasMessage: !!message,
      hasBase64: !!message?.base64,
      messageType,
      keys: Object.keys(message || {})
    })

    // Extrair base64 diretamente de message.base64 (estrutura real da Evolution API)
    const base64 = message?.base64

    if (!base64) {
      console.log(`❌ Base64 não encontrado em message.base64`)
      console.log(`🔍 Estrutura completa da mensagem:`, JSON.stringify(message, null, 2))
      return null
    }

    console.log(`✅ Base64 encontrado com ${base64.length} caracteres`)

    // Extrair metadados do objeto específico de mídia
    let mediaData = null
    let mimeType = ''
    let fileName = ''
    let caption = undefined
    let fileLength = 0
    let duration = undefined
    let width = undefined
    let height = undefined

    console.log(`🎯 Processando objeto específico: ${messageType}`)

    switch (messageType) {
      case 'imageMessage':
        mediaData = message.imageMessage
        mimeType = mediaData?.mimetype || 'image/jpeg'
        fileName = `image_${Date.now()}.${getFileExtensionFromMimeType(mimeType)}`
        caption = mediaData?.caption
        width = mediaData?.width
        height = mediaData?.height
        fileLength = mediaData?.fileLength
        console.log(`📸 Metadados da imagem: ${mimeType}, ${width}x${height}, ${fileLength} bytes, caption: ${caption}`)
        break

      case 'videoMessage':
        mediaData = message.videoMessage
        mimeType = mediaData?.mimetype || 'video/mp4'
        fileName = `video_${Date.now()}.${getFileExtensionFromMimeType(mimeType)}`
        caption = mediaData?.caption
        width = mediaData?.width
        height = mediaData?.height
        duration = mediaData?.seconds
        fileLength = mediaData?.fileLength
        console.log(`🎥 Metadados do vídeo: ${mimeType}, ${width}x${height}, ${duration}s, ${fileLength} bytes, caption: ${caption}`)
        break

      case 'audioMessage':
        mediaData = message.audioMessage
        mimeType = mediaData?.mimetype || 'audio/ogg'
        fileName = `audio_${Date.now()}.${getFileExtensionFromMimeType(mimeType)}`
        duration = mediaData?.seconds
        fileLength = mediaData?.fileLength
        console.log(`🎵 Metadados do áudio: ${mimeType}, ${duration}s, ${fileLength} bytes`)
        break

      case 'documentMessage':
        mediaData = message.documentMessage
        mimeType = mediaData?.mimetype || 'application/pdf'
        fileName = mediaData?.fileName || `document_${Date.now()}.${getFileExtensionFromMimeType(mimeType)}`
        caption = mediaData?.caption
        fileLength = mediaData?.fileLength
        console.log(`📄 Metadados do documento: ${mimeType}, ${fileName}, ${fileLength} bytes, caption: ${caption}`)
        break

      default:
        console.log(`⚠️ Tipo de mídia não suportado: ${messageType}`)
        console.log(`🔍 Tipos disponíveis na mensagem:`, Object.keys(message).filter(k => k.includes('Message')))
        return null
    }

    console.log(`✅ Mídia extraída com sucesso: ${fileName} (${mimeType})`)

    return {
      base64: base64,  // ← CORREÇÃO: base64 vem de message.base64
      mimeType,
      fileName,
      caption,
      fileLength,
      duration,
      width,
      height
    }

  } catch (error) {
    console.error('❌ Erro ao extrair informações de mídia:', error)
    console.error('🔍 Dados recebidos:', { message: !!message, messageType, keys: message ? Object.keys(message) : null })
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

/**
 * Verifica se um número de telefone possui WhatsApp ativo
 */
export async function checkWhatsAppNumber(
  instanceId: string,
  phoneNumber: string
): Promise<{ exists: boolean; jid?: string; error?: string }> {
  try {
    const evolutionApiUrl = process.env.EVOLUTION_API_URL
    const evolutionApiKey = process.env.EVOLUTION_API_KEY

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.error('❌ EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados')
      return {
        exists: false,
        error: 'Configuração da Evolution API não encontrada'
      }
    }

    // Limpar telefone (remover caracteres não numéricos)
    const cleanPhone = phoneNumber.replace(/\D/g, '')

    console.log(`🔍 Verificando se número possui WhatsApp:`, {
      instance: instanceId,
      phone: cleanPhone
    })

    // Endpoint: POST /user/check
    const url = `${evolutionApiUrl}/user/check`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': instanceId
      },
      body: JSON.stringify({
        number: [cleanPhone],
        formatJid: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erro ao verificar WhatsApp (${response.status}):`, errorText)
      return {
        exists: false,
        error: `Erro na Evolution API: ${response.status}`
      }
    }

    const data = await response.json()

    if (data?.data?.Users && Array.isArray(data.data.Users) && data.data.Users.length > 0) {
      const result = data.data.Users[0]
      console.log(`✅ Resultado da verificação WhatsApp:`, result)

      return {
        exists: result.IsInWhatsapp === true,
        jid: result.JID
      }
    }

    console.warn('⚠️ Resposta inesperada da Evolution API:', data)
    return { exists: false, error: 'Resposta inválida da API' }

  } catch (error) {
    console.error('❌ Erro ao verificar número WhatsApp:', error)
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Envia uma mensagem de texto via Evolution API
 */
export async function sendTextMessageToWhatsApp(
  instanceId: string,
  phoneNumber: string,
  messageText: string
): Promise<{ success: boolean; messageId?: string; status?: string; error?: string }> {
  try {
    const evolutionApiUrl = process.env.EVOLUTION_API_URL
    const evolutionApiKey = process.env.EVOLUTION_API_KEY

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.error('❌ EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados')
      return {
        success: false,
        error: 'Configuração da Evolution API não encontrada'
      }
    }

    // Remover caracteres não numéricos do telefone
    const cleanPhone = phoneNumber.replace(/\D/g, '')

    console.log(`📤 Enviando mensagem via Evolution API:`, {
      instance: instanceId,
      phone: cleanPhone,
      messageLength: messageText.length
    })

    // Fazer requisição para Evolution API
    const url = `${evolutionApiUrl}/send/text`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': instanceId
      },
      body: JSON.stringify({
        number: cleanPhone,
        text: messageText
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro na Evolution API:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      return {
        success: false,
        error: `Evolution API retornou status ${response.status}: ${errorText}`
      }
    }

    const data = await response.json()

    console.log('✅ Mensagem enviada via Evolution API:', {
      messageId: data.data?.Info?.ID,
      status: 'PENDING'
    })

    return {
      success: true,
      messageId: data.data?.Info?.ID,
      status: 'PENDING'
    }

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem via Evolution API:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Envia uma mídia (imagem, vídeo, documento) via Evolution API
 */
export async function sendMediaToWhatsApp(
  instanceId: string,
  phoneNumber: string,
  mediaUrl: string,
  mediaType: 'image' | 'video' | 'document' | 'audio',
  caption?: string,
  mimeType?: string,
  fileName?: string
): Promise<{ success: boolean; messageId?: string; status?: string; error?: string }> {
  try {
    const evolutionApiUrl = process.env.EVOLUTION_API_URL
    const evolutionApiKey = process.env.EVOLUTION_API_KEY

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.error('❌ EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados')
      return {
        success: false,
        error: 'Configuração da Evolution API não encontrada'
      }
    }

    // Remover caracteres não numéricos do telefone
    const cleanPhone = phoneNumber.replace(/\D/g, '')

    console.log(`📤 Enviando mídia via Evolution API:`, {
      instance: instanceId,
      phone: cleanPhone,
      mediaType,
      mediaUrl,
      hasCaption: !!caption
    })

    // Fazer requisição para Evolution API
    const url = `${evolutionApiUrl}/send/media`

    // Montar body baseado no tipo de mídia
    const body: any = {
      number: cleanPhone,
      type: mediaType,
      url: mediaUrl
    }

    // Adicionar caption se fornecido (para image, video)
    if (caption && (mediaType === 'image' || mediaType === 'video')) {
      body.caption = caption
    }

    // Adicionar mimetype se fornecido
    if (mimeType) {
      body.mimetype = mimeType
    }

    // Adicionar fileName para documentos
    if (fileName && mediaType === 'document') {
      body.fileName = fileName
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': instanceId
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro na Evolution API (mídia):', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      return {
        success: false,
        error: `Evolution API retornou status ${response.status}: ${errorText}`
      }
    }

    const data = await response.json()

    console.log('✅ Mídia enviada via Evolution API:', {
      messageId: data.data?.Info?.ID,
      status: 'PENDING',
      mediaType
    })

    return {
      success: true,
      messageId: data.data?.Info?.ID,
      status: 'PENDING'
    }

  } catch (error) {
    console.error('❌ Erro ao enviar mídia via Evolution API:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Envia um áudio via Evolution API usando endpoint específico
 */
export async function sendAudioToWhatsApp(
  instanceId: string,
  phoneNumber: string,
  audioUrl: string
): Promise<{ success: boolean; messageId?: string; status?: string; error?: string }> {
  try {
    const evolutionApiUrl = process.env.EVOLUTION_API_URL
    const evolutionApiKey = process.env.EVOLUTION_API_KEY

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.error('❌ EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados')
      return {
        success: false,
        error: 'Configuração da Evolution API não encontrada'
      }
    }

    // Remover caracteres não numéricos do telefone
    const cleanPhone = phoneNumber.replace(/\D/g, '')

    console.log(`🎵 Enviando áudio via Evolution API:`, {
      instance: instanceId,
      phone: cleanPhone,
      audioUrl
    })

    // Fazer requisição para Evolution API usando endpoint genérico de mídia
    return sendMediaToWhatsApp(
      instanceId,
      phoneNumber,
      audioUrl,
      'audio'
    )

  } catch (error) {
    console.error('❌ Erro ao enviar áudio via Evolution API:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}
