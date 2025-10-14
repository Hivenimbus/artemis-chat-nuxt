import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
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

    // Buscar inboxes da empresa do usuário
    const { data: inboxes, error } = await client
      .from('inboxes')
      .select('*')
      .eq('empresa_id', userData.empresa_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar inboxes:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar caixas de entrada'
      })
    }

    return {
      success: true,
      data: inboxes || []
    }

  } catch (error) {
    console.error('Erro no handler de listagem de inboxes:', error)

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