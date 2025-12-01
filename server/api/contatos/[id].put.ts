import { serverSupabaseServiceRole } from '#supabase/server'

// Definir interface para o tipo de usuário retornado pelo Supabase
interface DatabaseUser {
  id: string
  email: string
  role: string
  empresa_id: string
  created_at: string
  updated_at: string
}

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

    // Obter usuário autenticado do contexto (injetado pelo middleware 01-auth-check)
    const user = event.context.user

    if (!user) {
      console.error('API /api/contatos/[id] (PUT): Usuário não autenticado no contexto')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    const client = serverSupabaseServiceRole(event)

    // Buscar dados completos do usuário na tabela users
    const { data: userDataResponse, error } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    // Cast para o tipo definido
    const userData = userDataResponse as unknown as DatabaseUser

    if (error) {
      console.error('API /api/contatos/[id] (PUT): Erro ao buscar dados do usuário:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar dados do usuário'
      })
    }

    if (!userData || !userData.empresa_id) {
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

    // Atualizar dados do contato
    const updateData: any = {
      nome: nome.trim(),
      sobrenome: body.sobrenome?.trim() || null,
      email: email?.trim().toLowerCase() || null,
      telefone: cleanPhone,
      cidade: body.cidade?.trim() || null,
      pais: body.pais?.trim() || null,
      biografia: body.biografia?.trim() || null,
      empresa: body.empresa?.trim() || null,
      endereco: body.endereco?.trim() || null,
      updated_at: new Date().toISOString()
    };

    // Usando any para contornar problemas de tipagem com o cliente supabase
    const { data: contatoAtualizadoResponse, error: atualizacaoError } = await (client
      .from('contatos')
      .update(updateData as never)
      .eq('id', contatoId)
      .eq('empresa_id', userData.empresa_id)
      .select()
      .single() as any)

    // Cast para any para evitar erros de tipagem estritos do TS com supabase
    const contatoAtualizado = contatoAtualizadoResponse as any

    if (atualizacaoError) {
      console.error('API /api/contatos/[id] (PUT): Erro ao atualizar contato:', atualizacaoError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao atualizar contato'
      })
    }

    console.log('API /api/contatos/[id] (PUT): Contato atualizado:', contatoAtualizado.id)

    // Atualizar etiquetas associadas
    const { error: removeAssociacoesError } = await client
      .from('contato_etiquetas')
      .delete()
      .eq('contato_id', contatoId)

    if (removeAssociacoesError) {
      console.error('API /api/contatos/[id] (PUT): Erro ao remover associações de etiquetas:', removeAssociacoesError)
    } else {
      if (tags && tags.length > 0) {
        console.log('API /api/contatos/[id] (PUT): Associando novas etiquetas:', tags)

        const { data: etiquetasExistentes, error: etiquetasError } = await client
          .from('etiquetas')
          .select('id, nome')
          .eq('empresa_id', userData.empresa_id)
          .in('nome', tags)

        if (etiquetasError) {
          console.error('API /api/contatos/[id] (PUT): Erro ao buscar etiquetas:', etiquetasError)
        } else if (etiquetasExistentes && etiquetasExistentes.length > 0) {
          const associacoesEtiquetas = etiquetasExistentes.map((etiqueta: any) => ({
            contato_id: contatoId,
            etiqueta_id: etiqueta.id
          }))

          const { error: associacaoError } = await client
            .from('contato_etiquetas')
            .insert(associacoesEtiquetas as any)

          if (associacaoError) {
            console.error('API /api/contatos/[id] (PUT): Erro ao associar etiquetas:', associacaoError)
          } else {
            console.log('API /api/contatos/[id] (PUT): Etiquetas associadas com sucesso')
          }
        }
      }
    }

    // Buscar contato completo com etiquetas para retornar
    const { data: contatoCompletoResponse, error: buscaError } = await client
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

    const contatoCompleto = contatoCompletoResponse as any

    if (buscaError) {
      console.error('API /api/contatos/[id] (PUT): Erro ao buscar contato completo:', buscaError)
    }

    // Helper para formatar
    const formatContact = (c: any) => ({
      ...c,
      tags: c.contato_etiquetas
        ?.filter((ce: any) => ce.etiquetas)
        ?.map((ce: any) => ({
          id: ce.etiquetas.id,
          name: ce.etiquetas.nome,
          color: ce.etiquetas.cor
        })) || [],
      name: c.nome,
      lastName: c.sobrenome || '',
      phone: c.telefone,
      country: c.pais || '',
      company: c.empresa || '',
      address: c.endereco || '',
      city: c.cidade || '',
      biography: c.biografia || '',
      lastContact: c.created_at
    })

    const contatoFormatado = contatoCompleto 
      ? formatContact(contatoCompleto)
      : formatContact({ ...contatoAtualizado, contato_etiquetas: [] })

    console.log('API /api/contatos/[id] (PUT): Contato atualizado com sucesso')

    return {
      success: true,
      data: contatoFormatado
    }

  } catch (error: any) {
    console.error('API /api/contatos/[id] (PUT): Erro no handler:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
