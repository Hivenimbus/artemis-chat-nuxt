import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/etiquetas: Iniciando requisição')

    // Obter usuário do contexto
    const user = event.context.user

    if (!user) {
      console.error('API /api/etiquetas: Usuário não autenticado no contexto')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    console.log('API /api/etiquetas: Usuário autenticado:', user.id)

    const client = serverSupabaseServiceRole(event)

    // Validar se o ID é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i
    if (!uuidRegex.test(user.id)) {
      console.error('API /api/etiquetas: ID de usuário inválido:', user.id)
      throw createError({
        statusCode: 400,
        statusMessage: 'ID de usuário inválido'
      })
    }

    // Buscar dados completos do usuário na tabela users (mesmo padrão da API /api/user)
    console.log('API /api/etiquetas: Buscando dados na tabela users para ID:', user.id)
    const { data: userData, error } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('API /api/etiquetas: Erro ao buscar dados do usuário no banco:', {
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

    console.log('API /api/etiquetas: Dados encontrados com sucesso:', {
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      empresa_id: userData.empresa_id
    })

    if (!userData?.empresa_id) {
      console.error('API /api/etiquetas: Usuário não possui empresa vinculada:', {
        userId: userData.id,
        userData: userData
      })
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    console.log('API /api/etiquetas: Dados do usuário validados:', {
      userId: userData.id,
      empresaId: userData.empresa_id,
      role: userData.role
    })

    // Buscar etiquetas da empresa com informações do criador
    console.log('API /api/etiquetas: Buscando etiquetas da empresa:', userData.empresa_id)
    const { data: etiquetas, error: etiquetasError } = await client
      .from('etiquetas')
      .select(`
        id,
        nome,
        descricao,
        cor,
        created_at,
        updated_at
      `)
      .eq('empresa_id', userData.empresa_id)
      .order('created_at', { ascending: false })

    if (etiquetasError) {
      console.error('API /api/etiquetas: Erro ao buscar etiquetas:', {
        error: etiquetasError,
        empresaId: userData.empresa_id,
        code: etiquetasError.code,
        message: etiquetasError.message
      })
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar etiquetas'
      })
    }

    console.log('API /api/etiquetas: Etiquetas encontradas:', etiquetas?.length || 0)

    // Calcular usage count (placeholder - futuro: implementar contagem real)
    const etiquetasWithCount = etiquetas?.map(etiqueta => ({
      ...etiqueta,
      usageCount: 0, // Placeholder - implementar contagem real futuramente
      createdAt: etiqueta.created_at,
      updatedAt: etiqueta.updated_at
    })) || []

    console.log('API /api/etiquetas: Retornando dados com sucesso')
    return {
      success: true,
      data: etiquetasWithCount
    }

  } catch (error) {
    console.error('API /api/etiquetas: Erro no handler:', {
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