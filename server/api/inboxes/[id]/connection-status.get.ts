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

    // Verificar se o inbox existe e pertence à empresa do usuário (RLS já faz essa verificação)
    const { data: inbox, error: fetchError } = await client
      .from('inboxes')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !inbox) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Caixa de entrada não encontrada ou sem permissão'
      })
    }

    // Buscar status da conexão na Evolution API
    try {
      const response = await $fetch(`${config.evolutionApiUrl}/instance/status`, {
        method: 'GET',
        headers: {
          'apikey': id // Usar o ID da instância
        }
      })

      // Mapear resposta do novo endpoint (PascalCase)
      // Connected: true, LoggedIn: true -> Conectado
      const instanceData = response.data || {}
      
      // Suporte a ambos formatos (camelCase antigo e PascalCase novo)
      const connected = instanceData.Connected === true || instanceData.connected === true
      const loggedIn = instanceData.LoggedIn === true || instanceData.loggedIn === true
      const name = instanceData.Name || instanceData.name

      const isConnected = connected && loggedIn
      const state = isConnected ? 'open' : (connected ? 'connecting' : 'closed')

      // Se conectou, atualizar no Supabase
      if (isConnected && inbox.status !== 'connected') {
        try {
          await client
            .from('inboxes')
            .update({
              status: 'connected',
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
        } catch (updateError) {
          console.error('Erro ao atualizar status no Supabase:', updateError)
          // Não falhar, apenas logar o erro
        }
      }

      return {
        success: true,
        data: {
          state: state,
          connected: isConnected,
          instanceName: name
        }
      }

    } catch (evolutionError) {
      console.error('Erro ao buscar status na Evolution API:', evolutionError)

      // Se a instância não for encontrada, considera desconectado
      if (evolutionError.response?.status === 404 || evolutionError.response?.status === 403) {
        return {
          success: true,
          data: {
            state: 'not_found',
            connected: false,
            instanceName: null
          }
        }
      }

      // Outros erros
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao verificar status da conexão'
      })
    }

  } catch (error) {
    console.error('Erro no handler de status de conexão:', error)

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
