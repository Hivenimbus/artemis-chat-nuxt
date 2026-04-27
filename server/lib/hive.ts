import { eq, and, inArray } from 'drizzle-orm'
import { db, schema } from '~/server/database'
import { getStorageClient, MINIO_BUCKET, getPublicUrl } from '~/server/lib/storage'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { webhookLogger, contatoLogger, messageLogger } from './logger'

// ─────────────────────────────────────────────
// Interfaces do webhook da Hive API
// ─────────────────────────────────────────────

export interface HiveWebhookData {
  event: string
  instance_id: string  // UUID da instância na Hive API
  timestamp?: string
  data: {
    id?: string          // ID da mensagem (deduplicação)
    from: string         // número: "5511999999999"
    from_me: boolean
    from_name?: string   // nome do contato (campo real da API)
    to?: string
    body?: string        // texto da mensagem (campo real da API)
    media_type?: string  // "image"|"audio"|"document"|"video"|""
    media_base64?: string
    is_group: boolean
    timestamp: number | string  // unix ou ISO string
  }
}

export interface ProcessedMessage {
  contatoId: string
  atendimentoId: string
  mensagemId: string
  inboxId: string
  empresaId: string
}

// ─────────────────────────────────────────────
// Autenticação Hive API
// ─────────────────────────────────────────────

// Cache JWT para evitar login repetido
let cachedJwt: string | null = null
let jwtExpiresAt: number = 0

