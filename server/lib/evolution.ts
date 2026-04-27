import { eq, and, inArray, sql as drizzleSql } from 'drizzle-orm'
import { db, schema } from '~/server/database'
import { getStorageClient, MINIO_BUCKET, getPublicUrl } from '~/server/lib/storage'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { webhookLogger, contatoLogger, atendimentoLogger, messageLogger } from './logger'

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
  if (infoType === 'sticker') {
    return 'stickerMessage'
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
  if (message?.stickerMessage) return 'stickerMessage'
  if (message?.videoMessage) return 'videoMessage'
  if (message?.audioMessage) return 'audioMessage'
  if (message?.documentMessage) return 'documentMessage'
  if (message?.extendedTextMessage) return 'conversation'
  if (message?.conversation) return 'conversation'

  return 'conversation'
}

function parseTimestamp(timestamp: string | number | undefined): number {
  if (!timestamp) {
    return Math.floor(Date.now() / 1000)
  }

  if (typeof timestamp === 'number') {
    return timestamp > 10000000000 ? Math.floor(timestamp / 1000) : timestamp
  }

  // Parse ISO string
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

/**
 * Encontra o ID interno da instância na Evolution API buscando pelo nome (que usamos como ID da inbox)
 */
export async function findEvolutionInstanceId(
  config: any,
  instanceName: string
): Promise<string | null> {
  try {
    const config = useRuntimeConfig()
    console.log(`🔍 Buscando ID interno da instância Evolution para: ${instanceName}`)

    // Garantir que temos a URL e Key da Evolution API
    const evolutionApiUrl = config.evolutionApiUrl
    const evolutionApiKey = config.evolutionApiKey

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.warn('⚠️ EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados (buscando instância)')
      return null
    }

    const response = await $fetch(`${evolutionApiUrl}/instance/all`, {
      method: 'GET',
      headers: {
        'apikey': evolutionApiKey as string
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
export async function findInboxByInstance(instanceId: string): Promise<{ id: string, empresa_id: string } | null> {
  try {
    webhookLogger.debug('inbox.searching', `Buscando inbox por instance: ${instanceId}`)
    const rows = await db
      .select({ id: inboxes.id, empresa_id: inboxes.empresa_id })
      .from(inboxes)
      .where(eq(inboxes.id, instanceId))
      .limit(1)

    const [data] = await db.select({ id: schema.inboxes.id, empresa_id: schema.inboxes.empresa_id })
      .from(schema.inboxes)
      .where(eq(schema.inboxes.id, instanceId))
      .limit(1)

    if (!data) {
      webhookLogger.logInboxNotFound(instanceId)
      return null
    }

    webhookLogger.debug('inbox.found', `Inbox encontrada: ${data.id}`, { inboxId: data.id, empresaId: data.empresa_id })
    return { id: data.id, empresa_id: data.empresa_id! }
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
    .replace('@g.us', '')
    .replace(/\D/g, '')
}

export async function findOrCreateContact(
  phone: string,
  name: string,
  empresaId: string
): Promise<{ id: string, isNew: boolean, profile_picture_url?: string | null } | null> {
  try {
    contatoLogger.logContactProcessing(phone, name, empresaId)

    let normalizedPhone = phone.replace(/\D/g, '')
    if (!normalizedPhone.startsWith('55')) {
      normalizedPhone = '55' + normalizedPhone
    }

    // Primeiro, tenta buscar contato existente
    const [contato] = await db.select({ id: schema.contatos.id, profile_picture_url: schema.contatos.avatar_url })
      .from(schema.contatos)
      .where(and(eq(schema.contatos.telefone, normalizedPhone), eq(schema.contatos.empresa_id, empresaId)))
      .limit(1)

    if (contato) {
      contatoLogger.debug('contact.found', `Contato existente encontrado: ${contato.id}`, { contatoId: contato.id })
      return { id: contato.id, isNew: false, profile_picture_url: contato.profile_picture_url }
    }

    // Criar novo contato
    contatoLogger.info('contact.creating', `Criando novo contato: ${name}`, { phone: normalizedPhone, empresaId })

    try {
      const [newContato] = await db.insert(schema.contatos).values({
        nome: name,
        telefone: normalizedPhone,
        empresa_id: empresaId,
      }).returning({ id: schema.contatos.id })

      if (!newContato) return null

      contatoLogger.logContactCreated(newContato.id, normalizedPhone, name, empresaId)
      return { id: newContato.id, isNew: true }
    } catch (insertErr: any) {
      // 23505 = unique_violation (race condition)
      if (insertErr?.code === '23505') {
        contatoLogger.debug('contact.race_condition', `Race condition detectada, buscando contato existente: ${normalizedPhone}`, { phone: normalizedPhone, empresaId })
        const [existingContato] = await db.select({ id: schema.contatos.id })
          .from(schema.contatos)
          .where(and(eq(schema.contatos.telefone, normalizedPhone), eq(schema.contatos.empresa_id, empresaId)))
          .limit(1)

        if (existingContato) {
          return { id: existingContato.id, isNew: false }
        }
      }
      contatoLogger.error('contact.create_error', `Erro ao criar contato: ${name}`, insertErr, { phone: normalizedPhone, empresaId })
      return null
    }
  } catch (error) {
    contatoLogger.error('contact.processing_error', `Erro em findOrCreateContact`, error, { phone, name, empresaId })
    return null
  }
}



/**
 * Busca ou cria um atendimento para o contato
 * Usa índice único parcial para prevenir duplicatas em race conditions
 */
export async function findOrCreateAtendimento(
  contatoId: string,
  inboxId: string
): Promise<{ id: string, isNew: boolean } | null> {
  try {
    // Buscar atendimento em aberto
    const [atendimento] = await db.select({ id: schema.atendimentos.id })
      .from(schema.atendimentos)
      .where(and(
        eq(schema.atendimentos.contato_id, contatoId),
        eq(schema.atendimentos.inbox_id, inboxId),
        inArray(schema.atendimentos.status, ['aguardando', 'ativo', 'open'])
      ))
      .limit(1)

    if (atendimento) {
      console.log('✅ Atendimento encontrado:', atendimento.id)
      return { id: atendimento.id, isNew: false }
    }

    // Criar novo atendimento
    console.log('🆘 Criando novo atendimento...')
    try {
      const [newAtendimento] = await db.insert(schema.atendimentos).values({
        contato_id: contatoId,
        inbox_id: inboxId,
        status: 'open',
        unread_count: 0,
      }).returning({ id: schema.atendimentos.id })

      if (!newAtendimento) return null

      console.log('✅ Atendimento criado:', newAtendimento.id)
      return { id: newAtendimento.id, isNew: true }
    } catch (insertErr: any) {
      if (insertErr?.code === '23505') {
        console.log('⚠️ Race condition detectada em atendimento, buscando existente...')
        const [existingAtendimento] = await db.select({ id: schema.atendimentos.id })
          .from(schema.atendimentos)
          .where(and(
            eq(schema.atendimentos.contato_id, contatoId),
            eq(schema.atendimentos.inbox_id, inboxId),
            inArray(schema.atendimentos.status, ['aguardando', 'ativo', 'open'])
          ))
          .limit(1)
        if (existingAtendimento) return { id: existingAtendimento.id, isNew: false }
      }
      console.error('❌ Erro ao criar atendimento:', insertErr)
      return null
    }
  } catch (error) {
    console.error('❌ Erro em findOrCreateAtendimento:', error)
    return null
  }
}




/**
 * Cria uma nova mensagem no banco de dados
 */
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
    const msgData: any = {
      atendimento_id: atendimentoId,
      content: texto,
      direction: remetente === 'user' ? 'outbound' : 'inbound',
      status: remetente === 'user' ? 'sent' : 'delivered',
      type: messageType === 'conversation' ? 'text' : messageType,
      external_id: evolutionMessageId || null,
      created_at: new Date(),
      metadata: mediaData ? { media_url: mediaData.url, media_type: mediaData.type, media_name: mediaData.name } : {},
    }

    const [mensagem] = await db.insert(schema.mensagens).values(msgData).returning({ id: schema.mensagens.id })

    if (!mensagem) {
      console.error('❌ Erro ao criar mensagem: nenhum registro retornado')
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
  atendimentoId: string,
  messageText: string,
  messageTimestamp?: number,
  incrementUnread: boolean = true
): Promise<boolean> {
  try {
    const updateData: any = {
      last_message_at: messageTimestamp ? new Date(messageTimestamp * 1000) : new Date(),
      updated_at: new Date()
    }

    if (incrementUnread) {
      const [current] = await db.select({ unread_count: schema.atendimentos.unread_count })
        .from(schema.atendimentos).where(eq(schema.atendimentos.id, atendimentoId)).limit(1)
      updateData.unread_count = (current?.unread_count || 0) + 1
    }

    await db.update(schema.atendimentos).set(updateData).where(eq(schema.atendimentos.id, atendimentoId))
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
  contatoId: string,
  atendimentoId: string,
  messageTimestamp?: number
): Promise<boolean> {
  try {
    const [current] = await db.select({ total_mensagens: drizzleSql<number>`0` })
      .from(schema.contatos).where(eq(schema.contatos.id, contatoId)).limit(1)

    await db.update(schema.contatos).set({
      updated_at: new Date()
    }).where(eq(schema.contatos.id, contatoId))

    return true
  } catch (error) {
    console.error('❌ Erro em updateContactData:', error)
    return false
  }
}




/**
 * Busca perfil do contato na Evolution API (Nome e Foto)
 */
export async function fetchContactProfile(
  instanceId: string,
  phoneNumber: string
): Promise<{ pushName: string; fullName: string; profilePictureUrl: string } | null> {
  try {
    const config = useRuntimeConfig()
    const evolutionApiUrl = config.evolutionApiUrl

    // Remover caracteres não numéricos
    const cleanPhone = phoneNumber.replace(/\D/g, '')

    console.log(`🔍 Buscando perfil do contato: ${cleanPhone} na instância ${instanceId}`)

    const url = `${evolutionApiUrl}/user/check`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': instanceId
      },
      body: JSON.stringify({
        number: [cleanPhone]
      })
    })

    if (!response.ok) {
      console.warn(`⚠️ Falha ao buscar perfil do contato: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data?.data?.Users && Array.isArray(data.data.Users) && data.data.Users.length > 0) {
      const user = data.data.Users[0]

      // Converter url da foto se for .enc para .jpg
      let profileUrl = user.ProfilePictureUrl || ''
      if (profileUrl && profileUrl.includes('.enc')) {
        profileUrl = profileUrl.replace('.enc', '.jpg')
      }

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

/**
 * Faz download e upload da foto de perfil para o Minio Storage
 */
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
    const fileName = `profile_${timestamp}_${random}.jpg`
    const objectKey = `${empresaId}/${fileName}`

    console.log(`💾 Armazenando perfil em Minio: ${objectKey}`)

    const s3 = getStorageClient()
    await s3.send(new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: objectKey,
      Body: buffer,
      ContentType: 'image/jpeg',
    }))

    return getPublicUrl(objectKey)
  } catch (error) {
    console.error('❌ Erro em downloadAndUploadProfilePicture:', error)
    return null
  }
}




/**
 * Remove a foto de perfil antiga do bucket se for uma imagem interna
 */
export async function deleteOldProfilePicture(oldUrl: string): Promise<void> {
  try {
    if (!oldUrl) return

    // Only delete if url points to our Minio (contains /api/storage/ or minio endpoint config)
    const config = useRuntimeConfig()
    const minioEndpoint = config.minioEndpoint as string || ''
    if (!minioEndpoint || !oldUrl.includes(minioEndpoint)) {
      return // External URL, skip deletion
    }

    // Extract path from public URL: strip base url
    const parts = oldUrl.split('/' + MINIO_BUCKET + '/')
    if (parts.length < 2) return

    const path = parts[1]
    console.log(`🗑️ Removendo foto de perfil antiga do Minio: ${path}`)

    const s3 = getStorageClient()
    await s3.send(new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: path }))
    console.log('✅ Foto antiga removida com sucesso')
  } catch (error) {
    console.error('❌ Erro em deleteOldProfilePicture:', error)
  }
}




/**
 * Processa uma mensagem completa do webhook da Evolution API
 * Suporta tanto o formato antigo (messages.upsert) quanto o novo (Message)
 */
export async function processEvolutionMessage(webhookData: any): Promise<ProcessedMessage | null> {
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
    if (fromMe === true && evolutionMessageId) {
      // Pequeno atraso para dar tempo à api de envio (mensagens.post.ts) 
      // salvar o external_id no banco, evitando duplicidade em envios feitos pelo app
      await new Promise(resolve => setTimeout(resolve, 1500))

      const [existingMessage] = await db.select({ id: schema.mensagens.id })
        .from(schema.mensagens)
        .where(eq(schema.mensagens.external_id, evolutionMessageId))
        .limit(1)

      if (existingMessage) {
        webhookLogger.debug('message.ignored', 'Eco do webhook detectado. Mensagem já enviada pela API.', { instance, evolutionMessageId })
        return null
      }
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
        console.log(`📸 Processando mídia: ${mediaInfo.fileName}`)

        // Prosseguir com as outras etapas primeiro para obter empresa_id
        // 1. Encontrar inbox
        const inbox = await findInboxByInstance(instance)
        if (!inbox) {
          webhookLogger.logInboxNotFound(instance)
          return null
        }

        // Fazer upload da mídia para Minio
        const uploadResult = await uploadMediaToMinio(
          inbox.empresa_id,
          mediaInfo.base64,
          mediaInfo.mimeType,
          mediaInfo.fileName
        )

        if (uploadResult) {
          mediaData = { url: uploadResult.url, type: mediaInfo.mimeType, name: mediaInfo.fileName }

          // Configurar textos
          // messageText: corpo da mensagem (vazio se não tiver caption, para não aparecer texto na bolha)
          // previewText: texto da lista de conversas (fallback para tipo de mídia se vazio)

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

    webhookLogger.info('message.processing', `Processando mensagem de ${pushName}`, {
      remoteJid,
      messageText: messageText.substring(0, 50),
      previewText: previewText?.substring(0, 50),
      instance,
      messageType: processedMessageType,
      hasMedia: !!mediaData
    })

    // 1. Encontrar inbox (se já não foi encontrado acima)
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

          // Lógica de prioridade de nome:
          // 1. Nome salvo no banco (se contato já existia) -> Mantido (não entra no if abaixo)
          // 2. FullName (do WhatsApp do remetente)
          // 3. PushName (definido pelo próprio usuário)
          // 4. Número (fallback)

          // Se o contato foi criado agora (isNew=true), definimos o nome seguindo a prioridade
          if (contato.isNew) {
            const bestName = profile.fullName || profile.pushName || phone
            if (bestName) updateData.nome = bestName
          }

          if (profile.profilePictureUrl) {
            // Verificar se a URL mudou ou se é necessário atualizar
            // Se já temos uma URL interna e a nova URL externa é a mesma que usamos para gerar (improvável, pois não guardamos a externa),
            // ou se simplesmente queremos garantir a atualização.

            // Fazer upload da nova imagem para nosso storage Minio
            const newInternalUrl = await downloadAndUploadProfilePicture(inbox.empresa_id, profile.profilePictureUrl)

            if (newInternalUrl) {
              // Se upload com sucesso, deletar a antiga
              if (contato.profile_picture_url) {
                await deleteOldProfilePicture(contato.profile_picture_url)
              }

              updateData.profile_picture_url = newInternalUrl
            }
          }

          // Apply profile update if there are changes
          if (Object.keys(updateData).length > 0) {
            await db.update(schema.contatos)
              .set({ avatar_url: updateData.profile_picture_url, nome: updateData.nome, updated_at: new Date() })
              .where(eq(schema.contatos.id, contato.id))

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

    // 5. Atualizar atendimento
    await updateAtendimentoWithMessage(
      atendimento.id,
      previewText, // Usar texto de preview (com fallback para mídia)
      messageTimestamp,
      !fromMe // Incrementar não lidas apenas se NÃO for mensagem minha
    )

    // 6. Atualizar contato
    await updateContactData(
      contato.id,
      atendimento.id,
      messageTimestamp
    )

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

/**
 * Faz upload de mídia para o Minio Storage (s3-compatible)
 */
export async function uploadMediaToMinio(
  empresaId: string,
  base64Data: string,
  mimeType: string,
  fileName: string
): Promise<{ url: string, path: string } | null> {
  try {
    console.log(`📤 Fazendo upload de mídia para Minio: ${fileName} (${mimeType})`)

    const extension = fileName.split('.').pop() || getFileExtensionFromMimeType(mimeType)
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const uniqueFileName = `msg_${timestamp}_${random}.${extension}`
    const objectKey = `${empresaId}/${uniqueFileName}`

    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(cleanBase64, 'base64')

    console.log(`💾 Armazenando em Minio: ${objectKey}`)

    const s3 = getStorageClient()
    await s3.send(new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: objectKey,
      Body: buffer,
      ContentType: mimeType,
    }))

    const publicUrl = getPublicUrl(objectKey)
    console.log(`✅ Upload realizado com sucesso: ${publicUrl}`)

    return { url: publicUrl, path: objectKey }
  } catch (error) {
    console.error('❌ Erro em uploadMediaToMinio:', error)
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
    const base64 = message?.base64
    if (!base64) {
      console.log(`❌ Base64 não encontrado em message.base64`)
      return null
    }

    let mediaData = null
    let mimeType = ''
    let fileName = ''
    let caption = undefined
    let fileLength = 0
    let duration = undefined
    let width = undefined
    let height = undefined

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

    console.log(`✅ Mídia extraída com sucesso: ${fileName} (${mimeType})`)
    return { base64, mimeType, fileName, caption, fileLength, duration, width, height }
  } catch (error) {
    console.error('❌ Erro ao extrair informações de mídia:', error)
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

    if (!evolutionApiUrl || !evolutionApiKey) {
      return { exists: false, error: 'Configuração da Evolution API não encontrada' }
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const url = `${evolutionApiUrl}/user/check`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': instanceId },
      body: JSON.stringify({ number: [cleanPhone], formatJid: false })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { exists: false, error: `Erro na Evolution API: ${response.status}` }
    }

    const data = await response.json()
    if (data?.data?.Users && Array.isArray(data.data.Users) && data.data.Users.length > 0) {
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

    if (!evolutionApiUrl || !evolutionApiKey) {
      return { success: false, error: 'Configuração da Evolution API não encontrada' }
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const url = `${evolutionApiUrl}/send/text`
    const response = await fetch(url, {
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

    if (!evolutionApiUrl || !evolutionApiKey) {
      return { success: false, error: 'Configuração da Evolution API não encontrada' }
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const url = `${evolutionApiUrl}/send/media`
    const body: any = { number: cleanPhone, type: mediaType, url: mediaUrl }
    if (caption && (mediaType === 'image' || mediaType === 'video')) body.caption = caption
    if (mimeType) body.mimetype = mimeType
    if (fileName && mediaType === 'document') body.fileName = fileName

    const response = await fetch(url, {
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
