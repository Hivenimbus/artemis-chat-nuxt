import { serverSupabaseServiceRole } from '#supabase/server'

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

    // Obter usuário do contexto (definido no middleware 01-auth-check.ts)
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    // Usar Service Role para bypass no RLS e autenticação customizada
    const client = serverSupabaseServiceRole(event)

    // Buscar dados do usuário para obter empresa_id e verificar permissões
    const { data: userData, error: userDataError } = await client
      .from('users')
      .select('empresa_id, role')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData?.empresa_id) {
       console.error('Erro ao buscar dados do usuário:', userDataError)
      throw createError({
        statusCode: 403,
        statusMessage: 'Erro ao verificar permissões do usuário'
      })
    }

    // Verificar se o inbox existe e pertence à empresa do usuário
    const { data: inbox, error: fetchError } = await client
      .from('inboxes')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', userData.empresa_id) // Garantir que pertence à mesma empresa
      .single()

    if (fetchError || !inbox) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Caixa de entrada não encontrada ou sem permissão'
      })
    }

    // Buscar status da conexão na Evolution API
    try {
      // Usar endpoint connectionState que é mais confiável e padrão na v2
      // Endpoint: /instance/connectionState/:instance
      const response: any = await $fetch(`${config.evolutionApiUrl}/instance/connectionState/${id}`, {
        method: 'GET',
        headers: {
          'apikey': config.evolutionApiKey || id // Preferir API Key global
        }
      })

      // O endpoint connectionState retorna algo como:
      // { "instance": { "state": "open", "statusReason": 200 } }
      const instanceData = response.instance || response.data || response || {}
      
      const state = instanceData.state || 'closed'
      const isConnected = state === 'open'
      
      // Nome da instância
      const name = instanceData.instanceName || id

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
      // Se desconectou (e estava conectado), atualizar no Supabase
      else if (!isConnected && inbox.status === 'connected') {
        try {
          await client
            .from('inboxes')
            .update({
              status: 'disconnected',
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
        } catch (updateError) {
          console.error('Erro ao atualizar status (disconnected) no Supabase:', updateError)
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

    } catch (evolutionError: any) {
      console.error('Erro ao buscar status na Evolution API:', evolutionError)

      // Se a instância não for encontrada, considera desconectado
      if (evolutionError.response?.status === 404 || evolutionError.response?.status === 403) {
        
        // Se estava marcado como conectado no banco, atualizar para desconectado
        if (inbox.status === 'connected') {
            try {
              await client
                .from('inboxes')
                .update({
                  status: 'disconnected',
                  updated_at: new Date().toISOString()
                })
                .eq('id', id)
            } catch (updateError) {
              console.error('Erro ao atualizar status (not_found) no Supabase:', updateError)
            }
        }

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
        statusMessage: 'Erro ao verificar status da conexão: ' + (evolutionError.message || 'Erro desconhecido')
      })
    }

  } catch (error: any) {
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
