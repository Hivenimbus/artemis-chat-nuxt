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

    // Buscar inboxes do usuário
    const { data: inboxes, error } = await client
      .from('inboxes')
      .select('*')
      .eq('user_id', user.id)
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