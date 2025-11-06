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
  fileSha256?: string
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
      base64: audio.base64,
      fileSha256: audio.fileSha256
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
      base64: image.base64,
      fileSha256: image.fileSha256
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
      base64: video.base64,
      fileSha256: video.fileSha256
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
      base64: doc.base64,
      fileSha256: doc.fileSha256
    }
  }

  return null
}

/**
 * Valida se uma string base64 é válida e completa
 */
export function isValidBase64(base64: string, expectedLength?: number): boolean {
  try {
    // Verificar formato básico
    const base64Regex = /^[A-Za-z0-9+/]+=*$/
    if (!base64Regex.test(base64)) {
      console.log('❌ Base64 inválido: formato incorreto')
      return false
    }

    // Verificar padding (máximo 2 =)
    const padding = base64.match(/[=]+$/)?.[0] || ''
    if (padding.length > 2) {
      console.log('❌ Base64 inválido: padding excessivo')
      return false
    }

    // Verificar se não está truncado (tamanho mínimo)
    if (base64.length < 4) {
      console.log('❌ Base64 inválido: muito curto')
      return false
    }

    // Verificar tamanho esperado se fornecido
    if (expectedLength) {
      const expectedBase64Length = Math.ceil(expectedLength / 3) * 4
      if (Math.abs(base64.length - expectedBase64Length) > 4) {
        console.log('❌ Base64 inválido: tamanho não corresponde ao esperado', {
          actual: base64.length,
          expected: expectedBase64Length
        })
        return false
      }
    }

    // Tentar decodificar para validar completamente
    const decoded = Buffer.from(base64, 'base64')
    if (decoded.length === 0) {
      console.log('❌ Base64 inválido: decodificação resultou em buffer vazio')
      return false
    }

    return true
  } catch (error) {
    console.error('❌ Erro na validação de base64:', error)
    return false
  }
}

/**
 * Verifica o hash SHA256 de um buffer
 */
export async function validateSha256Hash(buffer: Buffer, expectedHash: string): Promise<boolean> {
  try {
    const crypto = await import('crypto')
    const actualHash = crypto.createHash('sha256').update(buffer).digest('base64')

    const isValid = actualHash === expectedHash
    if (!isValid) {
      console.log('❌ Hash SHA256 não corresponde:', {
        expected: expectedHash,
        actual: actualHash
      })
    } else {
      console.log('✅ Hash SHA256 validado com sucesso')
    }

    return isValid
  } catch (error) {
    console.error('❌ Erro na validação de hash:', error)
    return false
  }
}

/**
 * Valida se um buffer representa uma imagem válida
 */
export function validateImageBuffer(buffer: Buffer, mimeType: string): boolean {
  try {
    // Verificar tamanho mínimo
    if (buffer.length < 100) {
      console.log('❌ Buffer muito pequeno para ser uma imagem válida')
      return false
    }

    // Verificar magic numbers baseados no tipo
    const signature = buffer.subarray(0, 12)

    if (mimeType.includes('jpeg')) {
      // JPEG: FF D8 FF
      return signature[0] === 0xFF && signature[1] === 0xD8 && signature[2] === 0xFF
    } else if (mimeType.includes('png')) {
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      return signature.toString('ascii', 1, 8) === 'PNG\r\n\x1a\n'
    } else if (mimeType.includes('gif')) {
      // GIF: 47 49 46 38
      return signature.toString('ascii', 0, 4) === 'GIF8'
    } else if (mimeType.includes('webp')) {
      // WebP: 52 49 46 46 ... 57 45 42 50
      return signature.toString('ascii', 0, 4) === 'RIFF' &&
             signature.toString('ascii', 8, 12) === 'WEBP'
    }

    // Para outros tipos, apenas verificar se não está vazio
    return buffer.length > 0
  } catch (error) {
    console.error('❌ Erro na validação de imagem:', error)
    return false
  }
}

/**
 * Baixa mídia da Evolution API com validações robustas
 */
