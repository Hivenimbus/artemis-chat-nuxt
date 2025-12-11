import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/atendimentos: Iniciando requisição')

    // Obter usuário do contexto
    const user = event.context.user

    if (!user) {
      console.error('API /api/atendimentos: Usuário não autenticado no contexto')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    console.log('API /api/atendimentos: Usuário autenticado:', user.id)

    const client = serverSupabaseServiceRole(event)

    // Buscar dados do usuário
    const { data: userData, error: userDataError } = await client
      .from('users')
      .select('empresa_id, role')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData?.empresa_id) {
      console.error('API /api/atendimentos: Erro ao buscar dados do usuário:', userDataError)
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // --- Verificar Permissões de Inboxes ---
    let allowedInboxIds: string[] = []
    
    // Se não for admin, filtrar apenas as inboxes atribuídas
    if (userData.role !== 'admin' && userData.role !== 'superadmin') {
      // 1. Buscar IDs das inboxes atribuídas diretamente ao agente
      const { data: directAssignments, error: directError } = await client
        .from('inbox_agents')
        .select('inbox_id')
        .eq('user_id', user.id)

      if (directError) {
        console.error('Erro ao buscar atribuições diretas:', directError)
        throw createError({ statusCode: 500, statusMessage: 'Erro ao verificar permissões' })
      }

      // 2. Buscar equipes que o agente participa
      const { data: userTeams, error: teamsError } = await client
        .from('equipes_agentes')
        .select('equipe_id')
        .eq('agente_id', user.id)

      if (teamsError) {
        console.error('Erro ao buscar equipes do usuário:', teamsError)
        throw createError({ statusCode: 500, statusMessage: 'Erro ao verificar permissões de equipe' })
      }

      const teamIds = userTeams?.map(t => t.equipe_id) || []
      
      let teamInboxIds: string[] = []

      // 3. Se participa de equipes, buscar inboxes atribuídas a essas equipes
      if (teamIds.length > 0) {
        const { data: teamAssignments, error: teamInboxError } = await client
          .from('inbox_teams')
          .select('inbox_id')
          .in('equipe_id', teamIds)

        if (teamInboxError) {
          console.error('Erro ao buscar atribuições de equipe:', teamInboxError)
          throw createError({ statusCode: 500, statusMessage: 'Erro ao verificar permissões de inboxes da equipe' })
        }
        
        if (teamAssignments) {
          teamInboxIds = teamAssignments.map(t => t.inbox_id)
        }
      }

      // Unir IDs únicos (diretos + equipes)
      const directIds = directAssignments?.map(a => a.inbox_id) || []
      allowedInboxIds = [...new Set([...directIds, ...teamInboxIds])]
      
      // Se não tiver nenhuma atribuída, mas pode ter atendimentos transferidos diretamente
      // não retornamos vazio imediatamente, apenas allowedInboxIds fica vazio
      // e a query principal cuidará de filtrar apenas os atribuídos
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
    // Fazer queries paralelas para obter os counts totais por status
    // Respeitando o filtro de permissão (inbox OU responsavel)
    
    // Função auxiliar para aplicar filtro de permissão e executar count
    const getCount = async (statusFilter?: string) => {
      let q = client
        .from('atendimentos')
        .select('inboxes!inner(empresa_id)', { count: 'exact', head: true })
        .eq('inboxes.empresa_id', userData.empresa_id)

      // Aplicar filtro de permissão composto: (inbox_id IN allowedInboxIds) OR (usuario_responsavel_id = user.id)
      if (allowedInboxIds.length > 0) {
        q = q.or(`inbox_id.in.(${allowedInboxIds.join(',')}),usuario_responsavel_id.eq.${user.id}`)
      } else {
        // Se não tiver inboxes permitidas, só vê os que é responsável
        q = q.eq('usuario_responsavel_id', user.id)
      }

      if (inboxId) {
        q = q.eq('inbox_id', inboxId)
      }

      if (statusFilter) {
        q = q.eq('status', statusFilter)
      }

      const { count, error } = await q
      if (error) console.error('Erro ao contar atendimentos:', error)
      return count || 0
    }

    // Executar counts em paralelo
    const [totalCount, aguardandoCount, ativoCount, concluidoCount] = await Promise.all([
      getCount(),               // Todos
      getCount('aguardando'),   // Aguardando
      getCount('ativo'),        // Minhas (Ativo)
      getCount('concluido')     // Concluído (opcional)
    ])

    const counts = {
      todos: totalCount,
      aguardando: aguardandoCount,
      ativo: ativoCount,
      concluido: concluidoCount
    }

    // --- Query Principal ---

    // Construir query base
    let queryBuilder = client
      .from('atendimentos')
      .select(`
        id,
        contato_id,
        inbox_id,
        usuario_responsavel_id,
        status,
        ultimo_mensagem,
        ultimo_mensagem_time,
        unread_count,
        data_atribuicao,
        data_conclusao,
        created_at,
        updated_at,
        contatos!atendimentos_contato_id_fkey (
          id,
          nome,
          telefone,
          email,
          empresa,
          cidade,
          contato_etiquetas (
            etiqueta_id,
            etiquetas (
              id,
              nome,
              cor
            )
          )
        ),
        inboxes (
          id,
          name,
          description
        ),
        users!atendimentos_usuario_responsavel_id_fkey (
          id,
          name,
          email
        )
      `, { count: 'exact' })
      .eq('inboxes.empresa_id', userData.empresa_id)
      .order('ultimo_mensagem_time', { ascending: false })

    // Aplicar filtro de permissão na query principal
    // Permite ver se tem acesso à inbox OU se é o responsável
    if (allowedInboxIds.length > 0) {
      queryBuilder = queryBuilder.or(`inbox_id.in.(${allowedInboxIds.join(',')}),usuario_responsavel_id.eq.${user.id}`)
    } else {
      queryBuilder = queryBuilder.eq('usuario_responsavel_id', user.id)
    }

    // Aplicar filtros
    if (inboxId) {
      queryBuilder = queryBuilder.eq('inbox_id', inboxId)
    }

    if (status) {
      // Se status for 'todos', não filtramos por status (útil para ver tudo, inclusive concluídos se desejado)
      if (status !== 'todos') {
        queryBuilder = queryBuilder.eq('status', status)
      }
    } else {
      // Comportamento padrão: excluir atendimentos concluídos
      queryBuilder = queryBuilder.neq('status', 'concluido')
    }

    if (responsavelId) {
      queryBuilder = queryBuilder.eq('usuario_responsavel_id', responsavelId)
    }

    // Aplicar paginação
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    // Executar query
    const { data: atendimentos, error: atendimentosError, count } = await queryBuilder

    if (atendimentosError) {
      console.error('API /api/atendimentos: Erro ao buscar atendimentos:', atendimentosError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar atendimentos'
      })
    }

    console.log('API /api/atendimentos: Atendimentos encontrados:', atendimentos?.length || 0)

    // Formatar dados para o frontend
    const atendimentosFormatados = atendimentos?.map(atendimento => {
      return {
        id: atendimento.id,
        contato_id: atendimento.contato_id,
        inbox_id: atendimento.inbox_id,
        name: atendimento.contatos?.nome || 'Contato',
        phone: atendimento.contatos?.telefone || '',
        email: atendimento.contatos?.email || '',
        company: atendimento.contatos?.empresa || '',
        city: atendimento.contatos?.cidade || '',
        lastMessage: atendimento.ultimo_mensagem || '',
        lastMessageTime: atendimento.ultimo_mensagem_time ? new Date(atendimento.ultimo_mensagem_time) : new Date(atendimento.created_at),
        unreadCount: atendimento.unread_count || 0,
        status: atendimento.status,
        caixa_entrada: atendimento.inbox_id,
        inbox_name: atendimento.inboxes?.name || 'Sem caixa',
        usuario_responsavel_id: atendimento.usuario_responsavel_id,
        responsavel_name: atendimento.users?.name || null,
        data_atribuicao: atendimento.data_atribuicao,
        data_conclusao: atendimento.data_conclusao,
        created_at: atendimento.created_at,
        updated_at: atendimento.updated_at,
        // Extrair tags completas do contato (com id, nome e cor)
        tags: atendimento.contatos?.contato_etiquetas
          ?.filter(ce => ce.etiquetas)
          ?.map(ce => ({
            id: ce.etiquetas.id,
            nome: ce.etiquetas.nome,
            cor: ce.etiquetas.cor
          })) || [],
        // Campo adicional para compatibilidade com frontend atual
        messages: [] // Será carregado sob demanda
      }
    }) || []

    // Calcular informações de paginação
    const totalItems = count || 0
    const totalPages = Math.ceil(totalItems / limit)
    const startItem = totalItems === 0 ? 0 : offset + 1
    const endItem = Math.min(offset + limit, totalItems)

    console.log('API /api/atendimentos: Retornando dados com sucesso')

    return {
      success: true,
      data: {
        atendimentos: atendimentosFormatados,
        counts, // Retornando os counts calculados
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

  } catch (error) {
    console.error('API /api/atendimentos: Erro no handler:', error)

    // Se já for um erro criado, retornar como está
    if (error.statusCode) {
      throw error
    }

    // Erro genérico
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
