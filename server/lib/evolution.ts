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

// Interfaces para diferentes tipos de mídia
export interface AudioMessage {
  url: string
  mimetype: string
  fileSha256: string
  fileLength: number
  seconds: number
  ptt?: boolean
  mediaKey: string
  fileEncSha256: string
  directPath: string
  mediaKeyTimestamp: string
  waveform?: string
  viewOnce?: boolean
  base64?: string
}

export interface ImageMessage {
  url: string
  mimetype: string
  fileSha256: string
  fileLength: number
  height?: number
  width?: number
  mediaKey: string
  fileEncSha256: string
  directPath: string
  mediaKeyTimestamp: string
  jpegThumbnail?: string
  caption?: string
  viewOnce?: boolean
  base64?: string
}

export interface VideoMessage {
  url: string
  mimetype: string
  fileSha256: string
  fileLength: number
  seconds: number
  mediaKey: string
  fileEncSha256: string
  directPath: string
  mediaKeyTimestamp: string
  height?: number
  width?: number
  gifPlayback?: boolean
  jpegThumbnail?: string
  caption?: string
  viewOnce?: boolean
  base64?: string
}

export interface DocumentMessage {
  url: string
  mimetype: string
  fileSha256: string
  fileLength: number
  pageCount?: number
  fileName?: string
  mediaKey: string
  fileEncSha256: string
  directPath: string
  mediaKeyTimestamp: string
  thumbnail?: string
  caption?: string
  viewOnce?: boolean
  base64?: string
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
      audioMessage?: AudioMessage
      imageMessage?: ImageMessage
      videoMessage?: VideoMessage
      documentMessage?: DocumentMessage
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

export interface MediaInfo {
  type: 'audio' | 'image' | 'video' | 'document'
  url: string
  mimetype: string
  filename: string
  size: number
  duration?: number
  caption?: string
  base64?: string
}

export interface ProcessedMessage {
  contatoId: string
  atendimentoId: string
  mensagemId: string
  inboxId: string
  empresaId: string
  mediaUrl?: string
  mediaType?: string
  mediaName?: string
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
    media_url: string
    media_type: string
    media_name: string
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

