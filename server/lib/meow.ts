import { eq, and, inArray, sql as drizzleSql } from 'drizzle-orm'
import { db, schema } from '~/server/database'
import { getStorageClient, MINIO_BUCKET, getPublicUrl } from '~/server/lib/storage'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { webhookLogger, contatoLogger, atendimentoLogger, messageLogger } from './logger'

// ─────────────────────────────────────────────
// Interfaces do webhook da API-MEOW
// ─────────────────────────────────────────────

export interface MeowWebhookData {
  event: string       // "message.received", "connection.connected", "connection.disconnected", etc.
  instance: string    // nome da instância (= inbox.id)
  timestamp: string
  data: {
    from: string           // número limpo: "5511999999999"
    fromName?: string      // nome do contato (pushName)
    to?: string
    messageId: string
    messageType: string    // "text"|"image"|"video"|"audio"|"document"|"sticker"|"contact"|"location"|"unknown"
    text?: string
    caption?: string
    mediaBase64?: string   // base64 da mídia
    mimeType?: string
    fileName?: string
    isGroup: boolean
    isFromMe?: boolean
    groupId?: string
    groupName?: string
    timestamp: number
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
// Helper de autenticação
// ─────────────────────────────────────────────

function getMeowHeaders(config: any): Record<string, string> {
  return {
    'Authorization': `Bearer ${config.meowApiKey}`,
    'Content-Type': 'application/json'
  }
}

// ─────────────────────────────────────────────
// Funções de banco de dados (sem alterações)
// ─────────────────────────────────────────────

export async function findInboxByInstance(instanceId: string): Promise<{ id: string, empresa_id: string } | null> {
  try {
    webhookLogger.debug('inbox.searching', `Buscando inbox por instance: ${instanceId}`)

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

    const [contato] = await db.select({ id: schema.contatos.id, profile_picture_url: schema.contatos.avatar_url })
      .from(schema.contatos)
      .where(and(eq(schema.contatos.telefone, normalizedPhone), eq(schema.contatos.empresa_id, empresaId)))
      .limit(1)

    if (contato) {
      contatoLogger.debug('contact.found', `Contato existente encontrado: ${contato.id}`, { contatoId: contato.id })
      return { id: contato.id, isNew: false, profile_picture_url: contato.profile_picture_url }
    }

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

export async function findOrCreateAtendimento(
  contatoId: string,
  inboxId: string
): Promise<{ id: string, isNew: boolean } | null> {
  try {
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
    const msgData: any = {
      atendimento_id: atendimentoId,
      content: texto,
      direction: remetente === 'user' ? 'outbound' : 'inbound',
      status: remetente === 'user' ? 'sent' : 'delivered',
      type: messageType === 'conversation' ? 'text' : messageType,
      external_id: externalMessageId || null,
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

export async function updateContactData(
  contatoId: string,
  atendimentoId: string,
  messageTimestamp?: number
): Promise<boolean> {
  try {
    await db.update(schema.contatos).set({
      updated_at: new Date()
    }).where(eq(schema.contatos.id, contatoId))

    return true
  } catch (error) {
    console.error('❌ Erro em updateContactData:', error)
    return false
  }
}

// ─────────────────────────────────────────────
// Funções de mídia/storage
// ─────────────────────────────────────────────

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

export async function deleteOldProfilePicture(oldUrl: string): Promise<void> {
  try {
    if (!oldUrl) return

    const config = useRuntimeConfig()
    const minioEndpoint = config.minioEndpoint as string || ''
    if (!minioEndpoint || !oldUrl.includes(minioEndpoint)) {
      return
    }

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

// ─────────────────────────────────────────────
// Funções de API (API-MEOW)
// ─────────────────────────────────────────────

/**
 * Busca perfil do contato via API-MEOW
 */
export async function fetchContactProfile(
  instanceName: string,
  phoneNumber: string
): Promise<{ pushName: string; profilePictureUrl: string } | null> {
  try {
    const config = useRuntimeConfig()
    const { meowApiUrl, meowApiKey } = config

    if (!meowApiUrl || !meowApiKey) {
      console.warn('⚠️ MEOW_API_URL ou MEOW_API_KEY não configurados')
      return null
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '')

    // Buscar nome via lista de contatos
    const contactsRes = await fetch(`${meowApiUrl}/api/instances/${instanceName}/contacts`, {
      method: 'GET',
      headers: getMeowHeaders(config)
    })

    let pushName = ''
    if (contactsRes.ok) {
      const data = await contactsRes.json()
      const contact = (data?.contacts || []).find((c: any) =>
        c.phoneNumber?.replace(/\D/g, '') === cleanPhone
      )
      pushName = contact?.pushName || contact?.name || ''
    }

    // Buscar URL da foto de perfil via endpoint dedicado
    let profilePictureUrl = ''
    try {
      const picRes = await fetch(
        `${meowApiUrl}/api/instances/${instanceName}/contacts/${cleanPhone}/profile-picture`,
        { headers: getMeowHeaders(config) }
      )
      if (picRes.ok) {
        const picData = await picRes.json()
        profilePictureUrl = picData?.url || ''
      }
    } catch {
      // sem foto não é erro crítico
    }

    return { pushName, profilePictureUrl }
  } catch (error) {
    console.error('❌ Erro ao buscar perfil do contato:', error)
    return null
  }
}

/**
 * Verifica se número tem WhatsApp via API-MEOW
 * Nota: A API-MEOW não possui endpoint dedicado para verificação.
 * A validação real ocorre ao enviar mensagem (erro retornado se inválido).
 */
export async function checkWhatsAppNumber(
  instanceName: string,
  phoneNumber: string
): Promise<{ exists: boolean; error?: string }> {
  try {
    const config = useRuntimeConfig()
    const { meowApiUrl, meowApiKey } = config

    if (!meowApiUrl || !meowApiKey) {
      return { exists: false, error: 'Configuração da API-MEOW não encontrada' }
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '')

    // Verificar via cache de contatos
    const response = await fetch(`${meowApiUrl}/api/instances/${instanceName}/contacts`, {
      method: 'GET',
      headers: getMeowHeaders(config)
    })

    if (!response.ok) {
      // Se não conseguir verificar, assume que existe (validação real ocorre no envio)
      console.warn(`⚠️ Não foi possível verificar número ${cleanPhone}: ${response.status}`)
      return { exists: true }
    }

    const data = await response.json()
    const contacts = data?.contacts || []
    const found = contacts.some((c: any) =>
      c.phoneNumber?.replace(/\D/g, '') === cleanPhone
    )

    // Se não encontrado no cache, assume existência (não bloquear cadastro)
    return { exists: found || true }
  } catch (error) {
    return { exists: true } // Em caso de erro, não bloquear cadastro
  }
}

/**
 * Envia mensagem de texto via API-MEOW
 */
export async function sendTextMessageToWhatsApp(
  instanceName: string,
  phoneNumber: string,
  messageText: string
): Promise<{ success: boolean; messageId?: string; status?: string; error?: string }> {
  try {
    const config = useRuntimeConfig()
    const { meowApiUrl, meowApiKey } = config

    if (!meowApiUrl || !meowApiKey) {
      return { success: false, error: 'Configuração da API-MEOW não encontrada' }
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const response = await fetch(`${meowApiUrl}/api/instances/${instanceName}/send-message`, {
      method: 'POST',
      headers: getMeowHeaders(config),
      body: JSON.stringify({ to: cleanPhone, text: messageText })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `API-MEOW retornou status ${response.status}: ${errorText}` }
    }

    const data = await response.json()
    return { success: true, messageId: data.messageId, status: 'sent' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

/**
 * Envia mídia (imagem, vídeo, documento) via API-MEOW
 */
export async function sendMediaToWhatsApp(
  instanceName: string,
  phoneNumber: string,
  mediaUrl: string,
  mediaType: 'image' | 'video' | 'document' | 'audio',
  caption?: string,
  mimeType?: string,
  fileName?: string
): Promise<{ success: boolean; messageId?: string; status?: string; error?: string }> {
  try {
    const config = useRuntimeConfig()
    const { meowApiUrl, meowApiKey } = config

    if (!meowApiUrl || !meowApiKey) {
      return { success: false, error: 'Configuração da API-MEOW não encontrada' }
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const body: any = { to: cleanPhone, mediaType, url: mediaUrl }
    if (caption) body.caption = caption
    if (mimeType) body.mimeType = mimeType
    if (fileName) body.fileName = fileName

    const response = await fetch(`${meowApiUrl}/api/instances/${instanceName}/send-media`, {
      method: 'POST',
      headers: getMeowHeaders(config),
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `API-MEOW retornou status ${response.status}: ${errorText}` }
    }

    const data = await response.json()
    return { success: true, messageId: data.messageId, status: 'sent' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

/**
 * Envia áudio (mensagem de voz) via API-MEOW
 */
export async function sendAudioToWhatsApp(
  instanceName: string,
  phoneNumber: string,
  audioUrl: string,
  mimeType?: string
): Promise<{ success: boolean; messageId?: string; status?: string; error?: string }> {
  try {
    const config = useRuntimeConfig()
    const { meowApiUrl, meowApiKey } = config

    if (!meowApiUrl || !meowApiKey) {
      return { success: false, error: 'Configuração da API-MEOW não encontrada' }
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '')
    // PTT só funciona com audio/ogg;codecs=opus — para outros formatos desabilita ptt
    const isPtt = !mimeType || mimeType.includes('ogg')
    const body: any = { to: cleanPhone, mediaType: 'audio', url: audioUrl, ptt: isPtt }
    if (mimeType) body.mimeType = mimeType
    const response = await fetch(`${meowApiUrl}/api/instances/${instanceName}/send-media`, {
      method: 'POST',
      headers: getMeowHeaders(config),
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `API-MEOW retornou status ${response.status}: ${errorText}` }
    }

    const data = await response.json()
    return { success: true, messageId: data.messageId, status: 'sent' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

// ─────────────────────────────────────────────
// Processamento de webhook da API-MEOW
// ─────────────────────────────────────────────

/**
 * Processa mensagem recebida via webhook da API-MEOW
 */
export async function processMeowMessage(webhookData: MeowWebhookData): Promise<ProcessedMessage | null> {
  const { instance, data } = webhookData

  try {
    webhookLogger.logWebhookReceived(webhookData.event, instance, {
      from: data.from,
      fromName: data.fromName,
      messageType: data.messageType,
      isGroup: data.isGroup
    })

    // Ignorar mensagens de grupo (configurável no servidor da API-MEOW)
    if (data.isGroup) {
      webhookLogger.debug('message.ignored', 'Mensagem de grupo, ignorando...', { instance, from: data.from })
      return null
    }


    if (!data.from) {
      webhookLogger.warn('message.invalid_data', 'Mensagem sem remetente', { instance })
      return null
    }

    // Para mensagens fromMe, o contato é quem recebeu (data.to)
    // Se data.to estiver vazio ou for o próprio número da instância, ignorar
    if (data.isFromMe) {
      const toPhone = data.to?.replace(/\D/g, '')
      const fromPhone = data.from?.replace(/\D/g, '')
      if (!toPhone || toPhone === fromPhone) {
        webhookLogger.debug('message.ignored', 'Mensagem fromMe sem destinatário válido, ignorando...', { instance, from: data.from, to: data.to })
        return null
      }
    }

    const phone = (data.isFromMe ? data.to : data.from)!.replace(/\D/g, '')
    const pushName = data.isFromMe ? phone : (data.fromName || phone)

    // Validar comprimento do telefone — LIDs não resolvidos têm >15 dígitos
    if (phone.length > 15) {
      webhookLogger.warn('message.invalid_phone', `Telefone inválido (possível LID não resolvido): ${phone}`, { instance, from: data.from })
      return null
    }

    // Deduplicar mensagens fromMe já salvas via mensagens.post.ts
    if (data.isFromMe && data.messageId) {
      const [existing] = await db.select({ id: schema.mensagens.id })
        .from(schema.mensagens)
        .where(eq(schema.mensagens.external_id, data.messageId))
        .limit(1)
      if (existing) {
        webhookLogger.debug('message.ignored', 'Mensagem fromMe já registrada, ignorando...', { messageId: data.messageId })
        return null
      }
    }
    const messageType = data.messageType // "text"|"image"|"video"|"audio"|"document"|"sticker"
    const messageTimestamp = data.timestamp

    let messageText = data.text || data.caption || ''
    let previewText = messageText
    let mediaData: { url: string; type: string; name: string } | null = null
    let processedMessageType = 'text'

    // 1. Encontrar inbox
    const inbox = await findInboxByInstance(instance)
    if (!inbox) {
      webhookLogger.logInboxNotFound(instance)
      return null
    }

    // Processar mídia se houver
    if (messageType !== 'text' && messageType !== 'unknown' && data.mediaBase64) {
      console.log(`🎯 Detectado tipo de mídia: ${messageType}`)

      const mimeType = data.mimeType || getMimeTypeFromMessageType(messageType)
      const fileName = data.fileName || generateFileName(messageType, mimeType)

      const uploadResult = await uploadMediaToMinio(
        inbox.empresa_id,
        data.mediaBase64,
        mimeType,
        fileName
      )

      if (uploadResult) {
        mediaData = { url: uploadResult.url, type: mimeType, name: fileName }

        switch (messageType) {
          case 'image':
            messageText = data.caption || ''
            previewText = data.caption || '📷 Imagem'
            processedMessageType = 'image'
            break
          case 'sticker':
            messageText = ''
            previewText = '💟 Figurinha'
            processedMessageType = 'image'
            break
          case 'video':
            messageText = data.caption || ''
            previewText = data.caption || '🎥 Vídeo'
            processedMessageType = 'video'
            break
          case 'audio':
            messageText = ''
            previewText = '🎵 Áudio'
            processedMessageType = 'audio'
            break
          case 'document':
            messageText = data.caption || ''
            previewText = data.caption || `📄 ${data.fileName || 'Documento'}`
            processedMessageType = 'document'
            break
          default:
            messageText = data.text || ''
            previewText = messageText
        }
      } else {
        messageText = `[Mídia não processada: ${messageType}]`
        previewText = messageText
      }
    } else if (messageType === 'text' && !messageText?.trim()) {
      webhookLogger.warn('message.invalid_data', 'Mensagem de texto sem conteúdo', { from: data.from, instance })
      return null
    }

    webhookLogger.info('message.processing', `Processando mensagem de ${pushName}`, {
      from: phone,
      messageText: messageText.substring(0, 50),
      instance,
      messageType: processedMessageType,
      hasMedia: !!mediaData
    })

    // 2. Buscar ou criar contato
    const contato = await findOrCreateContact(phone, pushName, inbox.empresa_id)
    if (!contato) {
      webhookLogger.error('contact.not_found', `Não foi possível encontrar/criar contato`, null, { phone, instance })
      return null
    }

    // 3. Buscar ou criar atendimento
    const atendimento = await findOrCreateAtendimento(contato.id, inbox.id)
    if (!atendimento) {
      webhookLogger.error('atendimento.not_found', `Não foi possível encontrar/criar atendimento`, null, { contatoId: contato.id, instance })
      return null
    }

    // 4. Atualizar perfil do contato se é novo ou se ainda não tem foto
    if (contato.isNew || !contato.profile_picture_url) {
      try {
        const profile = await fetchContactProfile(instance, phone)
        const updates: Record<string, any> = { updated_at: new Date() }

        if (profile?.pushName) {
          updates.nome = profile.pushName
        }

        if (profile?.profilePictureUrl) {
          const avatarUrl = await downloadAndUploadProfilePicture(inbox.empresa_id, profile.profilePictureUrl)
          if (avatarUrl) {
            updates.avatar_url = avatarUrl
          }
        }

        if (Object.keys(updates).length > 1) {
          await db.update(schema.contatos)
            .set(updates)
            .where(eq(schema.contatos.id, contato.id))
          console.log(`👤 Perfil do contato atualizado: nome=${updates.nome || ''} foto=${updates.avatar_url ? 'sim' : 'não'}`)
        }
      } catch (err) {
        console.error('❌ Erro ao atualizar perfil do contato:', err)
      }
    }

    const remetente: 'contact' | 'user' = data.isFromMe ? 'user' : 'contact'

    // 5. Criar mensagem
    const mensagemId = await createMessage(
      atendimento.id,
      messageText,
      remetente,
      processedMessageType,
      data.messageId,
      messageTimestamp,
      mediaData || undefined
    )

    if (!mensagemId) {
      webhookLogger.error('message.create_failed', `Não foi possível criar mensagem`, null, { atendimentoId: atendimento.id })
      return null
    }

    // 6. Atualizar atendimento (fromMe não incrementa unread)
    await updateAtendimentoWithMessage(
      atendimento.id,
      previewText,
      messageTimestamp,
      !data.isFromMe
    )

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

function getMimeTypeFromMessageType(messageType: string): string {
  const typeToMime: { [key: string]: string } = {
    'image': 'image/jpeg',
    'sticker': 'image/webp',
    'video': 'video/mp4',
    'audio': 'audio/ogg',
    'document': 'application/pdf'
  }
  return typeToMime[messageType] || 'application/octet-stream'
}

function generateFileName(messageType: string, mimeType: string): string {
  const timestamp = Date.now()
  const ext = getFileExtensionFromMimeType(mimeType)
  const prefixes: { [key: string]: string } = {
    'image': 'image',
    'sticker': 'sticker',
    'video': 'video',
    'audio': 'audio',
    'document': 'document'
  }
  const prefix = prefixes[messageType] || 'file'
  return `${prefix}_${timestamp}.${ext}`
}
