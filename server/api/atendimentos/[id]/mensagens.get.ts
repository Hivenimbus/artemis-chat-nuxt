import { eq, and, asc } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const atendimentoId = getRouterParam(event, 'id')
    if (!atendimentoId) throw createError({ statusCode: 400, statusMessage: 'ID do atendimento é obrigatório' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id, role: schema.users.role })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Usuário não está associado a nenhuma empresa' })

    // Verificar se atendimento existe e pertence à empresa
    const atendimento = await db.query.atendimentos.findFirst({
      where: eq(schema.atendimentos.id, atendimentoId),
      with: { inbox: true }
    })

    if (!atendimento || atendimento.inbox?.empresa_id !== userData.empresa_id) {
      throw createError({ statusCode: 404, statusMessage: 'Atendimento não encontrado ou não pertence à sua empresa' })
    }

    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 100
    const offset = (page - 1) * limit

    // Buscar mensagens
    const mensagens = await db.query.mensagens.findMany({
      where: eq(schema.mensagens.atendimento_id, atendimentoId),
      orderBy: [asc(schema.mensagens.timestamp)],
      limit,
      offset,
      with: { sender: { columns: { id: true, name: true, email: true } } }
    })

    const totalCount = await db.select({ id: schema.mensagens.id })
      .from(schema.mensagens).where(eq(schema.mensagens.atendimento_id, atendimentoId))
    const totalItems = totalCount.length
    const totalPages = Math.ceil(totalItems / limit)

    const mensagensFormatadas = mensagens.map(m => ({
      id: m.id,
      atendimento_id: m.atendimento_id,
      text: m.texto,
      texto: m.texto,
      sender: m.remetente,
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date(m.created_at!),
      lida: m.lida,
      usuario_id: m.sender_id,
      usuario_name: m.sender?.name || null,
      created_at: m.created_at,
      message_type: m.message_type,
      media_url: m.media_url,
      media_type: m.media_type,
      media_name: m.media_name,
      evolution_message_id: m.evolution_message_id,
      evolution_status: m.evolution_status
    }))

    // Se usuário é responsável, marcar mensagens como lidas
    if (atendimento.usuario_responsavel_id === user.id && mensagens.length > 0) {
      await db.update(schema.mensagens)
        .set({ lida: true })
        .where(and(
          eq(schema.mensagens.atendimento_id, atendimentoId),
          eq(schema.mensagens.lida, false),
          eq(schema.mensagens.remetente, 'contact')
        ))
      await db.update(schema.atendimentos)
        .set({ unread_count: 0 })
        .where(eq(schema.atendimentos.id, atendimentoId))
    }

    return {
      success: true,
      data: {
        mensagens: mensagensFormatadas,
        pagination: { page, limit, totalItems, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 }
      }
    }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
