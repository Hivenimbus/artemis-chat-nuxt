import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)
  const etiquetaId = getRouterParam(event, 'id')

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Não autorizado'
    })
  }

  if (!etiquetaId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID da etiqueta é obrigatório'
    })
  }

  try {
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

    // Obter o empresa_id do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.empresa_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Verificar se a etiqueta existe e pertence à empresa do usuário
    const { data: existingEtiqueta, error: fetchError } = await supabase
      .from('etiquetas')
      .select('id, empresa_id')
      .eq('id', etiquetaId)
      .single()

    if (fetchError || !existingEtiqueta) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Etiqueta não encontrada'
      })
    }

    if (existingEtiqueta.empresa_id !== userData.empresa_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Sem permissão para editar esta etiqueta'
      })
    }

    // Verificar se já existe outra etiqueta com o mesmo nome na empresa
    if (nome) {
      const { data: duplicateEtiqueta } = await supabase
        .from('etiquetas')
        .select('id')
        .eq('empresa_id', userData.empresa_id)
        .eq('nome', nome.trim())
        .neq('id', etiquetaId)
        .single()

      if (duplicateEtiqueta) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Já existe outra etiqueta com este nome'
        })
      }
    }

    // Atualizar etiqueta
    const { data: etiqueta, error } = await supabase
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

    if (error) {
      console.error('Erro ao atualizar etiqueta:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao atualizar etiqueta'
      })
    }

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
    console.error('Erro no handler de etiquetas PUT:', error)
    throw error
  }
})