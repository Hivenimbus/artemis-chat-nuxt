import { db } from '~/server/db'
import { users, atendimentos, inboxes, mensagens } from '~/server/db/schema'
import { eq, and, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/atendimentos/[id]/mensagens: Iniciando listagem de mensagens')

    // Obter usuário do contexto (injetado pelo middleware 01-auth-check)
    const user = event.context.user

    if (!user) {
      console.error('API /api/atendimentos/[id]/mensagens: Usuário não autenticado no contexto')
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
      console.error('API /api/atendimentos/[id]/mensagens: Usuário sem empresa')
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Verificar se atendimento existe e pertence à empresa (via inbox)
    const [atendimento] = await db
      .select({
        id: atendimentos.id,
        usuario_responsavel_id: atendimentos.usuario_responsavel_id,
        empresa_id: inboxes.empresa_id
      })
      .from(atendimentos)
      .innerJoin(inboxes, eq(atendimentos.inbox_id, inboxes.id))
      .where(eq(atendimentos.id, atendimentoId))
      .limit(1)

    if (!atendimento || atendimento.empresa_id !== userData.empresa_id) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Atendimento não encontrado ou não pertence à sua empresa'
      })
    }

    // Obter query parameters
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 100
    const offset = (page - 1) * limit

    // Buscar mensagens do atendimento com dados do usuário
    const mensagensData = await db
      .select({
        id: mensagens.id,
        atendimento_id: mensagens.atendimento_id,
        usuario_id: mensagens.usuario_id,
        texto: mensagens.texto,
        remetente: mensagens.remetente,
        lida: mensagens.lida,
        timestamp: mensagens.timestamp,
        created_at: mensagens.created_at,
        message_type: mensagens.message_type,
        media_url: mensagens.media_url,
        media_type: mensagens.media_type,
        media_name: mensagens.media_name,
        evolution_message_id: mensagens.evolution_message_id,
        evolution_status: mensagens.evolution_status,
        usuario_name: users.name,
        usuario_email: users.email
      })
      .from(mensagens)
      .leftJoin(users, eq(mensagens.usuario_id, users.id))
      .where(eq(mensagens.atendimento_id, atendimentoId))
      .orderBy(asc(mensagens.timestamp))
      .limit(limit)
      .offset(offset)

    // Contar total de mensagens
    const { sql } = await import('drizzle-orm')
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(mensagens)
      .where(eq(mensagens.atendimento_id, atendimentoId))

    const totalItems = Number(count) || 0

    console.log('API /api/atendimentos/[id]/mensagens: Mensagens encontradas:', mensagensData.length)

    // Formatar mensagens para o frontend
    const mensagensFormatadas = mensagensData.map(mensagem => ({
      id: mensagem.id,
      atendimento_id: mensagem.atendimento_id,
      text: mensagem.texto,
      texto: mensagem.texto, // Manter ambos para compatibilidade
      sender: mensagem.remetente,
      timestamp: mensagem.timestamp ? new Date(mensagem.timestamp) : new Date(mensagem.created_at!),
      lida: mensagem.lida,
      usuario_id: mensagem.usuario_id,
      usuario_name: mensagem.usuario_name || null,
      created_at: mensagem.created_at,
      // Campos de mídia
      message_type: mensagem.message_type,
      media_url: mensagem.media_url,
      media_type: mensagem.media_type,
      media_name: mensagem.media_name,
      evolution_message_id: mensagem.evolution_message_id,
      evolution_status: mensagem.evolution_status
    }))

    // Marcar mensagens não lidas como lidas (se o usuário for o responsável)
    if (mensagensFormatadas.length > 0 && atendimento.usuario_responsavel_id === user.id) {
      await Promise.all([
        db.update(mensagens)
          .set({ lida: true })
          .where(and(
            eq(mensagens.atendimento_id, atendimentoId),
            eq(mensagens.lida, false),
            eq(mensagens.remetente, 'contact')
          )),
        db.update(atendimentos)
          .set({ unread_count: 0 })
          .where(eq(atendimentos.id, atendimentoId))
      ])
    }

    // Calcular informações de paginação
    const totalPages = Math.ceil(totalItems / limit)

    console.log('API /api/atendimentos/[id]/mensagens: Retornando dados com sucesso')

    return {
      success: true,
      data: {
        mensagens: mensagensFormatadas,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    }

  } catch (error: any) {
    console.error('API /api/atendimentos/[id]/mensagens: Erro no handler:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
