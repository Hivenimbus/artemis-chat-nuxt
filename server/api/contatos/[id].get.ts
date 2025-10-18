import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/contatos/[id] (GET): Iniciando requisição')

    // Obter ID do contato dos parâmetros da rota
    const contatoId = getRouterParam(event, 'id')

    if (!contatoId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do contato não fornecido'
      })
    }

    // Validar formato do UUID
    const uuidRegex = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i
    if (!uuidRegex.test(contatoId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do contato inválido'
      })
    }

    console.log('API /api/contatos/[id] (GET): Buscando contato:', contatoId)

    // Obter usuário autenticado
    const client = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await client.auth.getUser()

    if (userError || !user) {
      console.error('API /api/contatos/[id] (GET): Erro de autenticação:', userError)
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
      console.error('API /api/contatos/[id] (GET): Erro ao buscar dados do usuário:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar dados do usuário'
      })
    }

    if (!userData?.empresa_id) {
      console.error('API /api/contatos/[id] (GET): Usuário não possui empresa vinculada')
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Buscar contato completo com etiquetas
    const { data: contato, error: contatoError } = await client
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
      `)
      .eq('id', contatoId)
      .eq('empresa_id', userData.empresa_id) // Garantir que o contato pertence à empresa do usuário
      .single()

    if (contatoError) {
      console.error('API /api/contatos/[id] (GET): Erro ao buscar contato:', contatoError)

      // Verificar se é erro de "não encontrado"
      if (contatoError.code === 'PGRST116') {
        throw createError({
          statusCode: 404,
          statusMessage: 'Contato não encontrado'
        })
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar contato'
      })
    }

    if (!contato) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Contato não encontrado'
      })
    }

    console.log('API /api/contatos/[id] (GET): Contato encontrado:', contato.id)

    // Formatar dados para o frontend
    const contatoFormatado = {
      ...contato,
      tags: contato.contato_etiquetas
        ?.filter(ce => ce.etiquetas)
        ?.map(ce => ce.etiquetas.nome) || [],
      name: contato.nome,
      lastName: contato.sobrenome || '',
      phone: contato.telefone,
      country: contato.pais || '',
      company: contato.empresa || '',
      address: contato.endereco || '',
      city: contato.cidade || '',
      biography: contato.biografia || '',
      lastContact: contato.created_at
    }

    console.log('API /api/contatos/[id] (GET): Retornando contato com sucesso')

    return {
      success: true,
      data: contatoFormatado
    }

  } catch (error) {
    console.error('API /api/contatos/[id] (GET): Erro no handler:', error)

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