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
      .eq('empresa_id', userData.empresa_id)
      .single()

    if (fetchError || !inbox) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Caixa de entrada não encontrada ou sem permissão'
      })
    }

    // Fazer logout na Evolution API
    try {
      await $fetch(`${config.evolutionApiUrl}/instance/disconnect`, {
        method: 'POST',
        headers: {
          'apikey': id // Usar o ID da instância
        },
        body: {}
      })
    } catch (evolutionError) {
      console.error('Erro ao fazer logout na Evolution API:', evolutionError)

      // Se for erro 404, a instância pode não existir mais, mas continuamos
      if (evolutionError.response?.status !== 404 && evolutionError.response?.status !== 403) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Erro ao desconectar WhatsApp. Tente novamente.'
        })
      }
    }

    // Atualizar status no Supabase (RLS já garante que só pode atualizar da própria empresa)
    const { error: updateError } = await client
      .from('inboxes')
      .update({
        status: 'disconnected',
        phone_number: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

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