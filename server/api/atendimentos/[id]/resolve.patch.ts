import { eq, and } from 'drizzle-orm'
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

    // Verificar se atendimento existe e pertence à empresa (via inbox)
    const atendimento = await db.query.atendimentos.findFirst({
      where: eq(schema.atendimentos.id, atendimentoId),
      with: { inbox: true, contato: true, assignee: { columns: { id: true, name: true, email: true } } }
    })

    if (!atendimento || atendimento.inbox?.empresa_id !== userData.empresa_id) {
      throw createError({ statusCode: 404, statusMessage: 'Atendimento não encontrado ou não pertence à sua empresa' })
    }

    // Verificar se usuário pode resolver
    if (atendimento.usuario_responsavel_id && atendimento.usuario_responsavel_id !== user.id) {
      if (userData.role !== 'admin' && userData.role !== 'superadmin') {
        throw createError({ statusCode: 403, statusMessage: 'Apenas o responsável pelo atendimento pode resolver' })
      }
    }

    if (atendimento.status === 'concluido') {
      throw createError({ statusCode: 400, statusMessage: 'Atendimento já está concluído' })
    }

    // Atualizar atendimento
    const now = new Date()
    await db.update(schema.atendimentos)
      .set({ status: 'concluido', data_conclusao: now, unread_count: 0, updated_at: now })
      .where(eq(schema.atendimentos.id, atendimentoId))

    // Marcar mensagens como lidas
    await db.update(schema.mensagens)
      .set({ lida: true })
      .where(and(eq(schema.mensagens.atendimento_id, atendimentoId), eq(schema.mensagens.lida, false)))

    const updated = await db.query.atendimentos.findFirst({
      where: eq(schema.atendimentos.id, atendimentoId),
      with: { contato: true, inbox: true, assignee: { columns: { id: true, name: true, email: true } } }
    })

    return {
      success: true,
      data: {
        id: updated!.id, contato_id: updated!.contato_id, inbox_id: updated!.inbox_id,
        name: updated!.contato?.nome || 'Contato',
        phone: updated!.contato?.telefone || '',
        email: (updated!.contato as any)?.email || '',
        company: (updated!.contato as any)?.empresa || '',
        lastMessage: updated!.ultimo_mensagem || '',
        lastMessageTime: updated!.ultimo_mensagem_time ? new Date(updated!.ultimo_mensagem_time) : new Date(updated!.created_at!),
        unreadCount: 0, status: updated!.status,
        caixa_entrada: updated!.inbox_id, inbox_name: updated!.inbox?.name || 'Sem caixa',
        usuario_responsavel_id: updated!.usuario_responsavel_id,
        responsavel_name: updated!.assignee?.name || null,
        data_atribuicao: updated!.data_atribuicao, data_conclusao: updated!.data_conclusao,
        created_at: updated!.created_at, updated_at: updated!.updated_at,
        tags: [], messages: []
      },
      message: 'Atendimento resolvido com sucesso'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
