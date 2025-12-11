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

    // Tentar conectar e configurar webhook antes de buscar QR Code
    // Isso é necessário pois agora a configuração do webhook é feita no endpoint /connect
    try {
      console.log(`🔌 Iniciando conexão da instância ${id}...`)
      await $fetch(`${config.evolutionApiUrl}/instance/connect`, {
        method: 'POST',
        headers: {
          'apikey': id, // Usar o ID da instância como token
          'Content-Type': 'application/json'
        },
        body: {
          webhookUrl: `${config.public.siteUrl}/api/webhook/whatsapp`,
          subscribe: [
            'messages.upsert',
            'messages.update',
            'messages.delete',
            'send.message',
            'connection.update'
          ]
        }
      })
      console.log(`✅ Conexão iniciada e webhook configurado para instância ${id}`)
    } catch (connectError: any) {
      // Se der erro de "already connected" ou similar, apenas logamos e continuamos para buscar o QR
      // Se a instância não existir, vai falhar no próximo passo (busca do QR)
      console.warn('⚠️ Aviso ao iniciar conexão (pode já estar conectado):', connectError.message)
    }

    // Buscar QR Code na Evolution API
    try {
      const response: any = await $fetch(`${config.evolutionApiUrl}/instance/qr`, {
        method: 'GET',
        headers: {
          'apikey': id // Usar o ID da instância
        }
      })

      const qrData = response.data || response

      return {
        success: true,
        data: {
          base64: qrData?.Qrcode, // Corrigido: Qrcode em maiúsculo
          code: qrData?.Code,     // Corrigido: Code em maiúsculo
          pairingCode: qrData?.pairingCode
        }
      }

    } catch (evolutionError: any) {
      console.error('Erro ao buscar QR Code na Evolution API:', evolutionError)

      // Verificar se é erro 404 ou similar (instância não encontrada)
      if (evolutionError.response?.status === 404 || evolutionError.response?.status === 403) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Instância não encontrada ou não autorizada na Evolution API'
        })
      }

      // Outros erros
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar QR Code. Tente novamente em instantes.'
      })
    }

  } catch (error: any) {
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
