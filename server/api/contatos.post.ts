import { serverSupabaseClient } from '#supabase/server'
import { checkWhatsAppNumber } from '~/server/lib/evolution'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/contatos (POST): Iniciando requisição')

    // Obter usuário autenticado
    const client = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await client.auth.getUser()

    if (userError || !user) {
      console.error('API /api/contatos (POST): Erro de autenticação:', userError)
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
      console.error('API /api/contatos (POST): Erro ao buscar dados do usuário:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar dados do usuário'
      })
    }

    if (!userData?.empresa_id) {
      console.error('API /api/contatos (POST): Usuário não possui empresa vinculada')
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Obter corpo da requisição
    const body = await readBody(event)

    // Validar campos obrigatórios
    const { nome, email, telefone, tags = [] } = body

    if (!nome || !telefone) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Campos obrigatórios: nome, telefone'
      })
    }

    // Validar formato do email apenas se fornecido
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Email inválido'
        })
      }
    }

    // Validar e normalizar telefone (apenas números)
    let cleanPhone = telefone.replace(/\D/g, '')

    // Adicionar código do país 55 se não estiver presente
    if (!cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone
    }

    if (cleanPhone.length < 12 || cleanPhone.length > 13) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Telefone inválido (deve ter 12-13 dígitos com código do país 55)'
      })
    }

    // Buscar primeira inbox da empresa para validar WhatsApp
    console.log('API /api/contatos (POST): Buscando inbox para validação WhatsApp')
    const { data: inbox, error: inboxError } = await client
      .from('inboxes')
      .select('id')
      .eq('empresa_id', userData.empresa_id)
      .limit(1)
      .single()

    if (inboxError || !inbox) {
      console.error('API /api/contatos (POST): Nenhuma inbox encontrada:', inboxError)
      throw createError({
        statusCode: 400,
        statusMessage: 'Nenhuma caixa de entrada configurada. Configure uma caixa de entrada antes de criar contatos.'
      })
    }

    // Verificar se o número possui WhatsApp ativo
    console.log('API /api/contatos (POST): Validando se número possui WhatsApp')
    const whatsappCheck = await checkWhatsAppNumber(inbox.id, cleanPhone)

    if (whatsappCheck.error) {
      console.error('API /api/contatos (POST): Erro ao verificar WhatsApp:', whatsappCheck.error)
      throw createError({
        statusCode: 500,
        statusMessage: `Erro ao verificar WhatsApp: ${whatsappCheck.error}`
      })
    }

    if (!whatsappCheck.exists) {
      console.warn('API /api/contatos (POST): Número não possui WhatsApp:', cleanPhone)
      throw createError({
        statusCode: 400,
        statusMessage: `O número ${cleanPhone} não possui WhatsApp ativo. Verifique o número e tente novamente.`
      })
    }

    console.log('API /api/contatos (POST): ✅ Número validado com WhatsApp, criando contato')

    // Iniciar transação
    const { data: novoContato, error: contatoError } = await client
      .from('contatos')
      .insert({
        nome: nome.trim(),
        sobrenome: body.sobrenome?.trim() || null,
        email: email?.trim().toLowerCase() || null,
        telefone: cleanPhone,
        cidade: body.cidade?.trim() || null,
        pais: body.pais?.trim() || null,
        biografia: body.biografia?.trim() || null,
        empresa: body.empresa?.trim() || null,
        endereco: body.endereco?.trim() || null,
        empresa_id: userData.empresa_id
      })
      .select()
      .single()

    if (contatoError) {
      console.error('API /api/contatos (POST): Erro ao criar contato:', contatoError)

      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao criar contato'
      })
    }

    console.log('API /api/contatos (POST): Contato criado:', novoContato.id)

    // Associar etiquetas se fornecidas
    if (tags && tags.length > 0) {
      console.log('API /api/contatos (POST): Associando etiquetas:', tags)

      // Buscar IDs das etiquetas pelo nome
      const { data: etiquetasExistentes, error: etiquetasError } = await client
        .from('etiquetas')
        .select('id, nome')
        .eq('empresa_id', userData.empresa_id)
        .in('nome', tags)

      if (etiquetasError) {
        console.error('API /api/contatos (POST): Erro ao buscar etiquetas:', etiquetasError)
        // Não falhar a criação do contato se der erro nas etiquetas
      } else if (etiquetasExistentes && etiquetasExistentes.length > 0) {
        // Criar associações com as etiquetas encontradas
        const associacoesEtiquetas = etiquetasExistentes.map(etiqueta => ({
          contato_id: novoContato.id,
          etiqueta_id: etiqueta.id
        }))

        const { error: associacaoError } = await client
          .from('contato_etiquetas')
          .insert(associacoesEtiquetas)

        if (associacaoError) {
          console.error('API /api/contatos (POST): Erro ao associar etiquetas:', associacaoError)
          // Não falhar a criação do contato se der erro nas associações
        } else {
          console.log('API /api/contatos (POST): Etiquetas associadas com sucesso')
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
      .eq('id', novoContato.id)
      .single()

    if (buscaError) {
      console.error('API /api/contatos (POST): Erro ao buscar contato completo:', buscaError)
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
      ...novoContato,
      tags: [],
      name: novoContato.nome,
      lastName: novoContato.sobrenome || '',
      phone: novoContato.telefone,
      country: novoContato.pais || '',
      company: novoContato.empresa || '',
      address: novoContato.endereco || '',
      city: novoContato.cidade || '',
      biography: novoContato.biografia || '',
      lastContact: novoContato.created_at
    }

    console.log('API /api/contatos (POST): Contato criado com sucesso')

    return {
      success: true,
      data: contatoFormatado
    }

  } catch (error) {
    console.error('API /api/contatos (POST): Erro no handler:', error)

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