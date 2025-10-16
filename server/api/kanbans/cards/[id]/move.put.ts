import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)
  const cardId = getRouterParam(event, 'id')

  // Validações rápidas
  if (!user || !cardId) {
    throw createError({
      statusCode: user ? 400 : 401,
      statusMessage: user ? 'ID do cartão é obrigatório' : 'Não autorizado'
    })
  }

  try {
    const body = await readBody(event)
    const { column_id, position } = body

    // Validação rápida dos campos obrigatórios
    if (column_id === undefined || position === undefined || position === null) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Campos obrigatórios: column_id, position'
      })
    }

    // QUERY COMBINADA para performance máxima - uma única chamada
    const { data: cardWithPermission, error: fetchError } = await supabase
      .from('kanban_cards')
      .select(`
        id,
        kanban_id,
        column_id,
        position,
        kanbans!inner(
          id,
          empresa_id,
          users!inner(
            id,
            empresa_id
          )
        )
      `)
      .eq('id', cardId)
      .eq('kanbans.users.id', user.id)
      .single()

    if (fetchError || !cardWithPermission) {
      console.error('Erro ao buscar cartão ou verificar permissão:', fetchError)
      throw createError({
        statusCode: fetchError?.code === 'PGRST116' ? 404 : 403,
        statusMessage: fetchError?.code === 'PGRST116' ? 'Cartão não encontrado' : 'Sem permissão para mover este cartão'
      })
    }

    // UPDATE OTIMIZADO - sem select para máxima performance
    const { error: updateError } = await supabase
      .from('kanban_cards')
      .update({
        column_id,
        position,
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)

    if (updateError) {
      console.error('Erro ao mover cartão:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao mover cartão'
      })
    }

    // Retorno mínimo para máxima performance
    return {
      success: true,
      data: {
        id: cardId,
        column_id,
        position,
        updated_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Erro no handler de mover cartão:', error)

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