export async function downloadMediaFromEvolution(
  mediaUrl: string,
  expectedSize?: number,
  expectedMimeType?: string
): Promise<Buffer | null> {
  try {
    console.log('🔽 Baixando mídia da Evolution API:', {
      url: mediaUrl,
      expectedSize,
      expectedMimeType
    })

    const response = await fetch(mediaUrl, {
      timeout: 30000, // 30 segundos timeout
      headers: {
        'User-Agent': 'Artemis-WhatsApp-Webhook/1.0'
      }
    })

    if (!response.ok) {
      console.error('❌ Erro ao baixar mídia:', {
        status: response.status,
        statusText: response.statusText,
        url: mediaUrl
      })
      return null
    }

    // Validar Content-Type
    const contentType = response.headers.get('content-type')
    if (expectedMimeType && contentType && !contentType.includes(expectedMimeType.split('/')[0])) {
      console.warn('⚠️ Content-Type não corresponde ao esperado:', {
        received: contentType,
        expected: expectedMimeType
      })
    }

    // Validar Content-Length se disponível
    const contentLength = response.headers.get('content-length')
    if (contentLength && expectedSize) {
      const receivedSize = parseInt(contentLength)
      if (Math.abs(receivedSize - expectedSize) > 1000) { // permitir diferença de até 1KB
        console.warn('⚠️ Tamanho do conteúdo não corresponde ao esperado:', {
          received: receivedSize,
          expected: expectedSize,
          difference: Math.abs(receivedSize - expectedSize)
        })
      }
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validar tamanho mínimo
    if (buffer.length < 100) {
      console.error('❌ Buffer muito pequeno após download:', {
        size: buffer.length,
        url: mediaUrl
      })
      return null
    }

    // Validar tamanho se esperado
    if (expectedSize && Math.abs(buffer.length - expectedSize) > expectedSize * 0.1) {
      console.warn('⚠️ Tamanho do buffer difere significativamente:', {
        actual: buffer.length,
        expected: expectedSize,
        differencePercent: ((buffer.length - expectedSize) / expectedSize * 100).toFixed(2) + '%'
      })
    }

    console.log('✅ Mídia baixada com sucesso:', {
      size: buffer.length,
      contentType,
      url: mediaUrl.substring(0, 100) + '...'
    })
    return buffer
  } catch (error) {
    console.error('❌ Erro ao baixar mídia:', {
      error: error.message,
      url: mediaUrl.substring(0, 100) + '...'
    })
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
 * Processa mídia do webhook e faz upload para o Supabase
 */
export async function processMediaMessage(
  supabase: SupabaseClient,
  webhookData: EvolutionWebhookData,
  empresaId: string
): Promise<{ mediaUrl: string; mediaType: string; mediaName: string } | null> {
  const startTime = Date.now()

  try {
    console.log('🔍 [INÍCIO] Processando mídia - Timestamp:', startTime)

    const mediaInfo = extractMediaInfo(webhookData)
    if (!mediaInfo) {
      console.log('📷 Nenhuma mídia encontrada na mensagem')
      return null
    }

    console.log('📷 Informações da mídia:', {
      type: mediaInfo.type,
      filename: mediaInfo.filename,
      mimetype: mediaInfo.mimetype,
      size: mediaInfo.size,
      hasBase64: !!mediaInfo.base64,
      hasUrl: !!mediaInfo.url,
      caption: mediaInfo.caption
    })

    let mediaBuffer: Buffer | null = null
    let sourceMethod = ''

    // === MÉTODO 1: Tentar base64 primeiro (mais eficiente) ===
    if (mediaInfo.base64) {
      console.log('🔍 [BASE64] Validando base64 antes do processamento...')

      // Validar base64 robustamente
      const isBase64Valid = isValidBase64(mediaInfo.base64, mediaInfo.size)
      if (!isBase64Valid) {
        console.warn('⚠️ [BASE64] Base64 inválido, tentando download da URL')
      } else {
        try {
          mediaBuffer = Buffer.from(mediaInfo.base64, 'base64')
          sourceMethod = 'base64'

          console.log('✅ [BASE64] Mídia carregada do base64:', {
            size: mediaBuffer.length,
            expectedSize: mediaInfo.size,
            difference: mediaBuffer.length - mediaInfo.size
          })

          // Validar integridade do buffer
          if (mediaInfo.type === 'image' && !validateImageBuffer(mediaBuffer, mediaInfo.mimetype)) {
            console.warn('⚠️ [BASE64] Buffer não representa uma imagem válida, tentando download')
            mediaBuffer = null
          }

          // Validar hash se disponível
          if (mediaInfo.fileSha256 && mediaBuffer) {
            const hashValid = await validateSha256Hash(mediaBuffer, mediaInfo.fileSha256)
            if (!hashValid) {
              console.warn('⚠️ [BASE64] Hash SHA256 não corresponde, tentando download')
              mediaBuffer = null
            }
          }

        } catch (error) {
          console.error('❌ [BASE64] Erro ao processar base64:', error)
          mediaBuffer = null
        }
      }
    }

    // === MÉTODO 2: Download da URL (fallback) ===
    if (!mediaBuffer && mediaInfo.url) {
      console.log('🔍 [DOWNLOAD] Tentando download da URL...')

      mediaBuffer = await downloadMediaFromEvolution(
        mediaInfo.url,
        mediaInfo.size,
        mediaInfo.mimetype
      )

      if (mediaBuffer) {
        sourceMethod = 'download'

        // Validar buffer baixado
        if (mediaInfo.type === 'image' && !validateImageBuffer(mediaBuffer, mediaInfo.mimetype)) {
          console.error('❌ [DOWNLOAD] Buffer baixado não representa uma imagem válida')
          return null
        }

        // Validar hash se disponível
        if (mediaInfo.fileSha256) {
          const hashValid = await validateSha256Hash(mediaBuffer, mediaInfo.fileSha256)
          if (!hashValid) {
            console.error('❌ [DOWNLOAD] Hash SHA256 não corresponde ao esperado')
            return null
          }
        }
      }
    }

    // === VALIDAÇÃO FINAL ===
    if (!mediaBuffer) {
      console.error('❌ [FALHA] Não foi possível obter o arquivo de mídia por nenhum método')
      return null
    }

    // Validação final de tamanho
    if (mediaInfo.size && Math.abs(mediaBuffer.length - mediaInfo.size) > mediaInfo.size * 0.2) {
      console.error('❌ [FALHA] Tamanho final do buffer é muito diferente do esperado:', {
        actual: mediaBuffer.length,
        expected: mediaInfo.size,
        differencePercent: ((mediaBuffer.length - mediaInfo.size) / mediaInfo.size * 100).toFixed(2) + '%'
      })
      return null
    }

    console.log('✅ [SUCESSO] Buffer validado e pronto para upload:', {
      sourceMethod,
      finalSize: mediaBuffer.length,
      processingTime: Date.now() - startTime
    })

    // === UPLOAD PARA SUPABASE ===
    console.log('📤 [UPLOAD] Iniciando upload para Supabase Storage...')

    const mediaUrl = await uploadMediaToSupabase(
      supabase,
      mediaBuffer,
      mediaInfo.filename,
      mediaInfo.mimetype,
      empresaId
    )

    if (!mediaUrl) {
      console.error('❌ [FALHA] Falha no upload da mídia')
      return null
    }

    const totalTime = Date.now() - startTime

    console.log('✅ [COMPLETO] Mídia processada com sucesso:', {
      mediaUrl,
      filename: mediaInfo.filename,
      mimetype: mediaInfo.mimetype,
      size: mediaBuffer.length,
      sourceMethod,
      totalTime: `${totalTime}ms`
    })

    return {
      mediaUrl,
      mediaType: mediaInfo.mimetype,
      mediaName: mediaInfo.filename
    }

  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error('❌ [ERRO] Erro crítico ao processar mídia:', {
      error: error.message,
      stack: error.stack,
      totalTime: `${totalTime}ms`
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