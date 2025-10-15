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
    const { column_id, position } = body

    // Validação dos campos obrigatórios
    if (!column_id || position === undefined || position === null) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Campos obrigatórios: column_id, position'
      })
    }

    // Consulta otimizada com JOIN para buscar cartão, kanban e empresa em uma única query
    const { data: cardData, error: fetchError } = await supabase
      .from('kanban_cards')
      .select(`
        id,
        kanban_id,
        column_id,
        title,
        description,
        position,
        created_at,
        updated_at,
        kanbans!inner (
          id,
          empresa_id
        )
      `)
      .eq('id', cardId)
      .single()

    if (fetchError || !cardData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Cartão não encontrado'
      })
    }

    // Verificar se o usuário pertence à empresa do kanban em uma única query
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, empresa_id')
      .eq('id', user.id)
      .eq('empresa_id', cardData.kanbans.empresa_id)
      .single()

    if (userError || !userData) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Sem permissão para mover este cartão'
      })
    }

    // Mover cartão - query otimizada
    const now = new Date().toISOString()
    const { data: updatedCard, error: updateError } = await supabase
      .from('kanban_cards')
      .update({
        column_id,
        position,
        updated_at: now
      })
      .eq('id', cardId)
      .select(`
        id,
        kanban_id,
        column_id,
        title,
        description,
        position,
        created_at,
        updated_at
      `)
      .single()

    if (updateError) {
      console.error('Erro ao mover cartão:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao mover cartão'
      })
    }

    return {
      success: true,
      data: {
        ...updatedCard,
        createdAt: updatedCard.created_at,
        updatedAt: updatedCard.updated_at
      }
    }
  } catch (error) {
    console.error('Erro no handler de mover cartão:', error)
    throw error
  }
})