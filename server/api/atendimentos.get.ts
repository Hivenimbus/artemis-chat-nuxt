<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, atendimentos, inboxes, contatos, etiquetas, contatoEtiquetas, inboxAgents, equipesAgentes, inboxTeams } from '~/server/db/schema'
import { eq, and, or, inArray, sql, desc, ne, count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/atendimentos: Iniciando requisição')

    const user = event.context.user

    if (!user) {
      console.error('API /api/atendimentos: Usuário não autenticado no contexto')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    console.log('API /api/atendimentos: Usuário autenticado:', user.id)

    // Buscar dados do usuário
    const userData = await db
      .select({ empresa_id: users.empresa_id, role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData?.empresa_id) {
      console.error('API /api/atendimentos: Usuário sem empresa')
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }
=======
import { eq, and, ne, inArray, or, lte, desc, asc } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    // Buscar dados do usuário
    const [userData] = await db.select({ empresa_id: schema.users.empresa_id, role: schema.users.role })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Usuário não está associado a nenhuma empresa' })
>>>>>>> Stashed changes

    const empresaId = userData.empresa_id

    // --- Permissões de Inboxes ---
    let allowedInboxIds: string[] = []

    if (userData.role !== 'admin' && userData.role !== 'superadmin') {
<<<<<<< Updated upstream
      // 1. Inboxes atribuídas diretamente ao agente
      const directAssignments = await db
        .select({ inbox_id: inboxAgents.inbox_id })
        .from(inboxAgents)
        .where(eq(inboxAgents.user_id, user.id))

      // 2. Equipes que o agente participa
      const userTeams = await db
        .select({ equipe_id: equipesAgentes.equipe_id })
        .from(equipesAgentes)
        .where(eq(equipesAgentes.agente_id, user.id))

      const teamIds = userTeams.map(t => t.equipe_id)

      let teamInboxIds: string[] = []

      if (teamIds.length > 0) {
        const teamAssignments = await db
          .select({ inbox_id: inboxTeams.inbox_id })
          .from(inboxTeams)
          .where(inArray(inboxTeams.equipe_id, teamIds))

        teamInboxIds = teamAssignments.map(t => t.inbox_id)
      }

      const directIds = directAssignments.map(a => a.inbox_id)
=======
      const [directAssignments, userTeams] = await Promise.all([
        db.select({ inbox_id: schema.inboxAgents.inbox_id }).from(schema.inboxAgents).where(eq(schema.inboxAgents.user_id, user.id)),
        db.select({ equipe_id: schema.equipesAgentes.equipe_id }).from(schema.equipesAgentes).where(eq(schema.equipesAgentes.agente_id, user.id))
      ])

      const teamIds = userTeams.map(t => t.equipe_id).filter(Boolean) as string[]
      let teamInboxIds: string[] = []

      if (teamIds.length > 0) {
        const teamAssignments = await db.select({ inbox_id: schema.inboxTeams.inbox_id })
          .from(schema.inboxTeams).where(inArray(schema.inboxTeams.equipe_id, teamIds))
        teamInboxIds = teamAssignments.map(t => t.inbox_id).filter(Boolean) as string[]
      }

      const directIds = directAssignments.map(a => a.inbox_id).filter(Boolean) as string[]
>>>>>>> Stashed changes
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

    if (inboxId && allowedInboxIds.length > 0 && !allowedInboxIds.includes(inboxId)) {
      throw createError({ statusCode: 403, statusMessage: 'Sem permissão para esta caixa de entrada' })
    }

<<<<<<< Updated upstream
    // --- Cálculos de Counts ---
    const buildPermissionCondition = (statusFilter?: string) => {
      const isMinhasFilter = statusFilter === 'ativo'

      const conditions: any[] = [
        eq(inboxes.empresa_id, userData.empresa_id)
      ]

      if (inboxId) {
        conditions.push(eq(atendimentos.inbox_id, inboxId))
      }

      if (statusFilter) {
        conditions.push(eq(atendimentos.status, statusFilter))
      }

      if ((userData.role !== 'admin' && userData.role !== 'superadmin') || isMinhasFilter) {
        if (isMinhasFilter) {
          conditions.push(eq(atendimentos.usuario_responsavel_id, user.id))
        } else if (allowedInboxIds.length > 0) {
          conditions.push(
            or(
              inArray(atendimentos.inbox_id, allowedInboxIds),
              eq(atendimentos.usuario_responsavel_id, user.id)
            )
          )
        } else {
          conditions.push(eq(atendimentos.usuario_responsavel_id, user.id))
        }
      }

      return and(...conditions)
    }

    const getCount = async (statusFilter?: string) => {
      return db
        .select({ total: count() })
        .from(atendimentos)
        .leftJoin(inboxes, eq(atendimentos.inbox_id, inboxes.id))
        .where(buildPermissionCondition(statusFilter))
        .then(r => Number(r[0]?.total ?? 0))
    }

    const [totalCount, aguardandoCount, ativoCount, concluidoCount] = await Promise.all([
      getCount(),
      getCount('aguardando'),
      getCount('ativo'),
      getCount('concluido')
=======
    // Buscar IDs de inboxes da empresa para filtrar atendimentos
    const companyInboxes = await db.select({ id: schema.inboxes.id }).from(schema.inboxes).where(eq(schema.inboxes.empresa_id, empresaId))
    const companyInboxIds = companyInboxes.map(i => i.id)

    if (companyInboxIds.length === 0) {
      return { success: true, data: { atendimentos: [], counts: { todos: 0, aguardando: 0, ativo: 0, concluido: 0 }, pagination: { page, limit, totalItems: 0, totalPages: 0, startItem: 0, endItem: 0, hasNextPage: false, hasPreviousPage: false } } }
    }

    // Build base conditions
    const buildConditions = (statusFilter?: string, forCount = false) => {
      const conditions: any[] = [inArray(schema.atendimentos.inbox_id, companyInboxIds)]

      const isMinhas = statusFilter === 'ativo' && forCount
      if ((userData.role !== 'admin' && userData.role !== 'superadmin') || isMinhas) {
        if (isMinhas) {
          conditions.push(eq(schema.atendimentos.usuario_responsavel_id, user.id))
        } else if (allowedInboxIds.length > 0) {
          conditions.push(or(
            inArray(schema.atendimentos.inbox_id, allowedInboxIds),
            eq(schema.atendimentos.usuario_responsavel_id, user.id)
          ))
        } else {
          conditions.push(eq(schema.atendimentos.usuario_responsavel_id, user.id))
        }
      }

      if (inboxId) conditions.push(eq(schema.atendimentos.inbox_id, inboxId))
      if (statusFilter) conditions.push(eq(schema.atendimentos.status, statusFilter))
      return and(...conditions)
    }

    // Counts em paralelo
    const [allRows, aguardRows, ativoRows, concluidoRows] = await Promise.all([
      db.select({ id: schema.atendimentos.id }).from(schema.atendimentos).where(buildConditions()),
      db.select({ id: schema.atendimentos.id }).from(schema.atendimentos).where(buildConditions('aguardando', true)),
      db.select({ id: schema.atendimentos.id }).from(schema.atendimentos).where(buildConditions('ativo', true)),
      db.select({ id: schema.atendimentos.id }).from(schema.atendimentos).where(buildConditions('concluido', true)),
>>>>>>> Stashed changes
    ])

    const counts = { todos: allRows.length, aguardando: aguardRows.length, ativo: ativoRows.length, concluido: concluidoRows.length }

<<<<<<< Updated upstream
    // --- Query Principal ---
    const isMinhasQuery = status === 'ativo'

    const mainConditions: any[] = [
      eq(inboxes.empresa_id, userData.empresa_id)
    ]

    // Filtro de permissão
    if ((userData.role !== 'admin' && userData.role !== 'superadmin') || isMinhasQuery) {
      if (isMinhasQuery) {
        mainConditions.push(eq(atendimentos.usuario_responsavel_id, user.id))
      } else if (allowedInboxIds.length > 0) {
        mainConditions.push(
          or(
            inArray(atendimentos.inbox_id, allowedInboxIds),
            eq(atendimentos.usuario_responsavel_id, user.id)
          )
        )
      } else {
        mainConditions.push(eq(atendimentos.usuario_responsavel_id, user.id))
      }
    }

    // Filtros adicionais
    if (inboxId) {
      mainConditions.push(eq(atendimentos.inbox_id, inboxId))
    }

    if (status) {
      if (status !== 'todos') {
        mainConditions.push(eq(atendimentos.status, status))
      }
    } else {
      mainConditions.push(ne(atendimentos.status, 'concluido'))
    }

    if (responsavelId) {
      mainConditions.push(eq(atendimentos.usuario_responsavel_id, responsavelId))
    }

    const whereCondition = and(...mainConditions)

    // Contar total para paginação
    const totalItems = await db
      .select({ total: count() })
      .from(atendimentos)
      .leftJoin(inboxes, eq(atendimentos.inbox_id, inboxes.id))
      .where(whereCondition)
      .then(r => Number(r[0]?.total ?? 0))

    // Query principal com JOINs
    const rows = await db
      .select({
        id: atendimentos.id,
        contato_id: atendimentos.contato_id,
        inbox_id: atendimentos.inbox_id,
        usuario_responsavel_id: atendimentos.usuario_responsavel_id,
        status: atendimentos.status,
        ultimo_mensagem: atendimentos.ultimo_mensagem,
        ultimo_mensagem_time: atendimentos.ultimo_mensagem_time,
        unread_count: atendimentos.unread_count,
        data_atribuicao: atendimentos.data_atribuicao,
        data_conclusao: atendimentos.data_conclusao,
        created_at: atendimentos.created_at,
        updated_at: atendimentos.updated_at,
        // contato fields
        contato_nome: contatos.nome,
        contato_telefone: contatos.telefone,
        contato_email: contatos.email,
        contato_empresa: contatos.empresa,
        contato_cidade: contatos.cidade,
        contato_profile_picture_url: contatos.profile_picture_url,
        // inbox fields
        inbox_name: inboxes.name,
        inbox_empresa_id: inboxes.empresa_id,
        // responsavel fields
        responsavel_name: users.name,
        responsavel_email: users.email,
      })
      .from(atendimentos)
      .leftJoin(contatos, eq(atendimentos.contato_id, contatos.id))
      .leftJoin(inboxes, eq(atendimentos.inbox_id, inboxes.id))
      .leftJoin(users, eq(atendimentos.usuario_responsavel_id, users.id))
      .where(whereCondition)
      .orderBy(desc(atendimentos.ultimo_mensagem_time))
      .limit(limit)
      .offset(offset)

    console.log('API /api/atendimentos: Atendimentos encontrados:', rows.length)

    // Buscar tags para os contatos encontrados
    const contatoIds = [...new Set(rows.map(r => r.contato_id).filter(Boolean))] as string[]

    let tagsByContato: Record<string, { id: string; nome: string; cor: string }[]> = {}

    if (contatoIds.length > 0) {
      const tagRows = await db
        .select({
          contato_id: contatoEtiquetas.contato_id,
          etiqueta_id: etiquetas.id,
          etiqueta_nome: etiquetas.nome,
          etiqueta_cor: etiquetas.cor
        })
        .from(contatoEtiquetas)
        .leftJoin(etiquetas, eq(contatoEtiquetas.etiqueta_id, etiquetas.id))
        .where(inArray(contatoEtiquetas.contato_id, contatoIds))

      for (const row of tagRows) {
        if (!row.etiqueta_id) continue
        if (!tagsByContato[row.contato_id]) {
          tagsByContato[row.contato_id] = []
        }
        tagsByContato[row.contato_id].push({
          id: row.etiqueta_id,
          nome: row.etiqueta_nome || '',
          cor: row.etiqueta_cor || ''
        })
      }
    }

    // Formatar dados para o frontend
    const atendimentosFormatados = rows.map(atendimento => ({
      id: atendimento.id,
      contato_id: atendimento.contato_id,
      inbox_id: atendimento.inbox_id,
      name: atendimento.contato_nome || 'Contato',
      phone: atendimento.contato_telefone || '',
      email: atendimento.contato_email || '',
      company: atendimento.contato_empresa || '',
      city: atendimento.contato_cidade || '',
      profilePictureUrl: atendimento.contato_profile_picture_url || '',
      lastMessage: atendimento.ultimo_mensagem || '',
      lastMessageTime: atendimento.ultimo_mensagem_time
        ? new Date(atendimento.ultimo_mensagem_time)
        : new Date(atendimento.created_at!),
      unreadCount: atendimento.unread_count || 0,
      status: atendimento.status,
      caixa_entrada: atendimento.inbox_id,
      inbox_name: atendimento.inbox_name || 'Sem caixa',
      usuario_responsavel_id: atendimento.usuario_responsavel_id,
      responsavel_name: atendimento.responsavel_name || null,
      data_atribuicao: atendimento.data_atribuicao,
      data_conclusao: atendimento.data_conclusao,
      created_at: atendimento.created_at,
      updated_at: atendimento.updated_at,
      tags: tagsByContato[atendimento.contato_id!] || [],
      messages: []
    }))

    // Calcular informações de paginação
=======
    // Main query conditions
    const mainConditions: any[] = [inArray(schema.atendimentos.inbox_id, companyInboxIds)]
    const isMinhasQuery = status === 'ativo'

    if ((userData.role !== 'admin' && userData.role !== 'superadmin') || isMinhasQuery) {
      if (isMinhasQuery) {
        mainConditions.push(eq(schema.atendimentos.usuario_responsavel_id, user.id))
      } else if (allowedInboxIds.length > 0) {
        mainConditions.push(or(
          inArray(schema.atendimentos.inbox_id, allowedInboxIds),
          eq(schema.atendimentos.usuario_responsavel_id, user.id)
        ))
      } else {
        mainConditions.push(eq(schema.atendimentos.usuario_responsavel_id, user.id))
      }
    }

    if (inboxId) mainConditions.push(eq(schema.atendimentos.inbox_id, inboxId))
    if (status && status !== 'todos') mainConditions.push(eq(schema.atendimentos.status, status))
    else if (!status) mainConditions.push(ne(schema.atendimentos.status, 'concluido'))
    if (responsavelId) mainConditions.push(eq(schema.atendimentos.usuario_responsavel_id, responsavelId))

    // Buscar atendimentos com joins
    const atendimentos = await db.query.atendimentos.findMany({
      where: and(...mainConditions),
      orderBy: [desc(schema.atendimentos.ultimo_mensagem_time)],
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

    const atendimentosFormatados = atendimentos.map(a => ({
      id: a.id,
      contato_id: a.contato_id,
      inbox_id: a.inbox_id,
      name: a.contato?.nome || 'Contato',
      phone: a.contato?.telefone || '',
      email: (a.contato as any)?.email || '',
      company: (a.contato as any)?.empresa || '',
      city: (a.contato as any)?.cidade || '',
      profilePictureUrl: a.contato?.profile_picture_url || '',
      lastMessage: a.ultimo_mensagem || '',
      lastMessageTime: a.ultimo_mensagem_time ? new Date(a.ultimo_mensagem_time) : new Date(a.created_at!),
      unreadCount: a.unread_count || 0,
      status: a.status,
      caixa_entrada: a.inbox_id,
      inbox_name: a.inbox?.name || 'Sem caixa',
      usuario_responsavel_id: a.usuario_responsavel_id,
      responsavel_name: a.assignee?.name || null,
      data_atribuicao: a.data_atribuicao,
      data_conclusao: a.data_conclusao,
      created_at: a.created_at,
      updated_at: a.updated_at,
      tags: a.contato?.etiqueta ? [{ id: a.contato.etiqueta.id, nome: a.contato.etiqueta.nome, cor: a.contato.etiqueta.cor }] : [],
      messages: []
    }))

    const totalItems = allRows.length
>>>>>>> Stashed changes
    const totalPages = Math.ceil(totalItems / limit)

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
<<<<<<< Updated upstream
    console.error('API /api/atendimentos: Erro no handler:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
=======
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
>>>>>>> Stashed changes
  }
})
