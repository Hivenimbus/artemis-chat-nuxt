import { eq, and } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const contactId = getRouterParam(event, 'id')
    if (!contactId) throw createError({ statusCode: 400, statusMessage: 'ID do contato não fornecido' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })

    const [contact] = await db.select({ created_at: schema.contatos.created_at })
      .from(schema.contatos)
      .where(and(eq(schema.contatos.id, contactId), eq(schema.contatos.empresa_id, userData.empresa_id)))
      .limit(1)

    if (!contact) throw createError({ statusCode: 404, statusMessage: 'Contato não encontrado' })

    const [atendimentos, interactions] = await Promise.all([
      db.select({ id: schema.atendimentos.id }).from(schema.atendimentos).where(eq(schema.atendimentos.contato_id, contactId)),
      db.query.atendimentos.findMany({
        where: eq(schema.atendimentos.contato_id, contactId),
        orderBy: [(t) => t.created_at],
        limit: 5,
        with: { assignee: { columns: { name: true } }, inbox: { columns: { name: true } } }
      })
    ])

    const inboxesMap: Record<string, string> = {}
    if (inboxIds.length > 0) {
      const { inArray } = await import('drizzle-orm')
      const inboxRows = await db
        .select({ id: inboxes.id, name: inboxes.name })
        .from(inboxes)
        .where(inArray(inboxes.id, inboxIds))

      for (const row of inboxRows) {
        if (row.id) inboxesMap[row.id] = row.name
      }
    }

    const history = recentInteractionsRows.map(interaction => ({
      id: interaction.id,
      type: 'ticket',
      status: interaction.status,
      date: interaction.created_at,
      description: interaction.ultimo_mensagem || 'Novo atendimento iniciado',
      agent: (interaction.usuario_responsavel_id && agentsMap[interaction.usuario_responsavel_id]) || 'Sistema',
      channel: (interaction.inbox_id && inboxesMap[interaction.inbox_id]) || 'N/A'
    }))

    return {
      success: true,
      stats: { totalTickets: atendimentos.length, createdAt: contact.created_at },
      history: interactions.map(i => ({
        id: i.id, type: 'ticket', status: i.status,
        date: i.created_at, description: i.ultimo_mensagem || 'Novo atendimento iniciado',
        agent: i.assignee?.name || 'Sistema', channel: i.inbox?.name || 'N/A'
      }))
    }

  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro ao buscar estatísticas' })
  }
})
