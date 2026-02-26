import { db } from '~/server/db'
import {
  inboxes, contatos, atendimentos, mensagens
} from '~/server/db/schema'
import { eq, and, inArray, sql } from 'drizzle-orm'
import { uploadFile, getPublicUrl, deleteFile, urlToKey } from './storage'
import { webhookLogger, contatoLogger, atendimentoLogger, messageLogger } from './logger'

// ─────────────────────────────────────────────
// Interfaces de Webhook
// ─────────────────────────────────────────────

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
      stickerMessage?: any
      messageContextInfo?: any
      [key: string]: any
    }
    NewsletterMeta?: any
    RetryCount?: number
    SourceWebMsg?: any
    UnavailableRequestID?: string
  }
}

export type EvolutionWebhookData = EvolutionWebhookDataLegacy | EvolutionWebhookDataNew

export interface NormalizedWebhookData {
  instance: string
  remoteJid: string
  fromMe: boolean
  messageId: string
  pushName: string
  messageType: string
  messageTimestamp: number
  messageText: string
  message: any
}

export interface ProcessedMessage {
  contatoId: string
  atendimentoId: string
  mensagemId: string
  inboxId: string
  empresaId: string
}

// ─────────────────────────────────────────────
// Helpers de normalização de webhook
// ─────────────────────────────────────────────

function isNewWebhookFormat(webhookData: any): webhookData is EvolutionWebhookDataNew {
  return webhookData.event === 'Message' && webhookData.data?.Info !== undefined
}

function extractMessageTextFromNewFormat(message: any): string {
  if (message?.extendedTextMessage?.text) return message.extendedTextMessage.text
  if (message?.conversation) return message.conversation
  if (message?.imageMessage?.caption) return message.imageMessage.caption
  if (message?.videoMessage?.caption) return message.videoMessage.caption
  if (message?.documentMessage?.caption) return message.documentMessage.caption
  return ''
}

function detectMessageTypeFromNewFormat(data: any): string {
  const infoType = data.Info?.Type?.toLowerCase()
  const message = data.Message

  if (infoType === 'text') return 'conversation'
  if (infoType === 'image') return 'imageMessage'
  if (infoType === 'sticker') return 'stickerMessage'
  if (infoType === 'video') return 'videoMessage'
  if (infoType === 'audio' || infoType === 'ptt') return 'audioMessage'
  if (infoType === 'document') return 'documentMessage'

  if (message?.imageMessage) return 'imageMessage'
  if (message?.stickerMessage) return 'stickerMessage'
  if (message?.videoMessage) return 'videoMessage'
  if (message?.audioMessage) return 'audioMessage'
  if (message?.documentMessage) return 'documentMessage'
  if (message?.extendedTextMessage) return 'conversation'
  if (message?.conversation) return 'conversation'
  return 'conversation'
}

function parseTimestamp(timestamp: string | number | undefined): number {
  if (!timestamp) return Math.floor(Date.now() / 1000)
  if (typeof timestamp === 'number') {
    return timestamp > 10000000000 ? Math.floor(timestamp / 1000) : timestamp
  }
  const parsed = new Date(timestamp).getTime()
  return isNaN(parsed) ? Math.floor(Date.now() / 1000) : Math.floor(parsed / 1000)
}

