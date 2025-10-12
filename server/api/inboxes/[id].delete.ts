import { serverSupabaseClient } from '#supabase/server'

const config = useRuntimeConfig()

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID da caixa de entrada é obrigatório'
      })
    }

    // Obter usuário autenticado
    const client = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await client.auth.getUser()

    if (userError || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    // Verificar se o inbox pertence ao usuário
    const { data: inbox, error: fetchError } = await client
      .from('inboxes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !inbox) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Caixa de entrada não encontrada'
      })
    }

    // Deletar instância na Evolution API (se existir)
    try {
      await $fetch(`${config.evolutionApiUrl}/instance/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': config.evolutionApiKey
        }
      })
    } catch (evolutionError) {
      console.error('Erro ao deletar instância na Evolution API:', evolutionError)
      // Continuar mesmo se der erro na Evolution
    }

    // Deletar inbox do Supabase
    const { error: deleteError } = await client
      .from('inboxes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Erro ao deletar inbox:', deleteError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao deletar caixa de entrada'
      })
    }

    return {
      success: true,
      message: 'Caixa de entrada deletada com sucesso'
    }

  } catch (error) {
    console.error('Erro no handler de deleção de inbox:', error)

    // Se já for um erro criado, retornar como está
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