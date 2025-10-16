import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)
  const kanbanId = getRouterParam(event, 'id')

  // Validações rápidas combinadas
  if (!user || !kanbanId) {
    throw createError({
      statusCode: user ? 400 : 401,
      statusMessage: user ? 'ID do kanban é obrigatório' : 'Não autorizado'
    })
  }

  try {
    // 1. Buscar kanban de forma simples
    const { data: kanbanData, error: kanbanError } = await supabase
      .from('kanbans')
      .select('id, title, description, created_at, updated_at, empresa_id, criado_por')
      .eq('id', kanbanId)
      .single()

    if (kanbanError || !kanbanData) {
      console.error('Erro ao buscar kanban:', kanbanError)
      throw createError({
        statusCode: 404,
        statusMessage: 'Kanban não encontrado'
      })
    }

    // 2. Verificar se usuário tem permissão (mesma empresa)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, empresa_id')
      .eq('id', user.id)
      .eq('empresa_id', kanbanData.empresa_id)
      .single()

    if (userError || !userData) {
      console.error('Erro ao verificar permissão:', userError)
      throw createError({
        statusCode: 403,
        statusMessage: 'Sem permissão para acessar este kanban'
      })
    }

    // 3. Buscar dados do criador (opcional, se for o mesmo usuário)
    let createdBy = null
    if (kanbanData.criado_por) {
      const { data: creatorData } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', kanbanData.criado_por)
        .single()
      createdBy = creatorData
    }

    // Buscar colunas e cartões em paralelo para melhor performance
    const [columnsResult, cardsResult] = await Promise.all([
      supabase
        .from('kanban_columns')
        .select('id, title, icon, color, position, kanban_id, created_at, updated_at')
        .eq('kanban_id', kanbanId)
        .order('position', { ascending: true }),

      supabase
        .from('kanban_cards')
        .select('id, kanban_id, column_id, title, description, position, created_at, updated_at')
        .eq('kanban_id', kanbanId)
        .order('position', { ascending: true })
    ])

    if (columnsResult.error) {
      console.error('Erro ao buscar colunas:', columnsResult.error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar colunas'
      })
    }

    if (cardsResult.error) {
      console.error('Erro ao buscar cartões:', cardsResult.error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar cartões'
      })
    }

    // Retorno otimizado
    return {
      success: true,
      data: {
        id: kanbanData.id,
        title: kanbanData.title,
        description: kanbanData.description,
        createdAt: kanbanData.created_at,
        updatedAt: kanbanData.updated_at,
        createdBy: createdBy,
        columns: columnsResult.data || [],
        cards: cardsResult.data || []
      }
    }
  } catch (error) {
    console.error('Erro no handler de kanban GET:', error)

    // Se já for um erro definido, propagar
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