export function normalizeWebhookData(webhookData: any): NormalizedWebhookData | null {
  try {
    if (isNewWebhookFormat(webhookData)) {
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

// ─────────────────────────────────────────────
// Funções de banco de dados (agora sem parâmetro supabase)
// ─────────────────────────────────────────────

export async function findInboxByInstance(instanceId: string): Promise<{ id: string, empresa_id: string } | null> {
  try {
    webhookLogger.debug('inbox.searching', `Buscando inbox por instance: ${instanceId}`)
    const rows = await db
      .select({ id: inboxes.id, empresa_id: inboxes.empresa_id })
      .from(inboxes)
      .where(eq(inboxes.id, instanceId))
      .limit(1)

    const inbox = rows[0]
    if (!inbox) {
      webhookLogger.logInboxNotFound(instanceId)
      return null
    }
    webhookLogger.debug('inbox.found', `Inbox encontrada: ${inbox.id}`, { inboxId: inbox.id, empresaId: inbox.empresa_id })
    return inbox as { id: string, empresa_id: string }
  } catch (error) {
    webhookLogger.error('inbox.search_error', `Erro ao buscar inbox por instance: ${instanceId}`, error)
    return null
  }
}

export function extractPhoneFromRemoteJid(remoteJid: string): string {
  return remoteJid
    .replace('@s.whatsapp.net', '')
    .replace('@g.us', '')
    .replace(/\D/g, '')
}

export async function findOrCreateContact(
  phone: string,
  name: string,
  empresaId: string
): Promise<{ id: string, isNew: boolean, profile_picture_url: string | null } | null> {
  try {
    contatoLogger.logContactProcessing(phone, name, empresaId)

    let normalizedPhone = phone.replace(/\D/g, '')
    if (!normalizedPhone.startsWith('55')) {
      normalizedPhone = '55' + normalizedPhone
    }

    // Buscar contato existente
    const existing = await db
      .select({ id: contatos.id, profile_picture_url: contatos.profile_picture_url })
      .from(contatos)
      .where(and(eq(contatos.telefone, normalizedPhone), eq(contatos.empresa_id, empresaId)))
      .limit(1)
      .then(r => r[0])

    if (existing) {
      contatoLogger.debug('contact.found', `Contato existente encontrado: ${existing.id}`, { contatoId: existing.id })
      return { id: existing.id, isNew: false, profile_picture_url: existing.profile_picture_url }
    }

    // Criar novo contato
    contatoLogger.info('contact.creating', `Criando novo contato: ${name}`, { phone: normalizedPhone, empresaId })

    try {
      const newContato = await db
        .insert(contatos)
        .values({
          nome: name,
          telefone: normalizedPhone,
          empresa_id: empresaId,
          total_mensagens: 0,
          data_ultimo_contato: new Date()
        })
        .returning({ id: contatos.id })
        .then(r => r[0])

      contatoLogger.logContactCreated(newContato.id, normalizedPhone, name, empresaId)
      return { id: newContato.id, isNew: true, profile_picture_url: null }
    } catch (createError: any) {
      // Race condition: unique constraint violation
      if (createError?.code === '23505') {
        contatoLogger.debug('contact.race_condition', `Race condition detectada, buscando contato existente: ${normalizedPhone}`)
        const retryContato = await db
          .select({ id: contatos.id, profile_picture_url: contatos.profile_picture_url })
          .from(contatos)
          .where(and(eq(contatos.telefone, normalizedPhone), eq(contatos.empresa_id, empresaId)))
          .limit(1)
          .then(r => r[0])

        if (retryContato) {
          return { id: retryContato.id, isNew: false, profile_picture_url: retryContato.profile_picture_url }
        }
      }
      contatoLogger.error('contact.create_error', `Erro ao criar contato: ${name}`, createError)
      return null
    }
  } catch (error) {
    contatoLogger.error('contact.processing_error', `Erro em findOrCreateContact`, error, { phone, name, empresaId })
    return null
  }
}

export async function findOrCreateAtendimento(
  contatoId: string,
  inboxId: string
): Promise<{ id: string, isNew: boolean } | null> {
  try {
    // Buscar atendimento em aberto
    const existing = await db
      .select({ id: atendimentos.id })
      .from(atendimentos)
      .where(and(
        eq(atendimentos.contato_id, contatoId),
        eq(atendimentos.inbox_id, inboxId),
        inArray(atendimentos.status, ['aguardando', 'ativo'])
      ))
      .limit(1)
      .then(r => r[0])

    if (existing) {
      console.log('✅ Atendimento encontrado:', existing.id)
      return { id: existing.id, isNew: false }
    }

    // Criar novo atendimento
    console.log('🆘 Criando novo atendimento...')
    try {
      const newAtendimento = await db
        .insert(atendimentos)
        .values({
          contato_id: contatoId,
          inbox_id: inboxId,
          status: 'aguardando',
          ultimo_mensagem: '',
          ultimo_mensagem_time: new Date(),
          unread_count: 0
        })
        .returning({ id: atendimentos.id })
        .then(r => r[0])

      console.log('✅ Atendimento criado:', newAtendimento.id)
      return { id: newAtendimento.id, isNew: true }
    } catch (createError: any) {
      if (createError?.code === '23505') {
        console.log('⚠️ Race condition detectada em atendimento, buscando existente...')
        const retryAtendimento = await db
          .select({ id: atendimentos.id })
          .from(atendimentos)
          .where(and(
            eq(atendimentos.contato_id, contatoId),
            eq(atendimentos.inbox_id, inboxId),
            inArray(atendimentos.status, ['aguardando', 'ativo'])
          ))
          .limit(1)
          .then(r => r[0])

        if (retryAtendimento) {
          console.log('✅ Atendimento encontrado após race condition:', retryAtendimento.id)
          return { id: retryAtendimento.id, isNew: false }
        }
      }
      console.error('❌ Erro ao criar atendimento:', createError)
      return null
    }
  } catch (error) {
    console.error('❌ Erro em findOrCreateAtendimento:', error)
    return null
  }
}

export async function createMessage(
  atendimentoId: string,
  texto: string,
  remetente: 'contact' | 'user',
  messageType: string = 'text',
  evolutionMessageId?: string,
  messageTimestamp?: number,
  mediaData?: { url: string; type: string; name: string }
): Promise<string | null> {
  try {
    const msgTimestamp = messageTimestamp
      ? new Date(messageTimestamp * 1000)
      : new Date()

    const newMensagem = await db
      .insert(mensagens)
      .values({
        atendimento_id: atendimentoId,
        texto: texto,
        remetente: remetente,
        lida: remetente === 'user',
        timestamp: msgTimestamp,
        message_type: messageType === 'conversation' ? 'text' : messageType,
        evolution_status: 'delivered',
        evolution_message_id: evolutionMessageId || null,
        media_url: mediaData?.url || null,
        media_type: mediaData?.type || null,
        media_name: mediaData?.name || null
      })
      .returning({ id: mensagens.id })
      .then(r => r[0])

    const mediaInfo = mediaData ? ` (mídia: ${mediaData.name})` : ''
    console.log(`✅ Mensagem criada: ${newMensagem.id}${mediaInfo}`)
    return newMensagem.id
  } catch (error) {
    console.error('❌ Erro em createMessage:', error)
    return null
  }
}

export async function updateAtendimentoWithMessage(
  atendimentoId: string,
  messageText: string,
  messageTimestamp?: number,
  incrementUnread: boolean = true
): Promise<boolean> {
  try {
    const msgTime = messageTimestamp
      ? new Date(messageTimestamp * 1000)
      : new Date()

    if (incrementUnread) {
      await db
        .update(atendimentos)
        .set({
          ultimo_mensagem: messageText,
          ultimo_mensagem_time: msgTime,
          updated_at: new Date(),
          unread_count: sql`${atendimentos.unread_count} + 1`
        })
        .where(eq(atendimentos.id, atendimentoId))
    } else {
      await db
        .update(atendimentos)
        .set({
          ultimo_mensagem: messageText,
          ultimo_mensagem_time: msgTime,
          updated_at: new Date()
        })
        .where(eq(atendimentos.id, atendimentoId))
    }
    return true
  } catch (error) {
    console.error('❌ Erro em updateAtendimentoWithMessage:', error)
    return false
  }
}

export async function updateContactData(
  contatoId: string,
  atendimentoId: string,
  messageTimestamp?: number
): Promise<boolean> {
  try {
    const contactTime = messageTimestamp
      ? new Date(messageTimestamp * 1000)
      : new Date()

    await db
      .update(contatos)
      .set({
        data_ultimo_contato: contactTime,
        total_mensagens: sql`${contatos.total_mensagens} + 1`,
        ultimo_atendimento_id: atendimentoId,
        updated_at: new Date()
      })
      .where(eq(contatos.id, contatoId))

    return true
  } catch (error) {
    console.error('❌ Erro em updateContactData:', error)
    return false
  }
}

// ─────────────────────────────────────────────
// Funções de perfil e storage (MinIO)
// ─────────────────────────────────────────────

export async function fetchContactProfile(
  instanceId: string,
  phoneNumber: string
): Promise<{ pushName: string; fullName: string; profilePictureUrl: string } | null> {
  try {
    const config = useRuntimeConfig()
    const evolutionApiUrl = config.evolutionApiUrl
    const cleanPhone = phoneNumber.replace(/\D/g, '')

    console.log(`🔍 Buscando perfil do contato: ${cleanPhone} na instância ${instanceId}`)

    const url = `${evolutionApiUrl}/user/check`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': instanceId },
      body: JSON.stringify({ number: [cleanPhone] })
    })

    if (!response.ok) {
      console.warn(`⚠️ Falha ao buscar perfil do contato: ${response.status}`)
      return null
    }

    const data = await response.json()
    if (data?.data?.Users?.length > 0) {
      const user = data.data.Users[0]
      let profileUrl = user.ProfilePictureUrl || ''
      if (profileUrl.includes('.enc')) profileUrl = profileUrl.replace('.enc', '.jpg')
      return {
        pushName: user.PushName || '',
        fullName: user.FullName || '',
        profilePictureUrl: profileUrl
      }
    }
    return null
  } catch (error) {
    console.error('❌ Erro ao buscar perfil do contato:', error)
    return null
  }
}

export async function downloadAndUploadProfilePicture(
  empresaId: string,
  externalUrl: string
): Promise<string | null> {
  try {
    if (!externalUrl) return null
    console.log(`📥 Baixando foto de perfil: ${externalUrl}`)

    const response = await fetch(externalUrl)
    if (!response.ok) {
      console.warn('❌ Falha ao baixar imagem de perfil:', response.status)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const key = `${empresaId}/profile_${timestamp}_${random}.jpg`

    console.log(`💾 Armazenando perfil em: ${key}`)
    const publicUrl = await uploadFile(key, buffer, 'image/jpeg')
    return publicUrl
  } catch (error) {
    console.error('❌ Erro em downloadAndUploadProfilePicture:', error)
    return null
  }
}

export async function deleteOldProfilePicture(oldUrl: string): Promise<void> {
  try {
    if (!oldUrl) return
    const key = urlToKey(oldUrl)
    if (!key) return
    console.log(`🗑️ Removendo foto de perfil antiga: ${key}`)
    await deleteFile(key)
    console.log('✅ Foto antiga removida com sucesso')
  } catch (error) {
    console.error('❌ Erro em deleteOldProfilePicture:', error)
  }
}

// ─────────────────────────────────────────────
// Upload de mídia de mensagens
// ─────────────────────────────────────────────

export async function uploadMediaToStorage(
  empresaId: string,
  base64Data: string,
  mimeType: string,
  fileName: string
): Promise<{ url: string, path: string } | null> {
  try {
    console.log(`📤 Fazendo upload de mídia: ${fileName} (${mimeType})`)

    const extension = fileName.split('.').pop() || getFileExtensionFromMimeType(mimeType)
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const uniqueFileName = `msg_${timestamp}_${random}.${extension}`
    const key = `${empresaId}/${uniqueFileName}`

    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(cleanBase64, 'base64')

    console.log(`💾 Armazenando em: ${key}`)
    const publicUrl = await uploadFile(key, buffer, mimeType)

    console.log(`✅ Upload realizado com sucesso: ${publicUrl}`)
    return { url: publicUrl, path: key }
  } catch (error) {
    console.error('❌ Erro em uploadMediaToStorage:', error)
    return null
  }
}

// Alias mantido para compatibilidade com código existente
export const uploadMediaToSupabase = uploadMediaToStorage

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
    const base64 = message?.base64
    if (!base64) {
      console.log(`❌ Base64 não encontrado em message.base64`)
      return null
    }

    let mediaData: any = null
    let mimeType = ''
    let fileName = ''
    let caption: string | undefined
    let fileLength = 0
    let duration: number | undefined
    let width: number | undefined
    let height: number | undefined

    switch (messageType) {
      case 'imageMessage':
        mediaData = message.imageMessage
        mimeType = mediaData?.mimetype || 'image/jpeg'
        fileName = `image_${Date.now()}.${getFileExtensionFromMimeType(mimeType)}`
        caption = mediaData?.caption
        width = mediaData?.width
        height = mediaData?.height
        fileLength = mediaData?.fileLength
        break
      case 'stickerMessage':
        mediaData = message.stickerMessage
        mimeType = mediaData?.mimetype || 'image/webp'
        fileName = `sticker_${Date.now()}.${getFileExtensionFromMimeType(mimeType)}`
        width = mediaData?.width
        height = mediaData?.height
        fileLength = mediaData?.fileLength
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
        break
      case 'audioMessage':
        mediaData = message.audioMessage
        mimeType = mediaData?.mimetype || 'audio/ogg'
        fileName = `audio_${Date.now()}.${getFileExtensionFromMimeType(mimeType)}`
        duration = mediaData?.seconds
        fileLength = mediaData?.fileLength
        break
      case 'documentMessage':
        mediaData = message.documentMessage
        mimeType = mediaData?.mimetype || 'application/pdf'
        fileName = mediaData?.fileName || `document_${Date.now()}.${getFileExtensionFromMimeType(mimeType)}`
        caption = mediaData?.caption
        fileLength = mediaData?.fileLength
        break
      default:
        console.log(`⚠️ Tipo de mídia não suportado: ${messageType}`)
        return null
    }

    return { base64, mimeType, fileName, caption, fileLength, duration, width, height }
  } catch (error) {
    console.error('❌ Erro ao extrair informações de mídia:', error)
    return null
  }
}

