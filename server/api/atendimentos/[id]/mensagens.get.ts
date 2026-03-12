import { eq, asc } from 'drizzle-orm'
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
      orderBy: [asc(schema.mensagens.created_at)],
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
      text: m.content,
      texto: m.content,
      sender: m.direction === 'inbound' ? 'contact' : 'user',
      timestamp: m.created_at,
      lida: false,
      usuario_id: m.sender_id,
      usuario_name: m.sender?.name || null,
      created_at: m.created_at,
      message_type: m.type,
      media_url: (m.metadata as any)?.media_url || null,
      media_type: (m.metadata as any)?.media_type || null,
      media_name: (m.metadata as any)?.media_name || null,
      evolution_message_id: m.external_id,
      evolution_status: m.status
    }))

    // Zerar unread_count ao carregar mensagens
    if (mensagens.length > 0) {
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
