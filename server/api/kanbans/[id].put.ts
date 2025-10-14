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
    const body = await readBody(event)
    const { title, description } = body

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

    // Verificar se o kanban existe e pertence à empresa do usuário
    const { data: existingKanban, error: fetchError } = await supabase
      .from('kanbans')
      .select('id, empresa_id')
      .eq('id', kanbanId)
      .single()

    if (fetchError || !existingKanban) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Kanban não encontrado'
      })
    }

    if (existingKanban.empresa_id !== userData.empresa_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Sem permissão para editar este kanban'
      })
    }

    // Atualizar kanban
    const { data: kanban, error } = await supabase
      .from('kanbans')
      .update({
        title: title.trim(),
        description: description?.trim() || null
      })
      .eq('id', kanbanId)
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
      .single()

    if (error) {
      console.error('Erro ao atualizar kanban:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao atualizar kanban'
      })
    }

    return {
      success: true,
      data: {
        ...kanban,
        createdAt: kanban.created_at,
        updatedAt: kanban.updated_at,
        createdBy: kanban.users
      }
    }
  } catch (error) {
    console.error('Erro no handler de kanbans PUT:', error)
    throw error
  }
})