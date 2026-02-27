import { eq, and, inArray } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id, role: schema.users.role })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Usuário não está associado a nenhuma empresa' })

    const body = await readBody(event)
    const { contato_id, inbox_id, ultimo_mensagem } = body

    if (!contato_id || !inbox_id) throw createError({ statusCode: 400, statusMessage: 'contato_id e inbox_id são obrigatórios' })

    // Verificar se contato e inbox pertencem à empresa
    const [contatoCheck, inboxCheck] = await Promise.all([
      db.select({ empresa_id: schema.contatos.empresa_id }).from(schema.contatos).where(eq(schema.contatos.id, contato_id)).limit(1),
      db.select({ empresa_id: schema.inboxes.empresa_id }).from(schema.inboxes).where(eq(schema.inboxes.id, inbox_id)).limit(1)
    ])

    if (!contatoCheck[0] || contatoCheck[0].empresa_id !== userData.empresa_id) {
      throw createError({ statusCode: 404, statusMessage: 'Contato não encontrado ou não pertence à sua empresa' })
    }
    if (!inboxCheck[0] || inboxCheck[0].empresa_id !== userData.empresa_id) {
      throw createError({ statusCode: 404, statusMessage: 'Caixa de entrada não encontrada ou não pertence à sua empresa' })
    }

    // Verificar se já existe atendimento ativo para este contato
    const existente = await db.query.atendimentos.findFirst({
      where: and(
        eq(schema.atendimentos.contato_id, contato_id),
        inArray(schema.atendimentos.status, ['aguardando', 'ativo'])
      )
    })

    if (existente) {
      return { success: true, data: existente, message: 'Atendimento já existe para este contato' }
    }

    const now = new Date()
    const [novoAtendimento] = await db.insert(schema.atendimentos).values({
      contato_id,
      inbox_id,
      status: 'aguardando',
      last_message_at: ultimo_mensagem ? now : undefined,
      unread_count: ultimo_mensagem ? 1 : 0
    }).returning()

    const full = await db.query.atendimentos.findFirst({
      where: eq(schema.atendimentos.id, novoAtendimento.id),
      with: { contato: true, inbox: true }
    })

    return {
      success: true,
      data: {
        id: full!.id, contato_id: full!.contato_id, inbox_id: full!.inbox_id,
        name: full!.contato?.nome || 'Contato',
        phone: full!.contato?.telefone || '',
        email: (full!.contato as any)?.email || '',
        company: (full!.contato as any)?.empresa || '',
        lastMessage: ultimo_mensagem || '',
        lastMessageTime: full!.last_message_at ? new Date(full!.last_message_at) : new Date(full!.created_at!),
        unreadCount: full!.unread_count || 0, status: full!.status,
        caixa_entrada: full!.inbox_id, inbox_name: full!.inbox?.name || 'Sem caixa',
        created_at: full!.created_at, tags: [], messages: []
      },
      message: 'Atendimento criado com sucesso'
    }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
