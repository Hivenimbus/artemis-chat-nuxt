<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, contatos, atendimentos, inboxes } from '~/server/db/schema'
import { eq, and, desc, count } from 'drizzle-orm'
=======
import { eq, and } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const contactId = getRouterParam(event, 'id')
<<<<<<< Updated upstream

    if (!contactId) {
      throw createError({ statusCode: 400, statusMessage: 'ID do contato não fornecido' })
    }

    // Buscar dados do usuário para obter empresa_id
    const userData = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
    }

    // 1. Verificar se o contato existe e pertence à empresa
    const contact = await db
      .select({ created_at: contatos.created_at })
      .from(contatos)
      .where(and(eq(contatos.id, contactId), eq(contatos.empresa_id, userData.empresa_id)))
      .limit(1)
      .then(r => r[0])

    if (!contact) {
      throw createError({ statusCode: 404, statusMessage: 'Contato não encontrado' })
    }

    // 2. Contar total de atendimentos do contato
    const totalTickets = await db
      .select({ total: count() })
      .from(atendimentos)
      .where(eq(atendimentos.contato_id, contactId))
      .then(r => Number(r[0]?.total ?? 0))

    // 3. Buscar interações recentes (atendimentos) com agente e inbox
    const recentInteractionsRows = await db
      .select({
        id: atendimentos.id,
        status: atendimentos.status,
        created_at: atendimentos.created_at,
        ultimo_mensagem: atendimentos.ultimo_mensagem,
        usuario_responsavel_id: atendimentos.usuario_responsavel_id,
        inbox_id: atendimentos.inbox_id
      })
      .from(atendimentos)
      .where(eq(atendimentos.contato_id, contactId))
      .orderBy(desc(atendimentos.created_at))
      .limit(5)

    // Buscar nomes dos agentes e inboxes separadamente
    const agentIds = [...new Set(recentInteractionsRows
      .map(i => i.usuario_responsavel_id)
      .filter(Boolean) as string[])]

    const inboxIds = [...new Set(recentInteractionsRows
      .map(i => i.inbox_id)
      .filter(Boolean) as string[])]

    const agentsMap: Record<string, string> = {}
    if (agentIds.length > 0) {
      const agentRows = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.id, agentIds[0]))

      // Para múltiplos agentes, buscar individualmente ou usar inArray
      // Aqui usamos um loop simples para manter compatibilidade
      for (const row of agentRows) {
        if (row.id && row.name) agentsMap[row.id] = row.name
      }

      // Buscar demais agentes se houver mais de um
      if (agentIds.length > 1) {
        const { inArray } = await import('drizzle-orm')
        const extraAgents = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, agentIds))

        for (const row of extraAgents) {
          if (row.id && row.name) agentsMap[row.id] = row.name
        }
      }
    }
=======
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
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
      stats: {
        totalTickets,
        createdAt: contact.created_at
      },
      history
    }

  } catch (error: any) {
    console.error('API contatos/[id]/stats.get:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro ao buscar estatísticas do contato'
    })
=======
      stats: { totalTickets: atendimentos.length, createdAt: contact.created_at },
      history: interactions.map(i => ({
        id: i.id, type: 'ticket', status: i.status,
        date: i.created_at, description: i.ultimo_mensagem || 'Novo atendimento iniciado',
        agent: i.assignee?.name || 'Sistema', channel: i.inbox?.name || 'N/A'
      }))
    }

  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro ao buscar estatísticas' })
>>>>>>> Stashed changes
  }
})
