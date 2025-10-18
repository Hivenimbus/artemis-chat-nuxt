import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/contatos/[id] (PUT): Iniciando requisição')

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

    // Obter usuário autenticado
    const client = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await client.auth.getUser()

    if (userError || !user) {
      console.error('API /api/contatos/[id] (PUT): Erro de autenticação:', userError)
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
      console.error('API /api/contatos/[id] (PUT): Erro ao buscar dados do usuário:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar dados do usuário'
      })
    }

    if (!userData?.empresa_id) {
      console.error('API /api/contatos/[id] (PUT): Usuário não possui empresa vinculada')
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Obter corpo da requisição
    const body = await readBody(event)

    // Validar campos obrigatórios
    const { nome, email, telefone, tags = [] } = body

    if (!nome || !email || !telefone) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Campos obrigatórios: nome, email, telefone'
      })
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email inválido'
      })
    }

    // Validar telefone (apenas números)
    const cleanPhone = telefone.replace(/\D/g, '')
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Telefone inválido'
      })
    }

    console.log('API /api/contatos/[id] (PUT): Dados validados, atualizando contato:', contatoId)

    // Verificar se o contato existe e pertence à empresa do usuário
    const { data: contatoExistente, error: contatoExistenteError } = await client
      .from('contatos')
      .select('id, email')
      .eq('id', contatoId)
      .eq('empresa_id', userData.empresa_id)
      .single()

    if (contatoExistenteError) {
      console.error('API /api/contatos/[id] (PUT): Erro ao verificar contato:', contatoExistenteError)

      if (contatoExistenteError.code === 'PGRST116') {
        throw createError({
          statusCode: 404,
          statusMessage: 'Contato não encontrado'
        })
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao verificar contato'
      })
    }

    if (!contatoExistente) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Contato não encontrado'
      })
    }

    // Verificar se o email foi alterado e se já existe
    if (contatoExistente.email.toLowerCase() !== email.toLowerCase()) {
      const { data: emailExistente, error: emailError } = await client
        .from('contatos')
        .select('id')
        .eq('email', email.toLowerCase())
        .eq('empresa_id', userData.empresa_id)
        .single()

      if (!emailError && emailExistente) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Email já cadastrado para outro contato'
        })
      }
    }

    // Atualizar dados do contato
    const { data: contatoAtualizado, error: atualizacaoError } = await client
      .from('contatos')
      .update({
        nome: nome.trim(),
        sobrenome: body.sobrenome?.trim() || null,
        email: email.trim().toLowerCase(),
        telefone: cleanPhone,
        cidade: body.cidade?.trim() || null,
        pais: body.pais?.trim() || null,
        biografia: body.biografia?.trim() || null,
        empresa: body.empresa?.trim() || null,
        endereco: body.endereco?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', contatoId)
      .eq('empresa_id', userData.empresa_id)
      .select()
      .single()

    if (atualizacaoError) {
      console.error('API /api/contatos/[id] (PUT): Erro ao atualizar contato:', atualizacaoError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao atualizar contato'
      })
    }

    console.log('API /api/contatos/[id] (PUT): Contato atualizado:', contatoAtualizado.id)

    // Atualizar etiquetas associadas
    // Primeiro, remover todas as associações existentes
    const { error: removeAssociacoesError } = await client
      .from('contato_etiquetas')
      .delete()
      .eq('contato_id', contatoId)

    if (removeAssociacoesError) {
      console.error('API /api/contatos/[id] (PUT): Erro ao remover associações de etiquetas:', removeAssociacoesError)
      // Não falhar a atualização do contato se der erro nas etiquetas
    } else {
      // Adicionar novas associações se fornecidas
      if (tags && tags.length > 0) {
        console.log('API /api/contatos/[id] (PUT): Associando novas etiquetas:', tags)

        // Buscar IDs das etiquetas pelo nome
        const { data: etiquetasExistentes, error: etiquetasError } = await client
          .from('etiquetas')
          .select('id, nome')
          .eq('empresa_id', userData.empresa_id)
          .in('nome', tags)

        if (etiquetasError) {
          console.error('API /api/contatos/[id] (PUT): Erro ao buscar etiquetas:', etiquetasError)
          // Não falhar a atualização do contato se der erro nas etiquetas
        } else if (etiquetasExistentes && etiquetasExistentes.length > 0) {
          // Criar novas associações
          const associacoesEtiquetas = etiquetasExistentes.map(etiqueta => ({
            contato_id: contatoId,
            etiqueta_id: etiqueta.id
          }))

          const { error: associacaoError } = await client
            .from('contato_etiquetas')
            .insert(associacoesEtiquetas)

          if (associacaoError) {
            console.error('API /api/contatos/[id] (PUT): Erro ao associar etiquetas:', associacaoError)
            // Não falhar a atualização do contato se der erro nas associações
          } else {
            console.log('API /api/contatos/[id] (PUT): Etiquetas associadas com sucesso')
          }
        }
      }
    }

    // Buscar contato completo com etiquetas para retornar
    const { data: contatoCompleto, error: buscaError } = await client
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
      .single()

    if (buscaError) {
      console.error('API /api/contatos/[id] (PUT): Erro ao buscar contato completo:', buscaError)
      // Retornar contato básico se der erro na busca completa
    }

    // Formatar dados para o frontend
    const contatoFormatado = contatoCompleto ? {
      ...contatoCompleto,
      tags: contatoCompleto.contato_etiquetas
        ?.filter(ce => ce.etiquetas)
        ?.map(ce => ce.etiquetas.nome) || [],
      name: contatoCompleto.nome,
      lastName: contatoCompleto.sobrenome || '',
      phone: contatoCompleto.telefone,
      country: contatoCompleto.pais || '',
      company: contatoCompleto.empresa || '',
      address: contatoCompleto.endereco || '',
      city: contatoCompleto.cidade || '',
      biography: contatoCompleto.biografia || '',
      lastContact: contatoCompleto.created_at
    } : {
      ...contatoAtualizado,
      tags: [],
      name: contatoAtualizado.nome,
      lastName: contatoAtualizado.sobrenome || '',
      phone: contatoAtualizado.telefone,
      country: contatoAtualizado.pais || '',
      company: contatoAtualizado.empresa || '',
      address: contatoAtualizado.endereco || '',
      city: contatoAtualizado.cidade || '',
      biography: contatoAtualizado.biografia || '',
      lastContact: contatoAtualizado.created_at
    }

    console.log('API /api/contatos/[id] (PUT): Contato atualizado com sucesso')

    return {
      success: true,
      data: contatoFormatado
    }

  } catch (error) {
    console.error('API /api/contatos/[id] (PUT): Erro no handler:', error)

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