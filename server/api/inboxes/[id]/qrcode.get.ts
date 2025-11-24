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