import { db } from '~/server/db'
import { users, atendimentos, inboxes, contatos, mensagens } from '~/server/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { uploadFile, getPublicUrl } from '~/server/lib/storage'
import { sendTextMessageToWhatsApp, sendMediaToWhatsApp, sendAudioToWhatsApp } from '~/server/lib/evolution'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/atendimentos/[id]/mensagens POST: Iniciando envio de mensagem')

    // Obter usuário do contexto (injetado pelo middleware 01-auth-check)
    const user = event.context.user

    if (!user) {
      console.error('API /api/atendimentos/[id]/mensagens POST: Usuário não autenticado no contexto')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    // Obter ID do atendimento
    const atendimentoId = getRouterParam(event, 'id')
    if (!atendimentoId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do atendimento é obrigatório'
      })
    }

    // Obter dados do usuário
    const [userData] = await db.select({ empresa_id: users.empresa_id, role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!userData?.empresa_id) {
      console.error('API /api/atendimentos/[id]/mensagens POST: Usuário sem empresa')
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Obter corpo da requisição (suporta JSON e multipart/form-data)
    const contentType = getHeader(event, 'content-type') || ''
    let texto = ''
    let arquivo: any = null

    if (contentType.includes('multipart/form-data')) {
      // Processar form-data (com arquivo)
      const formData = await readMultipartFormData(event)

      if (!formData) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Dados do formulário não foram enviados'
        })
      }

      // Extrair campos
      for (const field of formData) {
        if (field.name === 'texto') {
          texto = field.data.toString('utf-8')
        } else if (field.name === 'file') {
          arquivo = field
        }
      }
    } else {
      // Processar JSON
      const body = await readBody(event)
      texto = body.texto || ''
    }

    // Validar: precisa ter texto OU arquivo (texto pode ser vazio se houver arquivo)
    if (!arquivo && (!texto || !texto.trim())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Texto ou arquivo é obrigatório'
      })
    }

    // Verificar se atendimento existe e pertence à empresa (via inbox)
    const [atendimento] = await db
      .select({
        id: atendimentos.id,
        status: atendimentos.status,
        usuario_responsavel_id: atendimentos.usuario_responsavel_id,
        contato_id: atendimentos.contato_id,
        inbox_id: atendimentos.inbox_id,
        inbox_empresa_id: inboxes.empresa_id,
        contato_telefone: contatos.telefone
      })
      .from(atendimentos)
      .innerJoin(inboxes, eq(atendimentos.inbox_id, inboxes.id))
      .innerJoin(contatos, eq(atendimentos.contato_id, contatos.id))
      .where(eq(atendimentos.id, atendimentoId))
      .limit(1)

    // Validação 1: Verificar se atendimento existe
    if (!atendimento) {
      console.error('API /api/atendimentos/[id]/mensagens POST: Atendimento não encontrado')
      throw createError({
        statusCode: 404,
        statusMessage: 'Atendimento não encontrado'
      })
    }

    // Validação 2: Verificar se pertence à empresa do usuário
    if (atendimento.inbox_empresa_id !== userData.empresa_id) {
      console.error('API /api/atendimentos/[id]/mensagens POST: Empresa diferente')
      throw createError({
        statusCode: 403,
        statusMessage: 'Atendimento não pertence à sua empresa'
      })
    }

    // Verificar se usuário pode enviar mensagem
    if (atendimento.usuario_responsavel_id && atendimento.usuario_responsavel_id !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Apenas o responsável pelo atendimento pode enviar mensagens'
      })
    }

    // Se não tiver responsável, atribuir ao usuário atual
    if (!atendimento.usuario_responsavel_id) {
      await db.update(atendimentos)
        .set({
          usuario_responsavel_id: user.id,
          status: 'ativo',
          data_atribuicao: new Date()
        })
        .where(eq(atendimentos.id, atendimentoId))
    }

    // Variáveis para armazenar dados de mídia
    let mediaUrl: string | null = null
    let mediaType: string | null = null
    let mediaName: string | null = null
    let messageType: 'text' | 'image' | 'video' | 'audio' | 'document' = 'text'
    let evolutionMediaType: 'image' | 'video' | 'audio' | 'document' | null = null

    // Processar upload de arquivo se existir
    if (arquivo) {
      console.log('API /api/atendimentos/[id]/mensagens POST: Processando upload de arquivo:', arquivo.filename)

      // Validar tamanho (16MB máximo)
      const maxSize = 16 * 1024 * 1024 // 16MB
      if (arquivo.data.length > maxSize) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Arquivo muito grande. Máximo: 16MB'
        })
      }

      // Detectar tipo de mídia pelo MIME type
      const mimeType = arquivo.type || 'application/octet-stream'
      mediaType = mimeType

      // Determinar tipo de mensagem e tipo para Evolution API
      if (mimeType.startsWith('image/')) {
        messageType = 'image'
        evolutionMediaType = 'image'
      } else if (mimeType.startsWith('video/')) {
        messageType = 'video'
        evolutionMediaType = 'video'
      } else if (mimeType.startsWith('audio/')) {
        messageType = 'audio'
        evolutionMediaType = 'audio'
      } else {
        messageType = 'document'
        evolutionMediaType = 'document'
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const ext = arquivo.filename?.split('.').pop() || 'bin'
      const uniqueFileName = `${messageType}_${timestamp}_${random}.${ext}`
      mediaName = arquivo.filename || uniqueFileName

      // Caminho no storage: empresa_id/uniqueFileName
      const storagePath = `${userData.empresa_id}/${uniqueFileName}`

      console.log('API /api/atendimentos/[id]/mensagens POST: Fazendo upload para MinIO Storage:', storagePath)

      // Upload para MinIO Storage
      mediaUrl = await uploadFile(storagePath, arquivo.data, mimeType)

      console.log('API /api/atendimentos/[id]/mensagens POST: Arquivo enviado:', mediaUrl)
    }

    // Criar mensagem no banco
    const mensagemData: any = {
      atendimento_id: atendimentoId,
      usuario_id: user.id,
      texto: texto?.trim() || '',
      remetente: 'user',
      lida: true,
      timestamp: new Date(),
      message_type: messageType
    }

    // Adicionar campos de mídia se houver arquivo
    if (arquivo && mediaUrl) {
      mensagemData.media_url = mediaUrl
      mensagemData.media_type = mediaType
      mensagemData.media_name = mediaName
    }

    const [novaMensagem] = await db.insert(mensagens)
      .values(mensagemData)
      .returning()

    if (!novaMensagem) {
      console.error('API /api/atendimentos/[id]/mensagens POST: Erro ao criar mensagem')
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao enviar mensagem'
      })
    }

    // Buscar dados do usuário para formatar resposta
    const [usuarioData] = await db.select({ name: users.name })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    // Enviar via Evolution API para WhatsApp
    console.log('API /api/atendimentos/[id]/mensagens POST: Enviando para WhatsApp via Evolution API')

    const inboxId = atendimento.inbox_id!
    const phoneNumber = atendimento.contato_telefone!
    let evolutionResult: any

    if (arquivo && mediaUrl && evolutionMediaType) {
      // Enviar mídia (usar endpoint específico para áudio)
      if (evolutionMediaType === 'audio') {
        evolutionResult = await sendAudioToWhatsApp(
          inboxId,
          phoneNumber,
          mediaUrl
        )
      } else {
        evolutionResult = await sendMediaToWhatsApp(
          inboxId,
          phoneNumber,
          mediaUrl,
          evolutionMediaType,
          texto?.trim(), // caption
          mediaType || undefined,
          mediaName || undefined
        )
      }
    } else {
      // Enviar texto
      evolutionResult = await sendTextMessageToWhatsApp(
        inboxId,
        phoneNumber,
        texto.trim()
      )
    }

    // Atualizar mensagem com dados da Evolution API
    if (evolutionResult.success && evolutionResult.messageId) {
      await db.update(mensagens)
        .set({
          evolution_message_id: evolutionResult.messageId,
          evolution_status: evolutionResult.status || 'sent'
        })
        .where(eq(mensagens.id, novaMensagem.id))

      console.log('API /api/atendimentos/[id]/mensagens POST: Mensagem enviada para WhatsApp com sucesso:', evolutionResult.messageId)
    } else {
      console.error('API /api/atendimentos/[id]/mensagens POST: Falha ao enviar para WhatsApp:', evolutionResult.error)
      // Não falhar a requisição se o envio para WhatsApp falhar, pois a mensagem já foi salva
    }

    // Atualizar informações do atendimento
    const ultimaMensagem = arquivo ? `📎 ${mediaName}` : texto.trim()
    await db.update(atendimentos)
      .set({
        ultimo_mensagem: ultimaMensagem,
        ultimo_mensagem_time: new Date(),
        updated_at: new Date()
      })
      .where(eq(atendimentos.id, atendimentoId))

    // Atualizar informações do contato
    await db.update(contatos)
      .set({
        data_ultimo_contato: new Date(),
        total_mensagens: sql`${contatos.total_mensagens} + 1`
      })
      .where(eq(contatos.id, atendimento.contato_id!))

    console.log('API /api/atendimentos/[id]/mensagens POST: Mensagem enviada com sucesso:', novaMensagem.id)

    // Formatar resposta
    const mensagemFormatada = {
      id: novaMensagem.id,
      atendimento_id: novaMensagem.atendimento_id,
      text: novaMensagem.texto,
      sender: novaMensagem.remetente,
      timestamp: novaMensagem.timestamp ? new Date(novaMensagem.timestamp) : new Date(novaMensagem.created_at!),
      lida: novaMensagem.lida,
      usuario_id: novaMensagem.usuario_id,
      usuario_name: usuarioData?.name || null,
      created_at: novaMensagem.created_at,
      message_type: novaMensagem.message_type,
      media_url: novaMensagem.media_url || null,
      media_type: novaMensagem.media_type || null,
      media_name: novaMensagem.media_name || null
    }

    return {
      success: true,
      data: mensagemFormatada,
      message: arquivo ? 'Arquivo enviado com sucesso' : 'Mensagem enviada com sucesso'
    }

  } catch (error: any) {
    console.error('API /api/atendimentos/[id]/mensagens POST: Erro no handler:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
