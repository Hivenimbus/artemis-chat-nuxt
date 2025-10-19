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
        instanceName: inboxData.id, // Usar o ID do Supabase como nome da instância
        integration: 'WHATSAPP-BAILEYS',
        groups_ignore: true
      }
    }).catch((error) => {
      console.error('Erro ao criar instância na Evolution API:', error)
      // Continuar mesmo se der erro na Evolution, pois o inbox já foi criado
      return null
    })

    // Se a instância foi criada com sucesso, configurar webhook e configurações padrão
    if (evolutionResponse) {
      try {
        // Configurar webhook
        await $fetch(`${config.evolutionApiUrl}/webhook/set/${inboxData.id}`, {
          method: 'POST',
          headers: {
            'apikey': config.evolutionApiKey,
            'Content-Type': 'application/json'
          },
          body: {
            webhook: {
              enabled: true,
              url: `${config.public.siteUrl}/api/webhook/whatsapp`,
              events: [
                'MESSAGES_UPSERT',
                'MESSAGES_EDITED',
                'SEND_MESSAGE_UPDATE',
                'INSTANCE_CREATE',
                'INSTANCE_DELETE',
                'STATUS_INSTANCE',
                'MESSAGES_UPDATE'
              ],
              base64: true,
              byEvents: false
            }
          }
        })

        // Configurar configurações padrão da instância
        await $fetch(`${config.evolutionApiUrl}/settings/set/${inboxData.id}`, {
          method: 'POST',
          headers: {
            'apikey': config.evolutionApiKey,
            'Content-Type': 'application/json'
          },
          body: {
            rejectCall: false,
            msgCall: "",
            groupsIgnore: true,
            alwaysOnline: false,
            readMessages: false,
            syncFullHistory: false,
            readStatus: false
          }
        })

      } catch (webhookError) {
        console.error('Erro ao configurar webhook/settings:', webhookError)
        // Não falhar completamente se o webhook não for configurado
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