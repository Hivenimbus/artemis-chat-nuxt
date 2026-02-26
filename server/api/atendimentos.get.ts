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

    // --- Verificar Permissões de Inboxes ---
    let allowedInboxIds: string[] = []

    if (userData.role !== 'admin' && userData.role !== 'superadmin') {
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
      allowedInboxIds = [...new Set([...directIds, ...teamInboxIds])]
    }

    // Obter query parameters
    const query = getQuery(event)
    const inboxId = query.inbox_id as string
    const status = query.status as string
    const responsavelId = query.responsavel_id as string
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 50
    const offset = (page - 1) * limit

    // Se usuário solicitou uma inbox específica, verificar se ele tem acesso
    if (inboxId && allowedInboxIds.length > 0 && !allowedInboxIds.includes(inboxId)) {
      throw createError({ statusCode: 403, statusMessage: 'Sem permissão para esta caixa de entrada' })
    }

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
    ])

    const counts = {
      todos: totalCount,
      aguardando: aguardandoCount,
      ativo: ativoCount,
      concluido: concluidoCount
    }

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
    const totalPages = Math.ceil(totalItems / limit)
    const startItem = totalItems === 0 ? 0 : offset + 1
    const endItem = Math.min(offset + limit, totalItems)

    console.log('API /api/atendimentos: Retornando dados com sucesso')

    return {
      success: true,
      data: {
        atendimentos: atendimentosFormatados,
        counts,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          startItem,
          endItem,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    }

  } catch (error: any) {
    console.error('API /api/atendimentos: Erro no handler:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
