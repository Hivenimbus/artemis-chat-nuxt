import { eq } from 'drizzle-orm'
import { execSync } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { db, schema } from '~/server/database'
import { sendTextMessageToWhatsApp, sendMediaToWhatsApp, sendAudioToWhatsApp } from '~/server/lib/meow'
import { getStorageClient, getPublicUrl, MINIO_BUCKET } from '~/server/lib/storage'
import { PutObjectCommand } from '@aws-sdk/client-s3'

/**
 * Converte áudio para ogg/opus usando ffmpeg (exigido pelo WhatsApp).
 * Retorna { data, mimeType, ext } do áudio convertido, ou os dados originais se falhar.
 */
function convertToOggOpus(inputData: Buffer, inputMime: string): { data: Buffer, mimeType: string, ext: string } {
  // Se já é ogg, não precisa converter
  if (inputMime.includes('ogg')) {
    return { data: inputData, mimeType: 'audio/ogg; codecs=opus', ext: 'ogg' }
  }

  try {
    const tmpIn = join(tmpdir(), `audio_in_${Date.now()}.webm`)
    const tmpOut = join(tmpdir(), `audio_out_${Date.now()}.ogg`)

    writeFileSync(tmpIn, inputData)
    execSync(`ffmpeg -y -i "${tmpIn}" -c:a libopus -b:a 32k "${tmpOut}"`, {
      timeout: 15000,
      stdio: 'pipe'
    })

    const converted = readFileSync(tmpOut)

    // Limpeza
    try { unlinkSync(tmpIn) } catch {}
    try { unlinkSync(tmpOut) } catch {}

    return { data: converted, mimeType: 'audio/ogg; codecs=opus', ext: 'ogg' }
  } catch (err) {
    console.warn('⚠️ ffmpeg não disponível ou falhou, usando áudio original:', err)
    return { data: inputData, mimeType: inputMime, ext: 'webm' }
  }
}

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const atendimentoId = getRouterParam(event, 'id')
    if (!atendimentoId) throw createError({ statusCode: 400, statusMessage: 'ID do atendimento é obrigatório' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id, role: schema.users.role })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Usuário não está associado a nenhuma empresa' })

    // Parse body
    const contentType = getHeader(event, 'content-type') || ''
    let texto = ''
    let arquivo: any = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await readMultipartFormData(event)
      if (!formData) throw createError({ statusCode: 400, statusMessage: 'Dados do formulário não foram enviados' })
      for (const field of formData) {
        if (field.name === 'texto') texto = field.data.toString('utf-8')
        else if (field.name === 'file') arquivo = field
      }
    } else {
      const body = await readBody(event)
      texto = body.texto || ''
    }

    if (!arquivo && (!texto || !texto.trim())) {
      throw createError({ statusCode: 400, statusMessage: 'Texto ou arquivo é obrigatório' })
    }

    // Buscar atendimento com relações
    const atendimento = await db.query.atendimentos.findFirst({
      where: eq(schema.atendimentos.id, atendimentoId),
      with: { inbox: true, contato: true }
    })

    if (!atendimento || !atendimento.inbox) throw createError({ statusCode: 404, statusMessage: 'Atendimento não encontrado' })
    if (atendimento.inbox.empresa_id !== userData.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Atendimento não pertence à sua empresa' })
    if (atendimento.usuario_responsavel_id && atendimento.usuario_responsavel_id !== user.id) {
      throw createError({ statusCode: 403, statusMessage: 'Apenas o responsável pelo atendimento pode enviar mensagens' })
    }

    // Atribuir automaticamente se não tiver responsável
    const now = new Date()
    if (!atendimento.usuario_responsavel_id) {
      await db.update(schema.atendimentos)
        .set({ usuario_responsavel_id: user.id, status: 'ativo', data_atribuicao: now })
        .where(eq(schema.atendimentos.id, atendimentoId))
    }

    // Upload de arquivo se houver
    let mediaUrl: string | null = null
    let mediaType: string | null = null
    let mediaName: string | null = null
    let messageType: 'text' | 'image' | 'video' | 'audio' | 'document' = 'text'
    let evolutionMediaType: 'image' | 'video' | 'audio' | 'document' | null = null

    if (arquivo) {
      const maxSize = 16 * 1024 * 1024
      if (arquivo.data.length > maxSize) throw createError({ statusCode: 400, statusMessage: 'Arquivo muito grande. Máximo: 16MB' })

      const mimeType = arquivo.type || 'application/octet-stream'

      if (mimeType.startsWith('image/')) { messageType = 'image'; evolutionMediaType = 'image' }
      else if (mimeType.startsWith('video/')) { messageType = 'video'; evolutionMediaType = 'video' }
      else if (mimeType.startsWith('audio/')) { messageType = 'audio'; evolutionMediaType = 'audio' }
      else { messageType = 'document'; evolutionMediaType = 'document' }

      // Para áudio, converter para ogg/opus (formato exigido pelo WhatsApp)
      let uploadData: Buffer = arquivo.data
      let uploadMime: string = mimeType
      let uploadExt: string = arquivo.filename?.split('.').pop() || 'bin'

      if (evolutionMediaType === 'audio') {
        const converted = convertToOggOpus(Buffer.from(arquivo.data), mimeType)
        uploadData = converted.data
        uploadMime = converted.mimeType
        uploadExt = converted.ext
      }

      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const uniqueFileName = `${messageType}_${timestamp}_${random}.${uploadExt}`
      mediaName = arquivo.filename || uniqueFileName
      mediaType = uploadMime
      const objectKey = `${userData.empresa_id}/${uniqueFileName}`

      const s3 = getStorageClient()
      await s3.send(new PutObjectCommand({
        Bucket: MINIO_BUCKET,
        Key: objectKey,
        Body: uploadData,
        ContentType: uploadMime,
      }))
      mediaUrl = getPublicUrl(objectKey)
    }

    // Criar mensagem no banco
    const [novaMensagem] = await db.insert(schema.mensagens).values({
      atendimento_id: atendimentoId,
      sender_id: user.id,
      content: texto?.trim() || '',
      direction: 'outbound',
      status: 'sent',
      type: messageType,
      created_at: now,
      metadata: mediaUrl ? { media_url: mediaUrl, media_type: mediaType, media_name: mediaName } : {},
    }).returning()

    // Enviar via Evolution API
    const inboxId = atendimento.inbox.id
    const phoneNumber = atendimento.contato?.telefone || ''
    let evolutionResult: any

    if (arquivo && mediaUrl && evolutionMediaType) {
      if (evolutionMediaType === 'audio') {
        evolutionResult = await sendAudioToWhatsApp(inboxId, phoneNumber, mediaUrl, mediaType || undefined)
      } else {
        evolutionResult = await sendMediaToWhatsApp(inboxId, phoneNumber, mediaUrl, evolutionMediaType, texto?.trim(), mediaType || undefined, mediaName || undefined)
      }
    } else {
      evolutionResult = await sendTextMessageToWhatsApp(inboxId, phoneNumber, texto.trim())
    }

    // Atualizar mensagem com dados da Evolution se sucesso
    if (evolutionResult.success && evolutionResult.messageId) {
      await db.update(schema.mensagens)
        .set({ external_id: evolutionResult.messageId, status: evolutionResult.status || 'sent' })
        .where(eq(schema.mensagens.id, novaMensagem.id))
    }

    // Atualizar atendimento com última mensagem
    const ultimaMensagem = arquivo ? `📎 ${mediaName}` : texto.trim()
    await db.update(schema.atendimentos)
      .set({ ultimo_mensagem: ultimaMensagem, ultimo_mensagem_time: now, updated_at: now })
      .where(eq(schema.atendimentos.id, atendimentoId))

    return {
      success: true,
      data: {
        id: novaMensagem.id,
        atendimento_id: novaMensagem.atendimento_id,
        text: novaMensagem.content,
        texto: novaMensagem.content,
        sender: 'user',
        timestamp: novaMensagem.created_at,
        created_at: novaMensagem.created_at,
        message_type: novaMensagem.type,
        media_url: (novaMensagem.metadata as any)?.media_url || null,
        media_type: (novaMensagem.metadata as any)?.media_type || null,
        media_name: (novaMensagem.metadata as any)?.media_name || null,
      },
      message: arquivo ? 'Arquivo enviado com sucesso' : 'Mensagem enviada com sucesso'
    }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
