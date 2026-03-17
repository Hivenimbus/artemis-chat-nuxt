import { eq, and, ne, inArray, or, desc, count } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    // empresa_id vem direto do JWT — sem query extra ao DB
    let empresaId = user.empresa_id as string | undefined
    let userRole = user.role as string

    // Fallback: se o JWT antigo não tiver empresa_id, buscar do DB
    if (!empresaId) {
      const [userData] = await db.select({ empresa_id: schema.users.empresa_id, role: schema.users.role })
        .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)
      if (!userData?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Usuário não está associado a nenhuma empresa' })
      empresaId = userData.empresa_id
      userRole = userData.role
    }

    // --- Permissões de Inboxes ---
    let allowedInboxIds: string[] = []

    if (userRole !== 'admin' && userRole !== 'superadmin') {
      const [directAssignments, userTeams] = await Promise.all([
        db.select({ inbox_id: schema.inboxAgents.inbox_id }).from(schema.inboxAgents).where(eq(schema.inboxAgents.user_id, user.id)),
        db.select({ equipe_id: schema.equipesAgentes.equipe_id }).from(schema.equipesAgentes).where(eq(schema.equipesAgentes.user_id, user.id))
      ])

      const teamIds = userTeams.map(t => t.equipe_id).filter(Boolean) as string[]
      let teamInboxIds: string[] = []

      if (teamIds.length > 0) {
        const teamAssignments = await db.select({ inbox_id: schema.inboxTeams.inbox_id })
          .from(schema.inboxTeams).where(inArray(schema.inboxTeams.equipe_id, teamIds))
        teamInboxIds = teamAssignments.map(t => t.inbox_id).filter(Boolean) as string[]
      }

      const directIds = directAssignments.map(a => a.inbox_id).filter(Boolean) as string[]
      allowedInboxIds = [...new Set([...directIds, ...teamInboxIds])]
    }

    // Query params
    const query = getQuery(event)
    const inboxId = query.inbox_id as string
    const status = query.status as string
    const responsavelId = query.responsavel_id as string
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 50
    const offset = (page - 1) * limit
    const includeCounts = query.include_counts !== 'false'

    if (inboxId && allowedInboxIds.length > 0 && !allowedInboxIds.includes(inboxId)) {
      throw createError({ statusCode: 403, statusMessage: 'Sem permissão para esta caixa de entrada' })
    }

    // Buscar IDs de inboxes da empresa
    const companyInboxes = await db.select({ id: schema.inboxes.id }).from(schema.inboxes).where(eq(schema.inboxes.empresa_id, empresaId))
    const companyInboxIds = companyInboxes.map(i => i.id)

    if (companyInboxIds.length === 0) {
      return { success: true, data: { atendimentos: [], counts: { todos: 0, aguardando: 0, ativo: 0, concluido: 0 }, pagination: { page, limit, totalItems: 0, totalPages: 0, startItem: 0, endItem: 0, hasNextPage: false, hasPreviousPage: false } } }
    }

    // Build base conditions
    const buildConditions = (statusFilter?: string, forCount = false) => {
      const conditions: any[] = [inArray(schema.atendimentos.inbox_id, companyInboxIds)]

      const isMinhas = statusFilter === 'ativo' && forCount
      if ((userRole !== 'admin' && userRole !== 'superadmin') || isMinhas) {
        if (isMinhas) {
          conditions.push(eq(schema.atendimentos.assignee_id, user.id))
        } else if (allowedInboxIds.length > 0) {
          conditions.push(or(
            inArray(schema.atendimentos.inbox_id, allowedInboxIds),
            eq(schema.atendimentos.assignee_id, user.id)
          ))
        } else {
          conditions.push(eq(schema.atendimentos.assignee_id, user.id))
        }
      }

      if (inboxId) conditions.push(eq(schema.atendimentos.inbox_id, inboxId))
      if (statusFilter) conditions.push(eq(schema.atendimentos.status, statusFilter))
      return and(...conditions)
    }

    // Main query conditions (build before counts to reuse)
    const mainConditions: any[] = [inArray(schema.atendimentos.inbox_id, companyInboxIds)]
    const isMinhasQuery = status === 'ativo'

    if ((userRole !== 'admin' && userRole !== 'superadmin') || isMinhasQuery) {
      if (isMinhasQuery) {
        mainConditions.push(eq(schema.atendimentos.assignee_id, user.id))
      } else if (allowedInboxIds.length > 0) {
        mainConditions.push(or(
          inArray(schema.atendimentos.inbox_id, allowedInboxIds),
          eq(schema.atendimentos.assignee_id, user.id)
        ))
      } else {
        mainConditions.push(eq(schema.atendimentos.assignee_id, user.id))
      }
    }

    if (inboxId) mainConditions.push(eq(schema.atendimentos.inbox_id, inboxId))
    if (status && status !== 'todos') mainConditions.push(eq(schema.atendimentos.status, status))
    else if (!status) mainConditions.push(ne(schema.atendimentos.status, 'concluido'))
    if (responsavelId) mainConditions.push(eq(schema.atendimentos.assignee_id, responsavelId))

    // Counts (SQL COUNT — muito mais rápido) + main query em paralelo
    const countsPromise = includeCounts
      ? Promise.all([
          db.select({ value: count() }).from(schema.atendimentos)
            .where(and(buildConditions(), ne(schema.atendimentos.status, 'concluido'))),
          db.select({ value: count() }).from(schema.atendimentos).where(buildConditions('aguardando', true)),
          db.select({ value: count() }).from(schema.atendimentos).where(buildConditions('ativo', true)),
          db.select({ value: count() }).from(schema.atendimentos).where(buildConditions('concluido', true)),
        ])
      : Promise.resolve(null)

    const atendimentosPromise = db.query.atendimentos.findMany({
      where: and(...mainConditions),
      orderBy: [desc(schema.atendimentos.last_message_at)],
      limit,
      offset,
      with: {
        contato: {
          with: { etiqueta: true }
        },
        inbox: true,
        assignee: { columns: { id: true, name: true, email: true } }
      }
    })

    const [countsResult, atendimentos] = await Promise.all([countsPromise, atendimentosPromise])

    let counts = { todos: 0, aguardando: 0, ativo: 0, concluido: 0 }
    let totalItems = 0

    if (countsResult) {
      const [allRows, aguardRows, ativoRows, concluidoRows] = countsResult
      counts = {
        todos: Number(allRows[0]?.value ?? 0),
        aguardando: Number(aguardRows[0]?.value ?? 0),
        ativo: Number(ativoRows[0]?.value ?? 0),
        concluido: Number(concluidoRows[0]?.value ?? 0),
      }
      totalItems = counts.todos
    }

    const atendimentosFormatados = atendimentos.map(a => ({
      id: a.id,
      contato_id: a.contato_id,
      inbox_id: a.inbox_id,
      name: a.contato?.nome || 'Contato',
      phone: a.contato?.telefone || '',
      email: (a.contato as any)?.email || '',
      company: (a.contato as any)?.empresa || '',
      city: (a.contato as any)?.cidade || '',
      profilePictureUrl: a.contato?.avatar_url || '',
      lastMessage: '',
      lastMessageTime: a.last_message_at ? new Date(a.last_message_at) : new Date(a.created_at!),
      unreadCount: a.unread_count || 0,
      status: a.status,
      caixa_entrada: a.inbox_id,
      inbox_name: a.inbox?.name || 'Sem caixa',
      usuario_responsavel_id: a.assignee_id,
      responsavel_name: a.assignee?.name || null,
      data_atribuicao: null,
      data_conclusao: null,
      created_at: a.created_at,
      updated_at: a.updated_at,
      tags: a.contato?.etiqueta ? [{ id: a.contato.etiqueta.id, nome: a.contato.etiqueta.nome, cor: a.contato.etiqueta.cor }] : [],
      messages: []
    }))

    const totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 1

    return {
      success: true,
      data: {
        atendimentos: atendimentosFormatados,
        counts,
        pagination: {
          page, limit, totalItems, totalPages,
          startItem: totalItems === 0 ? 0 : offset + 1,
          endItem: Math.min(offset + limit, totalItems),
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