    // Adicionar dados de mídia se existirem
    if (mediaData) {
      messageData.media_url = mediaData.media_url
      messageData.media_type = mediaData.media_type
      messageData.media_name = mediaData.media_name
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

    // Detectar tipo de mensagem e extrair texto/caption
    let messageText = data.message?.conversation || ''
    let isMediaMessage = false

    // Verificar se é mensagem de mídia
    if (data.message?.imageMessage || data.message?.videoMessage ||
        data.message?.audioMessage || data.message?.documentMessage) {
      isMediaMessage = true

      // Para mensagens de mídia, usar caption como texto ou gerar texto descritivo
      if (data.message?.imageMessage?.caption) {
        messageText = data.message.imageMessage.caption
      } else if (data.message?.videoMessage?.caption) {
        messageText = data.message.videoMessage.caption
      } else if (data.message?.documentMessage?.caption) {
        messageText = data.message.documentMessage.caption
      } else {
        // Gerar texto descritivo baseado no tipo
        if (data.message?.imageMessage) {
          messageText = '📷 Imagem'
        } else if (data.message?.videoMessage) {
          messageText = '🎥 Vídeo'
        } else if (data.message?.audioMessage) {
          messageText = '🎵 Áudio'
        } else if (data.message?.documentMessage) {
          messageText = '📄 Documento'
        }
      }
    }

    webhookLogger.info('message.processing', `Processando mensagem de ${pushName}`, {
      remoteJid,
      messageText: messageText.substring(0, 50),
      instance,
      messageType,
      isMediaMessage
    })

    // 1. Encontrar inbox
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

    // 4. Processar mídia se existir
    let mediaData = null
    if (isMediaMessage) {
      const mediaResult = await processMediaMessage(supabase, webhookData, inbox.empresa_id)
      if (mediaResult) {
        mediaData = {
          media_url: mediaResult.mediaUrl,
          media_type: mediaResult.mediaType,
          media_name: mediaResult.mediaName
        }
        webhookLogger.info('media.processed', `Mídia processada com sucesso: ${mediaResult.mediaName}`, {
          type: mediaResult.mediaType,
          size: mediaResult.mediaName
        })
      } else {
        webhookLogger.warn('media.processing_failed', 'Falha ao processar mídia, continuando com texto apenas')
      }
    }

    // 5. Criar mensagem
    const mensagemId = await createMessage(
      supabase,
      atendimento.id,
      messageText,
      'contact',
      messageType,
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

    // 6. Atualizar atendimento
    await updateAtendimentoWithMessage(
      supabase,
      atendimento.id,
      messageText,
      messageTimestamp,
      true // incrementar não lidas
    )

    // 7. Atualizar contato
    await updateContactData(
      supabase,
      contato.id,
      atendimento.id,
      messageTimestamp
    )

    const result: ProcessedMessage = {
      contatoId: contato.id,
      atendimentoId: atendimento.id,
      mensagemId: mensagemId,
      inboxId: inbox.id,
      empresaId: inbox.empresa_id
    }

    // Adicionar dados de mídia ao resultado se existirem
    if (mediaData) {
      result.mediaUrl = mediaData.media_url
      result.mediaType = mediaData.media_type
      result.mediaName = mediaData.media_name
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
 * Detecta se a mensagem contém mídia e extrai informações
 */
export function extractMediaInfo(webhookData: EvolutionWebhookData): MediaInfo | null {
  const { data } = webhookData
  const message = data.message

  if (!message) return null

  // Áudio
  if (message.audioMessage) {
    const audio = message.audioMessage
    const extension = audio.mimetype.includes('ogg') ? 'ogg' :
                     audio.mimetype.includes('mpeg') ? 'mp3' :
                     audio.mimetype.includes('wav') ? 'wav' : 'audio'

    return {
      type: 'audio',
      url: audio.url,
      mimetype: audio.mimetype,
      filename: `audio_${data.key?.id}_${Date.now()}.${extension}`,
      size: audio.fileLength,
      duration: audio.seconds,
      base64: audio.base64
    }
  }

  // Imagem
  if (message.imageMessage) {
    const image = message.imageMessage
    const extension = image.mimetype.includes('jpeg') ? 'jpg' :
                     image.mimetype.includes('png') ? 'png' :
                     image.mimetype.includes('gif') ? 'gif' :
                     image.mimetype.includes('webp') ? 'webp' : 'img'

    return {
      type: 'image',
      url: image.url,
      mimetype: image.mimetype,
      filename: `image_${data.key?.id}_${Date.now()}.${extension}`,
      size: image.fileLength,
      caption: image.caption,
      base64: image.base64
    }
  }

  // Vídeo
  if (message.videoMessage) {
    const video = message.videoMessage
    const extension = video.mimetype.includes('mp4') ? 'mp4' :
                     video.mimetype.includes('3gp') ? '3gp' :
                     video.mimetype.includes('mov') ? 'mov' : 'video'

    return {
      type: 'video',
      url: video.url,
      mimetype: video.mimetype,
      filename: `video_${data.key?.id}_${Date.now()}.${extension}`,
      size: video.fileLength,
      duration: video.seconds,
      caption: video.caption,
      base64: video.base64
    }
  }

  // Documento
  if (message.documentMessage) {
    const doc = message.documentMessage
    const extension = doc.fileName?.split('.').pop() || 'doc'

    return {
      type: 'document',
      url: doc.url,
      mimetype: doc.mimetype,
      filename: doc.fileName || `document_${data.key?.id}_${Date.now()}.${extension}`,
      size: doc.fileLength,
      caption: doc.caption,
      base64: doc.base64
    }
  }

  return null
}

/**
 * Baixa mídia da Evolution API
 */
export async function downloadMediaFromEvolution(mediaUrl: string): Promise<Buffer | null> {
  try {
    console.log('🔽 Baixando mídia da Evolution API:', mediaUrl)

    const response = await fetch(mediaUrl)
    if (!response.ok) {
      console.error('❌ Erro ao baixar mídia:', response.status, response.statusText)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('✅ Mídia baixada com sucesso:', buffer.length, 'bytes')
    return buffer
  } catch (error) {
    console.error('❌ Erro ao baixar mídia:', error)
    return null
  }
}

/**
 * Faz upload de mídia para o Supabase Storage
 */
export async function uploadMediaToSupabase(
  supabase: SupabaseClient,
  mediaBuffer: Buffer,
  filename: string,
  mimetype: string,
  empresaId: string
): Promise<string | null> {
  try {
    const filePath = `empresas/${empresaId}/${filename}`

    console.log('📤 Fazendo upload para Supabase Storage:', filePath)

    const { data, error } = await supabase.storage
      .from('midias')
      .upload(filePath, mediaBuffer, {
        contentType: mimetype,
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('❌ Erro no upload:', error)
      return null
    }

    // Obter URL pública do arquivo
    const { data: { publicUrl } } = supabase.storage
      .from('midias')
      .getPublicUrl(filePath)

    console.log('✅ Upload realizado com sucesso:', publicUrl)
    return publicUrl
  } catch (error) {
    console.error('❌ Erro no upload para Supabase:', error)
    return null
  }
}

/**
 * Valida se uma string contém base64 válido
 */
export function validateBase64(base64: string): { valid: boolean; error?: string; details?: any } {
  try {
    // Verificar se base64 existe e é string
    if (!base64 || typeof base64 !== 'string') {
      return { valid: false, error: 'Base64 não fornecido ou não é string' }
    }

    // Remover espaços, quebras de linha e caracteres inválidos
    const cleanBase64 = base64.replace(/[^A-Za-z0-9+/=]/g, '')

    // Verificar tamanho mínimo (base64 precisa ter pelo menos 4 caracteres)
    if (cleanBase64.length < 4) {
      return { valid: false, error: `Base64 muito curto: ${cleanBase64.length} caracteres` }
    }

    // Verificar se o comprimento é múltiplo de 4
    if (cleanBase64.length % 4 !== 0) {
      return { valid: false, error: `Base64 com padding incorreto: comprimento ${cleanBase64.length} não é múltiplo de 4` }
    }

    // Verificar caracteres válidos (após limpeza)
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    if (!base64Regex.test(cleanBase64)) {
      return { valid: false, error: 'Base64 contém caracteres inválidos' }
    }

    // Tentar decodificar para testar validade real
    const buffer = Buffer.from(cleanBase64, 'base64')

    // Verificar se o buffer tem conteúdo
    if (buffer.length === 0) {
      return { valid: false, error: 'Base64 decodificado para buffer vazio' }
    }

    return {
      valid: true,
      details: {
        originalLength: base64.length,
        cleanLength: cleanBase64.length,
        bufferSize: buffer.length,
        cleaned: cleanBase64.length !== base64.length
      }
    }
  } catch (error) {
    return { valid: false, error: `Erro na validação: ${error.message}` }
  }
}

/**
 * Limpa e normaliza uma string base64
 */
export function cleanBase64(base64: string): string {
  if (!base64 || typeof base64 !== 'string') {
    return ''
  }

  // Remover espaços, quebras de linha e caracteres não base64
  let cleaned = base64.replace(/[^A-Za-z0-9+/=]/g, '')

  // Remover espaços extras no início e fim
  cleaned = cleaned.trim()

  // Corrigir padding se necessário
  const padLength = 4 - (cleaned.length % 4)
  if (padLength < 4 && padLength > 0) {
    cleaned += '='.repeat(padLength)
  }

  return cleaned
}

/**
 * Decodifica base64 com múltiplos métodos de fallback
 */
export function decodeBase64(base64: string): { success: boolean; buffer?: Buffer; error?: string; method?: string } {
  try {
    // Método 1: Decodificação direta
    console.log('🔍 Tentando decodificação direta do base64...')
    const buffer1 = Buffer.from(base64, 'base64')
    if (buffer1.length > 0) {
      return { success: true, buffer: buffer1, method: 'direct' }
    }
  } catch (error) {
    console.warn('⚠️ Falha na decodificação direta:', error.message)
  }

  try {
    // Método 2: Limpar e tentar novamente
    console.log('🔍 Tentando decodificação com limpeza...')
    const cleaned = cleanBase64(base64)
    const buffer2 = Buffer.from(cleaned, 'base64')
    if (buffer2.length > 0) {
      return { success: true, buffer: buffer2, method: 'cleaned' }
    }
  } catch (error) {
    console.warn('⚠️ Falha na decodificação com limpeza:', error.message)
  }

  try {
    // Método 3: Tentar sem padding
    console.log('🔍 Tentando decodificação sem padding...')
    const noPadding = base64.replace(/=/g, '')
    const buffer3 = Buffer.from(noPadding, 'base64')
    if (buffer3.length > 0) {
      return { success: true, buffer: buffer3, method: 'no_padding' }
    }
  } catch (error) {
    console.warn('⚠️ Falha na decodificação sem padding:', error.message)
  }

  return { success: false, error: 'Todos os métodos de decodificação falharam' }
}

/**
 * Processa mídia do webhook e faz upload para o Supabase
 */
export async function processMediaMessage(
  supabase: SupabaseClient,
  webhookData: EvolutionWebhookData,
  empresaId: string
): Promise<{ mediaUrl: string; mediaType: string; mediaName: string } | null> {
  try {
    const mediaInfo = extractMediaInfo(webhookData)
    if (!mediaInfo) {
      console.log('📷 Nenhuma mídia encontrada na mensagem')
      return null
    }

    console.log('📷 Processando mídia:', {
      type: mediaInfo.type,
      filename: mediaInfo.filename,
      size: mediaInfo.size,
      mimetype: mediaInfo.mimetype,
      hasBase64: !!mediaInfo.base64,
      hasUrl: !!mediaInfo.url,
      base64Length: mediaInfo.base64 ? mediaInfo.base64.length : 0
    })

    let mediaBuffer: Buffer | null = null
    let sourceMethod: string = 'none'

    // Estratégia 1: Usar base64 primeiro (mais eficiente)
    if (mediaInfo.base64) {
      console.log('🔍 Analisando base64 recebido...')
      console.log('📝 Base64 info:', {
        length: mediaInfo.base64.length,
        startsWith: mediaInfo.base64.substring(0, 50) + '...',
        endsWith: '...' + mediaInfo.base64.substring(Math.max(0, mediaInfo.base64.length - 50))
      })

      // Validar base64 antes de processar
      const validation = validateBase64(mediaInfo.base64)
      console.log('🔍 Resultado da validação do base64:', validation)

      if (validation.valid) {
        console.log('✅ Base64 válido, tentando decodificação...')
        const decodeResult = decodeBase64(mediaInfo.base64)

        if (decodeResult.success && decodeResult.buffer) {
          mediaBuffer = decodeResult.buffer
          sourceMethod = decodeResult.method || 'base64'
          console.log('✅ Mídia carregada do base64 com sucesso:', {
            method: decodeResult.method,
            size: mediaBuffer.length,
            validationDetails: validation.details
          })
        } else {
          console.warn('⚠️ Falha na decodificação do base64:', decodeResult.error)
        }
      } else {
        console.warn('⚠️ Base64 inválido:', validation.error)
      }
    }

    // Estratégia 2: Download da URL como fallback
    if (!mediaBuffer && mediaInfo.url) {
      console.log('🌐 Tentando download da URL como fallback:', mediaInfo.url)
      mediaBuffer = await downloadMediaFromEvolution(mediaInfo.url)
      if (mediaBuffer) {
        sourceMethod = 'download'
        console.log('✅ Mídia baixada com sucesso:', mediaBuffer.length, 'bytes')
      }
    }

    // Se ainda não conseguiu o buffer, tentar métodos alternativos
    if (!mediaBuffer && mediaInfo.base64) {
      console.log('🔄 Tentando métodos alternativos de decodificação...')

      // Tentar sem validação prévia
      try {
        const cleanedBase64 = cleanBase64(mediaInfo.base64)
        if (cleanedBase64.length > 0) {
          mediaBuffer = Buffer.from(cleanedBase64, 'base64')
          if (mediaBuffer.length > 0) {
            sourceMethod = 'cleaned_base64'
            console.log('✅ Mídia carregada via base64 limpo:', mediaBuffer.length, 'bytes')
          }
        }
      } catch (error) {
        console.warn('⚠️ Falha no método alternativo:', error.message)
      }
    }

    // Verificação final
    if (!mediaBuffer) {
      console.error('❌ Não foi possível obter o arquivo de mídia por nenhum método')
      return null
    }

    // Validação final do buffer
    if (mediaBuffer.length === 0) {
      console.error('❌ Buffer de mídia está vazio')
      return null
    }

    console.log('📊 Estatísticas finais da mídia:', {
      sourceMethod,
      bufferSize: mediaBuffer.length,
      originalSize: mediaInfo.size,
      compressionRatio: mediaInfo.size ? (mediaBuffer.length / mediaInfo.size).toFixed(2) : 'N/A'
    })

    // Fazer upload para Supabase
    console.log('📤 Iniciando upload para Supabase...')
    const mediaUrl = await uploadMediaToSupabase(
      supabase,
      mediaBuffer,
      mediaInfo.filename,
      mediaInfo.mimetype,
      empresaId
    )

    if (!mediaUrl) {
      console.error('❌ Falha no upload da mídia para Supabase')
      return null
    }

    console.log('🎉 Processamento de mídia concluído com sucesso:', {
      mediaUrl,
      mediaType: mediaInfo.mimetype,
      mediaName: mediaInfo.filename,
      sourceMethod,
      size: mediaBuffer.length
    })

    return {
      mediaUrl,
      mediaType: mediaInfo.mimetype,
      mediaName: mediaInfo.filename
    }
  } catch (error) {
    console.error('❌ Erro crítico ao processar mídia:', {
      error: error.message,
      stack: error.stack,
      webhookData: {
        instance: webhookData.instance,
        messageType: webhookData.data.messageType,
        hasBase64: !!webhookData.data.message?.imageMessage?.base64 ||
                   !!webhookData.data.message?.videoMessage?.base64 ||
                   !!webhookData.data.message?.audioMessage?.base64 ||
                   !!webhookData.data.message?.documentMessage?.base64
      }
    })
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