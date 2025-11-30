import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/user: Iniciando requisição')

    // Obter usuário do contexto (injetado pelo middleware 01-auth-check)
    const user = event.context.user

    if (!user) {
      console.error('API /api/user: Usuário não autenticado no contexto')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    console.log('API /api/user: Usuário autenticado:', user.id)

    // Validar se o ID é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i
    if (!uuidRegex.test(user.id)) {
      console.error('API /api/user: ID de usuário inválido:', user.id)
      throw createError({
        statusCode: 400,
        statusMessage: 'ID de usuário inválido'
      })
    }

    // Usar Service Role para buscar dados, já que não estamos usando Supabase Auth
    const client = serverSupabaseServiceRole(event)

    // Buscar dados completos do usuário na tabela users
    console.log('API /api/user: Buscando dados na tabela users para ID:', user.id)
    const { data: userData, error } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('API /api/user: Erro ao buscar dados do usuário no banco:', {
        error: error,
        userId: user.id,
        code: error.code,
        message: error.message,
        details: error.details
      })
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar dados do usuário'
      })
    }

    console.log('API /api/user: Dados encontrados com sucesso:', {
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      empresa_id: userData.empresa_id
    })

    return {
      success: true,
      data: userData
    }

  } catch (error) {
    console.error('API /api/user: Erro no handler:', {
      error: error,
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      stack: error.stack
    })

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
