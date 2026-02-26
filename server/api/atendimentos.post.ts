import { db } from '~/server/db'
import { users, atendimentos, inboxes, contatos } from '~/server/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/atendimentos POST: Iniciando criação de atendimento')

    const user = event.context.user

    if (!user) {
      console.error('API /api/atendimentos POST: Usuário não autenticado no contexto')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    // Obter dados do usuário
    const userData = await db
      .select({ empresa_id: users.empresa_id, role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData?.empresa_id) {
      console.error('API /api/atendimentos POST: Usuário sem empresa')
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Obter corpo da requisição
    const body = await readBody(event)
    const { contato_id, inbox_id, ultimo_mensagem } = body

    if (!contato_id || !inbox_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'contato_id e inbox_id são obrigatórios'
      })
    }

    // Verificar se contato pertence à mesma empresa
    const contato = await db
      .select({ empresa_id: contatos.empresa_id })
      .from(contatos)
      .where(eq(contatos.id, contato_id))
      .limit(1)
      .then(r => r[0])

    if (!contato || contato.empresa_id !== userData.empresa_id) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Contato não encontrado ou não pertence à sua empresa'
      })
    }

    // Verificar se inbox pertence à mesma empresa
    const inbox = await db
      .select({ empresa_id: inboxes.empresa_id })
      .from(inboxes)
      .where(eq(inboxes.id, inbox_id))
      .limit(1)
      .then(r => r[0])

    if (!inbox || inbox.empresa_id !== userData.empresa_id) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Caixa de entrada não encontrada ou não pertence à sua empresa'
      })
    }

    // Verificar se já existe um atendimento ativo para este contato
    const atendimentoExistente = await db
      .select({ id: atendimentos.id, status: atendimentos.status })
      .from(atendimentos)
      .where(
        and(
          eq(atendimentos.contato_id, contato_id),
          inArray(atendimentos.status, ['aguardando', 'ativo'])
        )
      )
      .limit(1)
      .then(r => r[0])

    if (atendimentoExistente) {
      console.log('API /api/atendimentos POST: Atendimento já existe, retornando existente')
      return {
        success: true,
        data: atendimentoExistente,
        message: 'Atendimento já existe para este contato'
      }
    }

    // Criar novo atendimento
    const agora = new Date().toISOString()
    const novoAtendimento = await db
      .insert(atendimentos)
      .values({
        contato_id,
        inbox_id,
        status: 'aguardando',
        ultimo_mensagem: ultimo_mensagem || null,
        ultimo_mensagem_time: ultimo_mensagem ? agora : null,
        unread_count: ultimo_mensagem ? 1 : 0
      })
      .returning()
      .then(r => r[0])

    if (!novoAtendimento) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao criar atendimento'
      })
    }

    // Buscar contato e inbox para a resposta formatada
    const [contatoData, inboxData] = await Promise.all([
      db
        .select({ nome: contatos.nome, telefone: contatos.telefone, email: contatos.email, empresa: contatos.empresa })
        .from(contatos)
        .where(eq(contatos.id, contato_id))
        .limit(1)
        .then(r => r[0]),
      db
        .select({ name: inboxes.name })
        .from(inboxes)
        .where(eq(inboxes.id, inbox_id))
        .limit(1)
        .then(r => r[0])
    ])

    // Atualizar contato com informações do atendimento
    await db
      .update(contatos)
      .set({
        ultimo_atendimento_id: novoAtendimento.id,
        data_ultimo_contato: agora
      })
      .where(eq(contatos.id, contato_id))

    console.log('API /api/atendimentos POST: Atendimento criado com sucesso:', novoAtendimento.id)

    const atendimentoFormatado = {
      id: novoAtendimento.id,
      contato_id: novoAtendimento.contato_id,
      inbox_id: novoAtendimento.inbox_id,
      name: contatoData?.nome || 'Contato',
      phone: contatoData?.telefone || '',
      email: contatoData?.email || '',
      company: contatoData?.empresa || '',
      lastMessage: novoAtendimento.ultimo_mensagem || '',
      lastMessageTime: novoAtendimento.ultimo_mensagem_time
        ? new Date(novoAtendimento.ultimo_mensagem_time)
        : new Date(novoAtendimento.created_at!),
      unreadCount: novoAtendimento.unread_count || 0,
      status: novoAtendimento.status,
      caixa_entrada: novoAtendimento.inbox_id,
      inbox_name: inboxData?.name || 'Sem caixa',
      created_at: novoAtendimento.created_at,
      tags: [],
      messages: []
    }

    return {
      success: true,
      data: atendimentoFormatado,
      message: 'Atendimento criado com sucesso'
    }

  } catch (error: any) {
    console.error('API /api/atendimentos POST: Erro no handler:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
