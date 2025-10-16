import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/etiquetas PUT: Iniciando requisição')

    // Obter usuário autenticado
    const client = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await client.auth.getUser()

    if (userError || !user) {
      console.error('API /api/etiquetas PUT: Erro de autenticação:', userError)
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    console.log('API /api/etiquetas PUT: Usuário autenticado:', user.id)

    // Validar se o ID é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i
    if (!uuidRegex.test(user.id)) {
      console.error('API /api/etiquetas PUT: ID de usuário inválido:', user.id)
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

    const body = await readBody(event)
    const { nome, descricao, cor } = body

    // Validação dos campos obrigatórios
    if (!nome || !cor) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nome e cor são obrigatórios'
      })
    }

    // Validação do formato da cor
    if (!/^#[0-9A-Fa-f]{6}$/.test(cor)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cor deve estar em formato hexadecimal válido (ex: #FF0000)'
      })
    }

    // Buscar dados completos do usuário na tabela users (mesmo padrão da API GET)
    console.log('API /api/etiquetas PUT: Buscando dados na tabela users para ID:', user.id)
    const { data: userData, error } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('API /api/etiquetas PUT: Erro ao buscar dados do usuário no banco:', {
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

    console.log('API /api/etiquetas PUT: Dados encontrados com sucesso:', {
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      empresa_id: userData.empresa_id
    })

    if (!userData?.empresa_id) {
      console.error('API /api/etiquetas PUT: Usuário não possui empresa vinculada:', {
        userId: userData.id,
        userData: userData
      })
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    console.log('API /api/etiquetas PUT: Dados do usuário validados:', {
      userId: userData.id,
      empresaId: userData.empresa_id,
      role: userData.role
    })

    // Verificar se a etiqueta existe e pertence à empresa do usuário
    console.log('API /api/etiquetas PUT: Verificando existência da etiqueta:', etiquetaId)
    const { data: existingEtiqueta, error: fetchError } = await client
      .from('etiquetas')
      .select('id, empresa_id')
      .eq('id', etiquetaId)
      .single()

    if (fetchError || !existingEtiqueta) {
      console.error('API /api/etiquetas PUT: Etiqueta não encontrada:', { etiquetaId, error: fetchError })
      throw createError({
        statusCode: 404,
        statusMessage: 'Etiqueta não encontrada'
      })
    }

    if (existingEtiqueta.empresa_id !== userData.empresa_id) {
      console.error('API /api/etiquetas PUT: Permissão negada:', {
        etiquetaId,
        etiquetaEmpresa: existingEtiqueta.empresa_id,
        userEmpresa: userData.empresa_id
      })
      throw createError({
        statusCode: 403,
        statusMessage: 'Sem permissão para editar esta etiqueta'
      })
    }

    // Verificar se já existe outra etiqueta com o mesmo nome na empresa
    if (nome) {
      console.log('API /api/etiquetas PUT: Verificando duplicata:', nome.trim())
      const { data: duplicateEtiqueta, error: duplicateError } = await client
        .from('etiquetas')
        .select('id')
        .eq('empresa_id', userData.empresa_id)
        .eq('nome', nome.trim())
        .neq('id', etiquetaId)
        .single()

      if (duplicateError && duplicateError.code !== 'PGRST116') {
        console.error('API /api/etiquetas PUT: Erro ao verificar duplicata:', duplicateError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Erro ao verificar etiqueta existente'
        })
      }

      if (duplicateEtiqueta) {
        console.error('API /api/etiquetas PUT: Etiqueta duplicada encontrada:', duplicateEtiqueta.id)
        throw createError({
          statusCode: 400,
          statusMessage: 'Já existe outra etiqueta com este nome'
        })
      }
    }

    // Atualizar etiqueta
    console.log('API /api/etiquetas PUT: Atualizando etiqueta:', etiquetaId)
    const { data: etiqueta, error: updateError } = await client
      .from('etiquetas')
      .update({
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        cor: cor.toUpperCase()
      })
      .eq('id', etiquetaId)
      .select(`
        id,
        nome,
        descricao,
        cor,
        created_at,
        updated_at,
        criado_por,
        users (
          id,
          name,
          email
        )
      `)
      .single()

    if (updateError) {
      console.error('API /api/etiquetas PUT: Erro ao atualizar etiqueta:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao atualizar etiqueta'
      })
    }

    console.log('API /api/etiquetas PUT: Etiqueta atualizada com sucesso:', etiqueta.id)

    console.log('API /api/etiquetas PUT: Retornando dados com sucesso')
    return {
      success: true,
      data: {
        ...etiqueta,
        usageCount: 0, // Placeholder - implementar contagem real futuramente
        createdAt: etiqueta.created_at,
        updatedAt: etiqueta.updated_at,
        createdBy: etiqueta.users
      }
    }

  } catch (error) {
    console.error('API /api/etiquetas PUT: Erro no handler:', {
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