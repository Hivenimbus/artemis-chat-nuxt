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

    // Buscar QR Code na Evolution API
    try {
      const response = await $fetch(`${config.evolutionApiUrl}/instance/connect/${id}`, {
        method: 'GET',
        headers: {
          'apikey': config.evolutionApiKey
        }
      })

      return {
        success: true,
        data: {
          base64: response.base64,
          code: response.code,
          pairingCode: response.pairingCode
        }
      }

    } catch (evolutionError) {
      console.error('Erro ao buscar QR Code na Evolution API:', evolutionError)

      // Verificar se é erro 404 ou similar (instância não encontrada)
      if (evolutionError.response?.status === 404) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Instância não encontrada na Evolution API'
        })
      }

      // Outros erros
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar QR Code. Tente novamente em instantes.'
      })
    }

  } catch (error) {
    console.error('Erro no handler de QR Code:', error)

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