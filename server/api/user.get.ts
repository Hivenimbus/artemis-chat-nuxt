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

    // Buscar dados completos do usuário na tabela users
    const { data: userData, error } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Erro ao buscar dados do usuário:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar dados do usuário'
      })
    }

    return {
      success: true,
      data: userData
    }

  } catch (error) {
    console.error('Erro no handler de dados do usuário:', error)

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