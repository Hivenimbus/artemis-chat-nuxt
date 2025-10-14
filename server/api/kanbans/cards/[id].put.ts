import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)
  const cardId = getRouterParam(event, 'id')

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Não autorizado'
    })
  }

  if (!cardId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID do cartão é obrigatório'
    })
  }

  try {
    const body = await readBody(event)
    const { title, description, column_id } = body

    // Validação dos campos obrigatórios
    if (!title || !title.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'O título é obrigatório'
      })
    }

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

    // Verificar se o cartão existe e pertence a um kanban da empresa
    const { data: existingCard, error: fetchError } = await supabase
      .from('kanban_cards')
      .select(`
        id,
        kanban_id,
        column_id,
        title,
        description,
        position,
        is_urgent,
        created_at,
        updated_at
      `)
      .eq('id', cardId)
      .single()

    if (fetchError || !existingCard) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Cartão não encontrado'
      })
    }

    // Verificar se o kanban pertence à empresa do usuário
    const { data: kanban, error: kanbanError } = await supabase
      .from('kanbans')
      .select('id')
      .eq('id', existingCard.kanban_id)
      .eq('empresa_id', userData.empresa_id)
      .single()

    if (kanbanError || !kanban) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Sem permissão para editar este cartão'
      })
    }

    // Atualizar cartão
    const { data: card, error } = await supabase
      .from('kanban_cards')
      .update({
        title: title.trim(),
        description: description?.trim() || null,
        column_id: column_id || existingCard.column_id
      })
      .eq('id', cardId)
      .select('*')
      .single()

    if (error) {
      console.error('Erro ao atualizar cartão:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao atualizar cartão'
      })
    }

    return {
      success: true,
      data: {
        ...card,
        createdAt: card.created_at,
        updatedAt: card.updated_at
      }
    }
  } catch (error) {
    console.error('Erro no handler de cartões PUT:', error)
    throw error
  }
})