export async function getHiveJWT(): Promise<string | null> {
  const config = useRuntimeConfig()
  const now = Date.now()

  if (cachedJwt && now < jwtExpiresAt - 60_000) {
    return cachedJwt
  }

  try {
    const res = await fetch(`${config.hiveApiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: config.hiveEmail, password: config.hivePassword })
    })
    if (!res.ok) {
      console.error('❌ Falha no login Hive API:', res.status)
      return null
    }
    const data = await res.json()
    cachedJwt = data.token ?? data.access_token ?? null
    // JWT tipicamente expira em 24h, armazena por 23h
    jwtExpiresAt = now + 23 * 60 * 60 * 1000
    return cachedJwt
  } catch (err) {
    console.error('❌ Erro ao fazer login na Hive API:', err)
    return null
  }
}

export async function getHivePanelHeaders(): Promise<Record<string, string>> {
  const config = useRuntimeConfig()
  // Tenta usar GLOBAL_API_KEY; se falhar, usa JWT via login
  const key = config.hiveApiKey
  return {
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  }
}

// v1 endpoints: X-API-Key = inbox.id (definido como api_key na criação da instância)
async function getHiveV1Headers(inboxId: string): Promise<Record<string, string>> {
  return {
    'X-API-Key': inboxId,
    'Content-Type': 'application/json'
  }
}

// ─────────────────────────────────────────────
// Funções de banco de dados
// ─────────────────────────────────────────────

export async function findInboxByHiveInstance(
  hiveInstanceId: string
): Promise<{ id: string; empresa_id: string } | null> {
  try {
    const [data] = await db
      .select({ 
        id: schema.inboxes.id, 
        empresa_id: schema.inboxes.empresa_id
      })
      .from(schema.inboxes)
      .where(eq(schema.inboxes.hive_instance_id, hiveInstanceId))
      .limit(1)

    if (!data) {
      webhookLogger.logInboxNotFound(hiveInstanceId)
      return null
    }

    return { id: data.id, empresa_id: data.empresa_id! }
  } catch (error) {
    webhookLogger.error('inbox.search_error', `Erro ao buscar inbox por hive_instance_id: ${hiveInstanceId}`, error)
    return null
  }
}

export async function findOrCreateContact(
  phone: string,
  name: string,
  empresaId: string
): Promise<{ id: string; isNew: boolean; profile_picture_url?: string | null } | null> {
  try {
    let normalizedPhone = phone.replace(/\D/g, '')
    if (!normalizedPhone.startsWith('55')) normalizedPhone = '55' + normalizedPhone

    const [contato] = await db
      .select({ id: schema.contatos.id, profile_picture_url: schema.contatos.avatar_url })
      .from(schema.contatos)
      .where(and(eq(schema.contatos.telefone, normalizedPhone), eq(schema.contatos.empresa_id, empresaId)))
      .limit(1)

    if (contato) return { id: contato.id, isNew: false, profile_picture_url: contato.profile_picture_url }

    try {
      const [newContato] = await db.insert(schema.contatos).values({
        nome: name,
        telefone: normalizedPhone,
        empresa_id: empresaId,
      }).returning({ id: schema.contatos.id })

      if (!newContato) return null
      return { id: newContato.id, isNew: true }
    } catch (insertErr: any) {
      if (insertErr?.code === '23505') {
        const [existing] = await db
          .select({ id: schema.contatos.id })
          .from(schema.contatos)
          .where(and(eq(schema.contatos.telefone, normalizedPhone), eq(schema.contatos.empresa_id, empresaId)))
          .limit(1)
        if (existing) return { id: existing.id, isNew: false }
      }
      return null
    }
  } catch (error) {
    console.error('❌ Erro em findOrCreateContact:', error)
    return null
  }
}

export async function findOrCreateAtendimento(
  contatoId: string,
  inboxId: string
): Promise<{ id: string; isNew: boolean } | null> {
  try {
    const [atendimento] = await db
      .select({ id: schema.atendimentos.id })
      .from(schema.atendimentos)
      .where(and(
        eq(schema.atendimentos.contato_id, contatoId),
        eq(schema.atendimentos.inbox_id, inboxId),
        inArray(schema.atendimentos.status, ['aguardando', 'ativo', 'open'])
      ))
      .limit(1)

    if (atendimento) return { id: atendimento.id, isNew: false }

    try {
      const [newAt] = await db.insert(schema.atendimentos).values({
        contato_id: contatoId,
        inbox_id: inboxId,
        status: 'open',
        unread_count: 0,
      }).returning({ id: schema.atendimentos.id })

      if (!newAt) return null
      return { id: newAt.id, isNew: true }
    } catch (insertErr: any) {
      if (insertErr?.code === '23505') {
        const [existing] = await db
          .select({ id: schema.atendimentos.id })
          .from(schema.atendimentos)
          .where(and(
            eq(schema.atendimentos.contato_id, contatoId),
            eq(schema.atendimentos.inbox_id, inboxId),
            inArray(schema.atendimentos.status, ['aguardando', 'ativo', 'open'])
          ))
          .limit(1)
        if (existing) return { id: existing.id, isNew: false }
      }
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
  externalMessageId?: string,
  messageTimestamp?: number,
  mediaData?: { url: string; type: string; name: string }
): Promise<string | null> {
  try {
    const [mensagem] = await db.insert(schema.mensagens).values({
      atendimento_id: atendimentoId,
      content: texto,
      direction: remetente === 'user' ? 'outbound' : 'inbound',
      status: remetente === 'user' ? 'sent' : 'delivered',
      type: messageType === 'conversation' ? 'text' : messageType,
      external_id: externalMessageId || null,
      created_at: messageTimestamp ? new Date(messageTimestamp * 1000) : new Date(),
      metadata: mediaData ? { media_url: mediaData.url, media_type: mediaData.type, media_name: mediaData.name } : {},
    }).returning({ id: schema.mensagens.id })

    return mensagem?.id ?? null
  } catch (error) {
    console.error('❌ Erro em createMessage:', error)
    return null
  }
}

export async function updateAtendimentoWithMessage(
  atendimentoId: string,
  _messageText: string,
  messageTimestamp?: number,
  incrementUnread: boolean = true
): Promise<void> {
  try {
    const updateData: any = {
      last_message_at: messageTimestamp ? new Date(messageTimestamp * 1000) : new Date(),
      updated_at: new Date()
    }

    if (incrementUnread) {
      const [current] = await db
        .select({ unread_count: schema.atendimentos.unread_count })
        .from(schema.atendimentos)
        .where(eq(schema.atendimentos.id, atendimentoId))
        .limit(1)
      updateData.unread_count = (current?.unread_count || 0) + 1
    }

    await db.update(schema.atendimentos).set(updateData).where(eq(schema.atendimentos.id, atendimentoId))
  } catch (error) {
    console.error('❌ Erro em updateAtendimentoWithMessage:', error)
  }
}

export async function updateContactData(contatoId: string): Promise<void> {
  try {
    await db.update(schema.contatos).set({ updated_at: new Date() }).where(eq(schema.contatos.id, contatoId))
  } catch (error) {
    console.error('❌ Erro em updateContactData:', error)
  }
}

// ─────────────────────────────────────────────
// Funções de mídia/storage (idênticas ao meow.ts)
// ─────────────────────────────────────────────

export async function uploadMediaToMinio(
  empresaId: string,
  base64Data: string,
  mimeType: string,
  fileName: string
): Promise<{ url: string; path: string } | null> {
  try {
    const extension = fileName.split('.').pop() || getFileExtensionFromMimeType(mimeType)
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const uniqueFileName = `msg_${timestamp}_${random}.${extension}`
    const objectKey = `${empresaId}/${uniqueFileName}`

    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(cleanBase64, 'base64')

    const s3 = getStorageClient()
    await s3.send(new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: objectKey,
      Body: buffer,
      ContentType: mimeType,
    }))

    return { url: getPublicUrl(objectKey), path: objectKey }
  } catch (error) {
    console.error('❌ Erro em uploadMediaToMinio:', error)
    return null
  }
}

function getFileExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
    'video/mp4': 'mp4', 'video/3gpp': '3gp', 'audio/mpeg': 'mp3', 'audio/ogg': 'ogg',
    'audio/wav': 'wav', 'audio/amr': 'amr', 'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
  }
  return map[mimeType.toLowerCase()] || 'bin'
}

function getMimeTypeFromHiveMediaType(mediaType: string): string {
  const map: Record<string, string> = {
    'image': 'image/jpeg',
    'video': 'video/mp4',
    'audio': 'audio/ogg',
    'document': 'application/pdf'
  }
  return map[mediaType] || 'application/octet-stream'
}

function generateFileName(mediaType: string, mimeType: string): string {
  const ext = getFileExtensionFromMimeType(mimeType)
  const prefixes: Record<string, string> = {
    'image': 'image', 'video': 'video', 'audio': 'audio', 'document': 'document'
  }
  return `${prefixes[mediaType] || 'file'}_${Date.now()}.${ext}`
}

// A Hive API não tem endpoint de verificação de número.
// Retorna sempre exists: true (validação real ocorre no envio).
export async function checkWhatsAppNumber(
  _instanceName: string,
  _phoneNumber: string
): Promise<{ exists: boolean; error?: string }> {
  return { exists: true }
}

export async function fetchContactProfile(
  apiKey: string,
  phoneNumber: string
): Promise<{ profilePictureUrl?: string | null } | null> {
  try {
    const config = useRuntimeConfig()
    const cleanPhone = phoneNumber.replace(/\D/g, '')

    const url = `${config.hiveApiUrl}/api/v1/contacts/${cleanPhone}/profile-picture`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) return null

    const data = await response.json()
    if (data.pictureUrl) {
      return { profilePictureUrl: data.pictureUrl }
    }
    return null
  } catch (error) {
    console.error('❌ Erro ao buscar perfil na Hive API:', error)
    return null
  }
}

export async function downloadAndUploadProfilePicture(
  empresaId: string,
  pictureUrl: string
): Promise<string | null> {
  try {
    const response = await fetch(pictureUrl)
    if (!response.ok) {
      console.error(`Falha ao baixar imagem: ${response.status} ${response.statusText}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mimeType = response.headers.get('content-type') || 'image/jpeg'
    
    // Convert to base64
    const base64Data = buffer.toString('base64')
    
    // Usar a função existente
    const uploadResult = await uploadMediaToMinio(
      empresaId, 
      base64Data, 
      mimeType, 
      `avatar_${Date.now()}.jpg`
    )

    if (uploadResult) {
      return uploadResult.url
    }
    
    // Fallback de emergência (caso o usuário não tenha configurado as keys do Minio)
    console.warn('⚠️ Bucket AWS/Minio não configurado. Fallback para URL crua do WhatsApp.')
    return pictureUrl
  } catch (error) {
    console.error('❌ Erro em downloadAndUploadProfilePicture:', error)
    return pictureUrl // Retorna a originária se falhar a conversão também
  }
}


// ─────────────────────────────────────────────
// Funções de envio (Hive API v1)
// ─────────────────────────────────────────────

export async function sendTextMessageToWhatsApp(
  inboxId: string,
  phoneNumber: string,
  messageText: string
): Promise<{ success: boolean; messageId?: string; status?: string; error?: string }> {
  try {
    const config = useRuntimeConfig()
    const cleanPhone = phoneNumber.replace(/\D/g, '')

    const headers = await getHiveV1Headers(inboxId)
    console.log(`[Hive Send] Enviando texto para ${cleanPhone}. URL: ${config.hiveApiUrl}/api/v1/messages/send`)
    
    const response = await fetch(`${config.hiveApiUrl}/api/v1/messages/send`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ to: cleanPhone, message: messageText })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error(`❌ Erro Hive API (${response.status}):`, err)
      return { success: false, error: `Hive API ${response.status}: ${err}` }
    }

    const result = await response.json()
    console.log(`✅ Sucesso Hive API:`, result)
    return { success: true, status: 'sent', messageId: result.messageId }
  } catch (error) {
    console.error('❌ Erro fatal ao chamar Hive API:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

export async function sendMediaToWhatsApp(
  inboxId: string,
  phoneNumber: string,
  mediaUrl: string,
  mediaType: 'image' | 'video' | 'document' | 'audio',
  caption?: string,
  _mimeType?: string,
  fileName?: string
): Promise<{ success: boolean; messageId?: string; status?: string; error?: string }> {
  try {
    const config = useRuntimeConfig()
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const body: any = { to: cleanPhone, type: mediaType, url: mediaUrl }
    if (caption) body.caption = caption
    if (fileName) body.file_name = fileName

    const headers = await getHiveV1Headers(inboxId)
    console.log(`[Hive Media] Enviando ${mediaType} para ${cleanPhone}. URL: ${mediaUrl}`)

    const response = await fetch(`${config.hiveApiUrl}/api/v1/messages/send-media`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const err = await response.text()
      console.error(`❌ Erro Media Hive API (${response.status}):`, err)
      return { success: false, error: `Hive API ${response.status}: ${err}` }
    }

    const result = await response.json()
    console.log(`✅ Sucesso Media Hive API:`, result)
    return { success: true, status: 'sent', messageId: result.messageId }
  } catch (error) {
    console.error('❌ Erro fatal ao chamar Media Hive API:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

export async function sendAudioToWhatsApp(
  inboxId: string,
  phoneNumber: string,
  audioUrl: string,
  _mimeType?: string
): Promise<{ success: boolean; messageId?: string; status?: string; error?: string }> {
  return sendMediaToWhatsApp(inboxId, phoneNumber, audioUrl, 'audio')
}

// ─────────────────────────────────────────────
// Processamento de webhook da Hive API
// ─────────────────────────────────────────────

export async function processHiveMessage(webhookData: HiveWebhookData): Promise<ProcessedMessage | null> {
  const { instance_id, data } = webhookData

  try {
    // Ignorar grupos
    if (data.is_group) return null

    const rawTargetPhone = data.from_me ? data.to : data.from
    if (!rawTargetPhone) return null

    // Se a mensagem foi enviada por nós mesmos (from_me), previnir duplicidade (eco do envio via API)
    if (data.from_me && data.id) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const [existingMessage] = await db.select({ id: schema.mensagens.id })
        .from(schema.mensagens)
        .where(eq(schema.mensagens.external_id, data.id))
        .limit(1)

      if (existingMessage) {
        return null
      }
    }

    const phone = rawTargetPhone.replace(/\D/g, '')
    // Se for from_me, o from_name pode ser inútil (nosso nome), logo fallback para telefone
    const pushName = data.from_me ? phone : (data.from_name || phone)
    // media_type pode vir como string vazia — tratar como ausente
    const mediaType = data.media_type || null

    let messageText = data.body || ''
    let previewText = messageText
    // Converte timestamp ISO ou unix para número de segundos
    const rawTs = data.timestamp
    const messageTimestamp = rawTs
      ? typeof rawTs === 'number' ? rawTs : Math.floor(new Date(rawTs).getTime() / 1000)
      : Math.floor(Date.now() / 1000)
    let mediaData: { url: string; type: string; name: string } | null = null
    let processedMessageType = 'text'

    // 1. Encontrar inbox
    const inbox = await findInboxByHiveInstance(instance_id)
    if (!inbox) {
      console.warn(`[hive] inbox não encontrada para hive_instance_id=${instance_id}`)
      return null
    }

    // 2. Processar mídia
    if (mediaType && data.media_base64) {
      const mimeType = getMimeTypeFromHiveMediaType(mediaType)
      const fileName = generateFileName(mediaType, mimeType)

      const uploadResult = await uploadMediaToMinio(inbox.empresa_id, data.media_base64, mimeType, fileName)

      if (uploadResult) {
        mediaData = { url: uploadResult.url, type: mimeType, name: fileName }

        switch (mediaType) {
          case 'image':
            previewText = data.body || '📷 Imagem'
            processedMessageType = 'image'
            break
          case 'video':
            previewText = data.body || '🎥 Vídeo'
            processedMessageType = 'video'
            break
          case 'audio':
            messageText = ''
            previewText = '🎵 Áudio'
            processedMessageType = 'audio'
            break
          case 'document':
            previewText = data.body || '📄 Documento'
            processedMessageType = 'document'
            break
        }
      }
    } else if (!messageText.trim()) {
      return null
    }

    // 3. Buscar ou criar contato
    const contato = await findOrCreateContact(phone, pushName, inbox.empresa_id)
    if (!contato) return null

    // 4. Buscar ou criar atendimento
    const atendimento = await findOrCreateAtendimento(contato.id, inbox.id)
    if (!atendimento) return null

    // 4.5 Buscar foto de perfil se o contato for novo ou ainda não tiver imagem
    if (contato.isNew || !contato.profile_picture_url) {
      try {
        const profile = await fetchContactProfile(inbox.id, phone)
          if (profile && profile.profilePictureUrl) {
             const newInternalUrl = await downloadAndUploadProfilePicture(inbox.empresa_id, profile.profilePictureUrl)
             if (newInternalUrl) {
               await db.update(schema.contatos)
                 .set({ avatar_url: newInternalUrl, updated_at: new Date() })
                 .where(eq(schema.contatos.id, contato.id))
               contato.profile_picture_url = newInternalUrl
             }
          }
        } catch (e) {
          console.error('Erro ao processar foto de perfil:', e)
        }
      }


    // 5. Criar mensagem
    const mensagemId = await createMessage(
      atendimento.id,
      messageText,
      data.from_me ? 'user' : 'contact',
      processedMessageType,
      data.id,
      messageTimestamp,
      mediaData || undefined
    )

    if (!mensagemId) return null

    // 6. Atualizar atendimento e contato
    await updateAtendimentoWithMessage(atendimento.id, previewText, messageTimestamp, !data.from_me)
    await updateContactData(contato.id)

    messageLogger.logMessageReceived(mensagemId, atendimento.id, phone)

    return {
      contatoId: contato.id,
      atendimentoId: atendimento.id,
      mensagemId,
      inboxId: inbox.id,
      empresaId: inbox.empresa_id
    }
  } catch (error) {
    console.error('❌ Erro ao processar webhook Hive:', error)
    return null
  }
}
