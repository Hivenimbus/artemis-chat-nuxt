import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/etiquetas POST: Iniciando requisição')

    // 1. Tentar obter usuário do contexto (padrão Nuxt Supabase)
    let user = event.context.user
    console.log('API /api/etiquetas POST: Usuário do contexto:', user?.id)

    // 2. Se não houver usuário no contexto, tentar serverSupabaseUser
    if (!user) {
      console.log('API /api/etiquetas POST: Usuário não encontrado no contexto, tentando serverSupabaseUser')
      user = await serverSupabaseUser(event)
      console.log('API /api/etiquetas POST: Resultado serverSupabaseUser:', user?.id)
    }

    if (!user) {
      console.error('API /api/etiquetas POST: Usuário não autenticado (falha em ambas as tentativas)')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    console.log('API /api/etiquetas POST: Usuário autenticado confirmado:', user.id)

    // Inicializar cliente Supabase apenas para operações de banco
    const client = await serverSupabaseClient(event)

    // Validar se o ID é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i
    if (!uuidRegex.test(user.id)) {
      console.error('API /api/etiquetas POST: ID de usuário inválido:', user.id)
      throw createError({
        statusCode: 400,
        statusMessage: 'ID de usuário inválido'
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
    console.log('API /api/etiquetas POST: Buscando dados na tabela users para ID:', user.id)
    const { data: userData, error } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('API /api/etiquetas POST: Erro ao buscar dados do usuário no banco:', {
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

    console.log('API /api/etiquetas POST: Dados encontrados com sucesso:', {
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      empresa_id: userData.empresa_id
    })

    if (!userData?.empresa_id) {
      console.error('API /api/etiquetas POST: Usuário não possui empresa vinculada:', {
        userId: userData.id,
        userData: userData
      })
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    console.log('API /api/etiquetas POST: Dados do usuário validados:', {
      userId: userData.id,
      empresaId: userData.empresa_id,
      role: userData.role
    })

    // Verificar se já existe uma etiqueta com o mesmo nome na empresa
    console.log('API /api/etiquetas POST: Verificando etiqueta duplicada:', nome.trim())
    const { data: existingEtiqueta, error: duplicateError } = await client
      .from('etiquetas')
      .select('id')
      .eq('empresa_id', userData.empresa_id)
      .eq('nome', nome.trim())
      .single()

    if (duplicateError && duplicateError.code !== 'PGRST116') {
      console.error('API /api/etiquetas POST: Erro ao verificar duplicata:', duplicateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao verificar etiqueta existente'
      })
    }

    if (existingEtiqueta) {
      console.error('API /api/etiquetas POST: Etiqueta duplicada encontrada:', existingEtiqueta.id)
      throw createError({
        statusCode: 400,
        statusMessage: 'Já existe uma etiqueta com este nome'
      })
    }

    // Criar nova etiqueta
    console.log('API /api/etiquetas POST: Criando nova etiqueta:', {
      nome: nome.trim(),
      empresaId: userData.empresa_id
    })
    const { data: etiqueta, error: insertError } = await client
      .from('etiquetas')
      .insert({
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        cor: cor.toUpperCase(),
        empresa_id: userData.empresa_id
      })
      .select(`
        id,
        nome,
        descricao,
        cor,
        created_at,
        updated_at
      `)
      .single()

    if (insertError) {
      console.error('API /api/etiquetas POST: Erro ao criar etiqueta:', insertError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao criar etiqueta: ' + insertError.message
      })
    }

    console.log('API /api/etiquetas POST: Etiqueta criada com sucesso:', etiqueta.id)

    console.log('API /api/etiquetas POST: Retornando dados com sucesso')
    return {
      success: true,
      data: {
        ...etiqueta,
        usageCount: 0,
        createdAt: etiqueta.created_at,
        updatedAt: etiqueta.updated_at
      }
    }

  } catch (error) {
    console.error('API /api/etiquetas POST: Erro no handler:', {
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