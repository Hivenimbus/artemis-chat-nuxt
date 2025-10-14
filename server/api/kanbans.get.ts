import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Não autorizado'
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

    // Buscar kanbans da empresa com informações do criador
    const { data: kanbans, error } = await supabase
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
      .eq('empresa_id', userData.empresa_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar kanbans:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar kanbans'
      })
    }

    // Contar colunas e cartões para cada kanban
    const kanbansWithStats = await Promise.all(
      (kanbans || []).map(async (kanban) => {
        const [columnsCount, cardsCount] = await Promise.all([
          supabase
            .from('kanban_columns')
            .select('id', { count: 'exact' })
            .eq('kanban_id', kanban.id),
          supabase
            .from('kanban_cards')
            .select('id', { count: 'exact' })
            .eq('kanban_id', kanban.id)
        ])

        return {
          ...kanban,
          columns_count: columnsCount.count || 0,
          cards_count: cardsCount.count || 0,
          createdAt: kanban.created_at,
          updatedAt: kanban.updated_at,
          createdBy: kanban.users
        }
      })
    )

    return {
      success: true,
      data: kanbansWithStats
    }
  } catch (error) {
    console.error('Erro no handler de kanbans GET:', error)
    throw error
  }
})