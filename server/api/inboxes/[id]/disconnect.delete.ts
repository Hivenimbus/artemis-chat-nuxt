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

    // Fazer logout na Evolution API
    try {
      await $fetch(`${config.evolutionApiUrl}/instance/logout/${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': config.evolutionApiKey
        }
      })
    } catch (evolutionError) {
      console.error('Erro ao fazer logout na Evolution API:', evolutionError)

      // Se for erro 404, a instância pode não existir mais, mas continuamos
      if (evolutionError.response?.status !== 404) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Erro ao desconectar WhatsApp. Tente novamente.'
        })
      }
    }

    // Atualizar status no Supabase
    const { error: updateError } = await client
      .from('inboxes')
      .update({
        status: 'disconnected',
        phone_number: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Erro ao atualizar status no Supabase:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao atualizar status da caixa de entrada'
      })
    }

    return {
      success: true,
      message: 'WhatsApp desconectado com sucesso'
    }

  } catch (error) {
    console.error('Erro no handler de desconexão:', error)

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