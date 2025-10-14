import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)
  const etiquetaId = getRouterParam(event, 'id')

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Não autorizado'
    })
  }

  if (!etiquetaId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID da etiqueta é obrigatório'
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

    // Verificar se a etiqueta existe e pertence à empresa do usuário
    const { data: existingEtiqueta, error: fetchError } = await supabase
      .from('etiquetas')
      .select('id, empresa_id, nome')
      .eq('id', etiquetaId)
      .single()

    if (fetchError || !existingEtiqueta) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Etiqueta não encontrada'
      })
    }

    if (existingEtiqueta.empresa_id !== userData.empresa_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Sem permissão para excluir esta etiqueta'
      })
    }

    // TODO: Futuramente verificar se a etiqueta está sendo usada antes de excluir
    // Por enquanto, vamos permitir a exclusão direta

    // Excluir etiqueta
    const { error } = await supabase
      .from('etiquetas')
      .delete()
      .eq('id', etiquetaId)

    if (error) {
      console.error('Erro ao excluir etiqueta:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao excluir etiqueta'
      })
    }

    return {
      success: true,
      message: `Etiqueta "${existingEtiqueta.nome}" excluída com sucesso`
    }
  } catch (error) {
    console.error('Erro no handler de etiquetas DELETE:', error)
    throw error
  }
})