// ─────────────────────────────────────────────
// Processamento principal do webhook
// ─────────────────────────────────────────────

export async function processEvolutionMessage(webhookData: any): Promise<ProcessedMessage | null> {
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
    webhookLogger.logWebhookReceived(webhookData.event, instance, { remoteJid, pushName, messageType, fromMe })

    // Ignorar mensagens de status e canais
    if (remoteJid === 'status@broadcast') {
      webhookLogger.debug('message.ignored', 'Mensagem de status, ignorando...', { instance, remoteJid })
      return null
    }
    if (remoteJid?.includes('@newsletter')) {
      webhookLogger.debug('message.ignored', 'Mensagem de newsletter, ignorando...', { instance, remoteJid })
      return null
    }
    if (fromMe === true) {
      webhookLogger.debug('message.ignored', 'Mensagem enviada por mim, ignorando...', { instance, remoteJid })
      return null
    }
    if (!remoteJid) {
      webhookLogger.warn('message.invalid_data', 'Mensagem sem remoteJid', { instance })
      return null
    }

    let messageText = initialMessageText
    let previewText = initialMessageText
    let mediaData: { url: string; type: string; name: string } | null = null
    let processedMessageType = 'text'

    // Processar mídia
    if (messageType && messageType !== 'conversation') {
      console.log(`🎯 Detectado tipo de mídia: ${messageType}`)
      const mediaInfo = extractMediaInfo(message, messageType)

      if (mediaInfo && mediaInfo.base64) {
        // Buscar inbox primeiro para obter empresa_id
        const inboxForMedia = await findInboxByInstance(instance)
        if (!inboxForMedia) {
          webhookLogger.logInboxNotFound(instance)
          return null
        }

        const uploadResult = await uploadMediaToStorage(
          inboxForMedia.empresa_id,
          mediaInfo.base64,
          mediaInfo.mimeType,
          mediaInfo.fileName
        )

        if (uploadResult) {
          mediaData = { url: uploadResult.url, type: mediaInfo.mimeType, name: mediaInfo.fileName }

          if (messageType === 'imageMessage') {
            messageText = mediaInfo.caption || ''
            previewText = mediaInfo.caption || '📷 Imagem'
            processedMessageType = 'image'
          } else if (messageType === 'stickerMessage') {
            messageText = ''
            previewText = '💟 Figurinha'
            processedMessageType = 'image'
          } else if (messageType === 'videoMessage') {
            messageText = mediaInfo.caption || ''
            previewText = mediaInfo.caption || '🎥 Vídeo'
            processedMessageType = 'video'
          } else if (messageType === 'audioMessage') {
            messageText = ''
            previewText = '🎵 Áudio'
            processedMessageType = 'audio'
          } else if (messageType === 'documentMessage') {
            messageText = mediaInfo.caption || ''
            previewText = mediaInfo.caption || '📄 Documento'
            processedMessageType = 'document'
          }
        } else {
          messageText = `[Mídia não processada: ${messageType}]`
          previewText = messageText
        }
      } else {
        messageText = `[Mídia inválida: ${messageType}]`
        previewText = messageText
      }
    } else if (!messageText?.trim()) {
      webhookLogger.warn('message.invalid_data', 'Mensagem sem conteúdo', { remoteJid, instance })
      return null
    }

    // 1. Encontrar inbox
    const inbox = await findInboxByInstance(instance)
    if (!inbox) {
      webhookLogger.logInboxNotFound(instance)
      return null
    }

    // 2. Buscar ou criar contato
    const phone = extractPhoneFromRemoteJid(remoteJid)
    const contactName = fromMe ? phone : pushName
    const contato = await findOrCreateContact(phone, contactName, inbox.empresa_id)
    if (!contato) {
      webhookLogger.error('contact.not_found', `Não foi possível encontrar/criar contato: ${pushName}`, null, { phone, instance })
      return null
    }

    // 3. Buscar ou criar atendimento
    const atendimento = await findOrCreateAtendimento(contato.id, inbox.id)
    if (!atendimento) {
      webhookLogger.error('atendimento.not_found', `Não foi possível encontrar/criar atendimento`, null, { contatoId: contato.id, instance })
      return null
    }

    // 4. Atualizar perfil do contato se atendimento é novo
    if (atendimento.isNew) {
      try {
        const profile = await fetchContactProfile(instance, phone)
        if (profile) {
          const updateData: any = {}

          if (contato.isNew) {
            const bestName = profile.fullName || profile.pushName || phone
            if (bestName) updateData.nome = bestName
          }

          if (profile.profilePictureUrl) {
            const newInternalUrl = await downloadAndUploadProfilePicture(inbox.empresa_id, profile.profilePictureUrl)
            if (newInternalUrl) {
              if (contato.profile_picture_url) {
                await deleteOldProfilePicture(contato.profile_picture_url)
              }
              updateData.profile_picture_url = newInternalUrl
            }
          }

          if (Object.keys(updateData).length > 0) {
            await db.update(contatos).set(updateData).where(eq(contatos.id, contato.id))
            console.log(`👤 Perfil do contato atualizado:`, updateData)
          }
        }
      } catch (err) {
        console.error('❌ Erro ao atualizar perfil do contato:', err)
      }
    }

    // 5. Criar mensagem
    const mensagemId = await createMessage(
      atendimento.id,
      messageText,
      fromMe ? 'user' : 'contact',
      processedMessageType,
      evolutionMessageId,
      messageTimestamp,
      mediaData || undefined
    )

    if (!mensagemId) {
      webhookLogger.error('message.create_failed', `Não foi possível criar mensagem`, null, { atendimentoId: atendimento.id })
      return null
    }

    // 6. Atualizar atendimento
    await updateAtendimentoWithMessage(atendimento.id, previewText, messageTimestamp, !fromMe)

    // 7. Atualizar contato
    await updateContactData(contato.id, atendimento.id, messageTimestamp)

    const result = {
      contatoId: contato.id,
      atendimentoId: atendimento.id,
      mensagemId,
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

// ─────────────────────────────────────────────
// Funções auxiliares de Evolution API
// ─────────────────────────────────────────────

export async function findEvolutionInstanceId(
  _config: any,
  instanceName: string
): Promise<string | null> {
  try {
    const config = useRuntimeConfig()
    const evolutionApiUrl = config.evolutionApiUrl
    const evolutionApiKey = config.evolutionApiKey

    if (!evolutionApiUrl || !evolutionApiKey) return null

    const response = await $fetch(`${evolutionApiUrl}/instance/all`, {
      method: 'GET',
      headers: { 'apikey': evolutionApiKey as string }
    })

    const instances = (response as any)?.data || []
    const instance = instances.find((inst: any) => inst.name === instanceName)
    return instance?.id || null
  } catch (error) {
    console.error('❌ Erro ao buscar instâncias na Evolution API:', error)
    return null
  }
}

export function validateWebhookOrigin(headers: any, apiKey: string): boolean {
  return !!(headers && apiKey)
}

export async function checkWhatsAppNumber(
  instanceId: string,
  phoneNumber: string
): Promise<{ exists: boolean; jid?: string; error?: string }> {
  try {
    const config = useRuntimeConfig()
    const evolutionApiUrl = config.evolutionApiUrl

    if (!evolutionApiUrl) return { exists: false, error: 'Configuração da Evolution API não encontrada' }

    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const response = await fetch(`${evolutionApiUrl}/user/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': instanceId },
      body: JSON.stringify({ number: [cleanPhone], formatJid: false })
    })

    if (!response.ok) {
      return { exists: false, error: `Erro na Evolution API: ${response.status}` }
    }

    const data = await response.json()
    if (data?.data?.Users?.length > 0) {
      const result = data.data.Users[0]
      return { exists: result.IsInWhatsapp === true, jid: result.JID }
    }

    return { exists: false, error: 'Resposta inválida da API' }
  } catch (error) {
    return { exists: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

export async function sendTextMessageToWhatsApp(
  instanceId: string,
  phoneNumber: string,
  messageText: string
): Promise<{ success: boolean; messageId?: string; status?: string; error?: string }> {
  try {
    const config = useRuntimeConfig()
    const evolutionApiUrl = config.evolutionApiUrl

    if (!evolutionApiUrl) return { success: false, error: 'Configuração da Evolution API não encontrada' }

    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const response = await fetch(`${evolutionApiUrl}/send/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': instanceId },
      body: JSON.stringify({ number: cleanPhone, text: messageText })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `Evolution API retornou status ${response.status}: ${errorText}` }
    }

    const data = await response.json()
    return { success: true, messageId: data.data?.Info?.ID, status: 'PENDING' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

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
    const config = useRuntimeConfig()
    const evolutionApiUrl = config.evolutionApiUrl

    if (!evolutionApiUrl) return { success: false, error: 'Configuração da Evolution API não encontrada' }

    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const body: any = { number: cleanPhone, type: mediaType, url: mediaUrl }
    if (caption && (mediaType === 'image' || mediaType === 'video')) body.caption = caption
    if (mimeType) body.mimetype = mimeType
    if (fileName && mediaType === 'document') body.fileName = fileName

    const response = await fetch(`${evolutionApiUrl}/send/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': instanceId },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `Evolution API retornou status ${response.status}: ${errorText}` }
    }

    const data = await response.json()
    return { success: true, messageId: data.data?.Info?.ID, status: 'PENDING' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

export async function sendAudioToWhatsApp(
  instanceId: string,
  phoneNumber: string,
  audioUrl: string
): Promise<{ success: boolean; messageId?: string; status?: string; error?: string }> {
  return sendMediaToWhatsApp(instanceId, phoneNumber, audioUrl, 'audio')
}
