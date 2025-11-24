import { serverSupabaseClient } from '#supabase/server'

const config = useRuntimeConfig()

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { name, description } = body

    // Validação dos campos obrigatórios
    if (!name?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'O nome da caixa de entrada é obrigatório'
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

    // Buscar empresa do usuário
    const { data: userData, error: userDataError } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData?.empresa_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não possui empresa vinculada'
      })
    }

    // Criar inbox no Supabase vinculando apenas à empresa
    const { data: inboxData, error: inboxError } = await client
      .from('inboxes')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        empresa_id: userData.empresa_id,
        status: 'disconnected'
      })
      .select()
      .single()

    if (inboxError) {
      console.error('Erro ao criar inbox:', inboxError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao criar caixa de entrada no banco de dados'
      })
    }

    // Criar instância na Evolution API
    const evolutionResponse = await $fetch(`${config.evolutionApiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'apikey': config.evolutionApiKey,
        'Content-Type': 'application/json'
      },
      body: {
        name: inboxData.id,
        token: inboxData.id,
        webhook: `${config.public.siteUrl}/api/webhook/whatsapp`,
        webhookEvents: [
          'messages.upsert',
          'messages.update',
          'messages.delete',
          'send.message',
          'connection.update'
        ]
      }
    }).catch((error) => {
      console.error('Erro ao criar instância na Evolution API:', error)
      // Continuar mesmo se der erro na Evolution, pois o inbox já foi criado
      return null
    })

    // Se a instância foi criada com sucesso, configurar configurações padrão
    if (evolutionResponse) {
      try {
        // Configurar configurações padrão da instância
        await $fetch(`${config.evolutionApiUrl}/instance/${inboxData.id}/advanced-settings`, {
          method: 'PUT',
          headers: {
            'apikey': config.evolutionApiKey,
            'Content-Type': 'application/json'
          },
          body: {
            rejectCall: false,
            msgCall: "Por favor, envie mensagem",
            groupsIgnore: true,
            alwaysOnline: true,
            readMessages: true,
            syncFullHistory: false,
            readStatus: true
          }
        })

      } catch (webhookError) {
        console.error('Erro ao configurar settings:', webhookError)
        // Não falhar completamente
      }
    }

    return {
      success: true,
      data: {
        ...inboxData,
        evolutionCreated: !!evolutionResponse
      }
    }

  } catch (error) {
    console.error('Erro no handler de criação de inbox:', error)

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