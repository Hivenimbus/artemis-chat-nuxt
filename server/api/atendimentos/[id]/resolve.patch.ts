import { db } from '~/server/db'
import { users, atendimentos, inboxes, contatos, mensagens } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/atendimentos/[id]/resolve: Iniciando resolução de atendimento')

    // Obter usuário do contexto (injetado pelo middleware 01-auth-check)
    const user = event.context.user

    if (!user) {
      console.error('API /api/atendimentos/[id]/resolve: Usuário não autenticado no contexto')
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
      console.error('API /api/atendimentos/[id]/resolve: Usuário sem empresa')
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
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

    // Verificar se usuário pode resolver o atendimento
    if (atendimento.usuario_responsavel_id && atendimento.usuario_responsavel_id !== user.id) {
      if (userData.role !== 'admin' && userData.role !== 'superadmin') {
        throw createError({
          statusCode: 403,
          statusMessage: 'Apenas o responsável pelo atendimento pode resolver'
        })
      }
    }

    // Verificar se atendimento já está concluído
    if (atendimento.status === 'concluido') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Atendimento já está concluído'
      })
    }

    // Atualizar atendimento para concluído
    const now = new Date()
    const [atendimentoAtualizado] = await db.update(atendimentos)
      .set({
        status: 'concluido',
        data_conclusao: now,
        unread_count: 0,
        updated_at: now
      })
      .where(eq(atendimentos.id, atendimentoId))
      .returning()

    if (!atendimentoAtualizado) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao resolver atendimento'
      })
    }

    // Marcar todas as mensagens não lidas como lidas
    await db.update(mensagens)
      .set({ lida: true })
      .where(and(
        eq(mensagens.atendimento_id, atendimentoId),
        eq(mensagens.lida, false)
      ))

    // Buscar dados relacionados
    const [[contato], [inbox], [responsavel]] = await Promise.all([
      db.select({ id: contatos.id, nome: contatos.nome, telefone: contatos.telefone, email: contatos.email, empresa: contatos.empresa })
        .from(contatos).where(eq(contatos.id, atendimentoAtualizado.contato_id!)).limit(1),
      db.select({ id: inboxes.id, name: inboxes.name, description: inboxes.description })
        .from(inboxes).where(eq(inboxes.id, atendimentoAtualizado.inbox_id!)).limit(1),
      atendimentoAtualizado.usuario_responsavel_id
        ? db.select({ id: users.id, name: users.name, email: users.email })
          .from(users).where(eq(users.id, atendimentoAtualizado.usuario_responsavel_id)).limit(1)
        : Promise.resolve([null])
    ])

    console.log('API /api/atendimentos/[id]/resolve: Atendimento resolvido com sucesso:', atendimentoId)

    // Formatar resposta
    const atendimentoFormatado = {
      id: atendimentoAtualizado.id,
      contato_id: atendimentoAtualizado.contato_id,
      inbox_id: atendimentoAtualizado.inbox_id,
      name: contato?.nome || 'Contato',
      phone: contato?.telefone || '',
      email: contato?.email || '',
      company: contato?.empresa || '',
      lastMessage: atendimentoAtualizado.ultimo_mensagem || '',
      lastMessageTime: atendimentoAtualizado.ultimo_mensagem_time ? new Date(atendimentoAtualizado.ultimo_mensagem_time) : new Date(atendimentoAtualizado.created_at!),
      unreadCount: 0,
      status: atendimentoAtualizado.status,
      caixa_entrada: atendimentoAtualizado.inbox_id,
      inbox_name: inbox?.name || 'Sem caixa',
      usuario_responsavel_id: atendimentoAtualizado.usuario_responsavel_id,
      responsavel_name: responsavel?.name || null,
      data_atribuicao: atendimentoAtualizado.data_atribuicao,
      data_conclusao: atendimentoAtualizado.data_conclusao,
      created_at: atendimentoAtualizado.created_at,
      updated_at: atendimentoAtualizado.updated_at,
      tags: [],
      messages: []
    }

    return {
      success: true,
      data: atendimentoFormatado,
      message: 'Atendimento resolvido com sucesso'
    }

  } catch (error: any) {
    console.error('API /api/atendimentos/[id]/resolve: Erro no handler:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
