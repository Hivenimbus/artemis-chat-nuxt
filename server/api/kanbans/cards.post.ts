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
    const body = await readBody(event)
    const { kanban_id, column_id, title, description, position, is_urgent } = body

    // Validação dos campos obrigatórios
    if (!kanban_id || !column_id || !title || !title.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Campos obrigatórios: kanban_id, column_id, title'
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

    // Verificar se o kanban pertence à empresa do usuário
    const { data: kanban, error: kanbanError } = await supabase
      .from('kanbans')
      .select('id')
      .eq('id', kanban_id)
      .eq('empresa_id', userData.empresa_id)
      .single()

    if (kanbanError || !kanban) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Sem permissão para adicionar cartões a este kanban'
      })
    }

    // Criar novo cartão
    const { data: card, error } = await supabase
      .from('kanban_cards')
      .insert({
        kanban_id,
        column_id,
        title: title.trim(),
        description: description?.trim() || null,
        position: position || 0,
        is_urgent: is_urgent || false
      })
      .select('*')
      .single()

    if (error) {
      console.error('Erro ao criar cartão:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao criar cartão'
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
    console.error('Erro no handler de cartões POST:', error)
    throw error
  }
})