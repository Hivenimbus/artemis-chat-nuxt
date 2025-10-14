import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)
  const kanbanId = getRouterParam(event, 'id')

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Não autorizado'
    })
  }

  if (!kanbanId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID do kanban é obrigatório'
    })
  }

  try {
    // Obter o empresa_id do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.empresa_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Verificar se o kanban existe e pertence à empresa do usuário
    const { data: kanban, error: kanbanError } = await supabase
      .from('kanbans')
      .select(`
        id,
        title,
        description,
        created_at,
        updated_at,
        criado_por,
        users (
          id,
          name,
          email
        )
      `)
      .eq('id', kanbanId)
      .eq('empresa_id', userData.empresa_id)
      .single()

    if (kanbanError || !kanban) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Kanban não encontrado'
      })
    }

    // Buscar colunas do kanban
    const { data: columns, error: columnsError } = await supabase
      .from('kanban_columns')
      .select('*')
      .eq('kanban_id', kanbanId)
      .order('position', { ascending: true })

    if (columnsError) {
      console.error('Erro ao buscar colunas:', columnsError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar colunas'
      })
    }

    // Buscar cartões do kanban
    const { data: cards, error: cardsError } = await supabase
      .from('kanban_cards')
      .select('*')
      .eq('kanban_id', kanbanId)
      .order('position', { ascending: true })

    if (cardsError) {
      console.error('Erro ao buscar cartões:', cardsError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar cartões'
      })
    }

    return {
      success: true,
      data: {
        ...kanban,
        createdAt: kanban.created_at,
        updatedAt: kanban.updated_at,
        createdBy: kanban.users,
        columns: columns || [],
        cards: cards || []
      }
    }
  } catch (error) {
    console.error('Erro no handler de kanban GET:', error)
    throw error
  }
})