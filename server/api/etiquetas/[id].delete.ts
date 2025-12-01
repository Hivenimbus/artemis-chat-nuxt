import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/etiquetas DELETE: Iniciando requisição')

    // 1. Tentar obter usuário do contexto (padrão Nuxt Supabase)
    let user = event.context.user
    console.log('API /api/etiquetas DELETE: Usuário do contexto:', user?.id)

    // 2. Se não houver usuário no contexto, tentar serverSupabaseUser
    if (!user) {
      console.log('API /api/etiquetas DELETE: Usuário não encontrado no contexto, tentando serverSupabaseUser')
      user = await serverSupabaseUser(event)
      console.log('API /api/etiquetas DELETE: Resultado serverSupabaseUser:', user?.id)
    }

    if (!user) {
      console.error('API /api/etiquetas DELETE: Usuário não autenticado (falha em ambas as tentativas)')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    console.log('API /api/etiquetas DELETE: Usuário autenticado confirmado:', user.id)

    // Inicializar cliente Supabase apenas para operações de banco
    const client = await serverSupabaseClient(event)

    // Validar se o ID é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i
    if (!uuidRegex.test(user.id)) {
      console.error('API /api/etiquetas DELETE: ID de usuário inválido:', user.id)
      throw createError({
        statusCode: 400,
        statusMessage: 'ID de usuário inválido'
      })
    }

    const etiquetaId = getRouterParam(event, 'id')

    if (!etiquetaId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID da etiqueta é obrigatório'
      })
    }

    // Buscar dados completos do usuário na tabela users (mesmo padrão da API GET)
    console.log('API /api/etiquetas DELETE: Buscando dados na tabela users para ID:', user.id)
    const { data: userData, error } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('API /api/etiquetas DELETE: Erro ao buscar dados do usuário no banco:', {
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

    console.log('API /api/etiquetas DELETE: Dados encontrados com sucesso:', {
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      empresa_id: userData.empresa_id
    })

    if (!userData?.empresa_id) {
      console.error('API /api/etiquetas DELETE: Usuário não possui empresa vinculada:', {
        userId: userData.id,
        userData: userData
      })
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    console.log('API /api/etiquetas DELETE: Dados do usuário validados:', {
      userId: userData.id,
      empresaId: userData.empresa_id,
      role: userData.role
    })

    // Verificar se a etiqueta existe e pertence à empresa do usuário
    console.log('API /api/etiquetas DELETE: Verificando existência da etiqueta:', etiquetaId)
    const { data: existingEtiqueta, error: fetchError } = await client
      .from('etiquetas')
      .select('id, empresa_id, nome')
      .eq('id', etiquetaId)
      .single()

    if (fetchError || !existingEtiqueta) {
      console.error('API /api/etiquetas DELETE: Etiqueta não encontrada:', { etiquetaId, error: fetchError })
      throw createError({
        statusCode: 404,
        statusMessage: 'Etiqueta não encontrada'
      })
    }

    if (existingEtiqueta.empresa_id !== userData.empresa_id) {
      console.error('API /api/etiquetas DELETE: Permissão negada:', {
        etiquetaId,
        etiquetaEmpresa: existingEtiqueta.empresa_id,
        userEmpresa: userData.empresa_id
      })
      throw createError({
        statusCode: 403,
        statusMessage: 'Sem permissão para excluir esta etiqueta'
      })
    }

    // TODO: Futuramente verificar se a etiqueta está sendo usada antes de excluir
    // Por enquanto, vamos permitir a exclusão direta

    // Excluir etiqueta
    console.log('API /api/etiquetas DELETE: Excluindo etiqueta:', existingEtiqueta.nome)
    const { error: deleteError } = await client
      .from('etiquetas')
      .delete()
      .eq('id', etiquetaId)

    if (deleteError) {
      console.error('API /api/etiquetas DELETE: Erro ao excluir etiqueta:', deleteError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao excluir etiqueta'
      })
    }

    console.log('API /api/etiquetas DELETE: Etiqueta excluída com sucesso:', etiquetaId)

    console.log('API /api/etiquetas DELETE: Retornando resposta com sucesso')
    return {
      success: true,
      message: `Etiqueta "${existingEtiqueta.nome}" excluída com sucesso`
    }

  } catch (error) {
    console.error('API /api/etiquetas DELETE: Erro no handler:', {
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