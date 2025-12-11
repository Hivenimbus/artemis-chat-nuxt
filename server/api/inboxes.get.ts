import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    // Obter usuário do contexto
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    const client = serverSupabaseServiceRole(event)

    // Buscar empresa do usuário
    const { data: userData, error: userDataError } = await client
      .from('users')
      .select('empresa_id, role')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData?.empresa_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não possui empresa vinculada'
      })
    }

    // Buscar inboxes
    let query = client
      .from('inboxes')
      .select('*')
      .eq('empresa_id', userData.empresa_id)
      .order('created_at', { ascending: false })

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
      const allAllowedInboxIds = [...new Set([...directIds, ...teamInboxIds])]
      
      // Se não tiver nenhuma atribuída, retornar array vazio
      if (allAllowedInboxIds.length === 0) {
        return {
          success: true,
          data: []
        }
      }

      query = query.in('id', allAllowedInboxIds)
    }

    const { data: inboxes, error } = await query

    if (error) {
      console.error('Erro ao buscar inboxes:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar caixas de entrada'
      })
    }

    return {
      success: true,
      data: inboxes || []
    }

  } catch (error) {
    console.error('Erro no handler de listagem de inboxes:', error)

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