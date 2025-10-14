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
    const { data: existingKanban, error: fetchError } = await supabase
      .from('kanbans')
      .select('id, empresa_id, title')
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
        statusMessage: 'Sem permissão para excluir este kanban'
      })
    }

    // Excluir kanban (em cascata excluirá colunas e cartões)
    const { error } = await supabase
      .from('kanbans')
      .delete()
      .eq('id', kanbanId)

    if (error) {
      console.error('Erro ao excluir kanban:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao excluir kanban'
      })
    }

    return {
      success: true,
      message: `Kanban "${existingKanban.title}" excluído com sucesso`
    }
  } catch (error) {
    console.error('Erro no handler de kanbans DELETE:', error)
    throw error
  }
})