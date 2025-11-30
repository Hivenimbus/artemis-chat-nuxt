import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/contatos: Iniciando requisição')

    // Obter usuário do contexto
    const user = event.context.user

    if (!user) {
      console.error('API /api/contatos: Usuário não autenticado no contexto')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    console.log('API /api/contatos: Usuário autenticado:', user.id)

    const client = serverSupabaseServiceRole(event)

    // Buscar dados completos do usuário na tabela users
    const { data: userData, error } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('API /api/contatos: Erro ao buscar dados do usuário:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar dados do usuário'
      })
    }

    if (!userData?.empresa_id) {
      console.error('API /api/contatos: Usuário não possui empresa vinculada')
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    console.log('API /api/contatos: Empresa do usuário:', userData.empresa_id)

    // Obter query parameters para busca e paginação
    const query = getQuery(event)
    const searchTerm = query.search as string || ''
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const offset = (page - 1) * limit

    // Construir query base
    let queryBuilder = client
      .from('contatos')
      .select(`
        id,
        nome,
        sobrenome,
        email,
        telefone,
        cidade,
        pais,
        biografia,
        empresa,
        endereco,
        empresa_id,
        created_at,
        updated_at,
        contato_etiquetas (
          etiqueta_id,
          etiquetas (
            id,
            nome,
            cor
          )
        )
      `, { count: 'exact' })
      .eq('empresa_id', userData.empresa_id)
      .order('created_at', { ascending: false })

    // Aplicar filtro de busca se existir
    if (searchTerm) {
      queryBuilder = queryBuilder.or(`
        nome.ilike.%${searchTerm}%,
        sobrenome.ilike.%${searchTerm}%,
        email.ilike.%${searchTerm}%,
        telefone.ilike.%${searchTerm}%,
        empresa.ilike.%${searchTerm}%,
        cidade.ilike.%${searchTerm}%
      `)
    }

    // Aplicar paginação
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    // Executar query
    const { data: contatos, error: contatosError, count } = await queryBuilder

    if (contatosError) {
      console.error('API /api/contatos: Erro ao buscar contatos:', contatosError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar contatos'
      })
    }

    console.log('API /api/contatos: Contatos encontrados:', contatos?.length || 0)

    // Formatar dados para o frontend
    const contatosFormatados = contatos?.map(contato => {
      // Extrair tags do relacionamento com informações completas (nome e cor)
      const tags = contato.contato_etiquetas
        ?.filter(ce => ce.etiquetas) // Filtrar etiquetas nulas
        ?.map(ce => ({
          name: ce.etiquetas.nome,
          color: ce.etiquetas.cor || '#6B7280' // Cor padrão caso não definida
        })) || []

      // Remover campo de relacionamento do objeto final
      const { contato_etiquetas, ...contatoLimpo } = contato

      return {
        ...contatoLimpo,
        tags,
        name: contato.nome, // Manter compatibilidade com frontend existente
        lastName: contato.sobrenome || '',
        phone: contato.telefone,
        country: contato.pais || '',
        company: contato.empresa || '',
        address: contato.endereco || '',
        city: contato.cidade || '',
        biography: contato.biografia || '',
        lastContact: contato.created_at // Usar created_at como lastContact inicial
      }
    }) || []

    // Calcular informações de paginação
    const totalItems = count || 0
    const totalPages = Math.ceil(totalItems / limit)
    const startItem = totalItems === 0 ? 0 : offset + 1
    const endItem = Math.min(offset + limit, totalItems)

    console.log('API /api/contatos: Retornando dados com sucesso')

    return {
      success: true,
      data: {
        contatos: contatosFormatados,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          startItem,
          endItem,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    }

  } catch (error) {
    console.error('API /api/contatos: Erro no handler:', error)

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