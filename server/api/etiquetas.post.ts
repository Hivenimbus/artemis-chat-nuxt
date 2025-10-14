import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Não autorizado'
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

    // Verificar se já existe uma etiqueta com o mesmo nome na empresa
    const { data: existingEtiqueta } = await supabase
      .from('etiquetas')
      .select('id')
      .eq('empresa_id', userData.empresa_id)
      .eq('nome', nome.trim())
      .single()

    if (existingEtiqueta) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Já existe uma etiqueta com este nome'
      })
    }

    // Criar nova etiqueta
    const { data: etiqueta, error } = await supabase
      .from('etiquetas')
      .insert({
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        cor: cor.toUpperCase(),
        empresa_id: userData.empresa_id,
        criado_por: user.id
      })
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
      console.error('Erro ao criar etiqueta:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao criar etiqueta'
      })
    }

    return {
      success: true,
      data: {
        ...etiqueta,
        usageCount: 0,
        createdAt: etiqueta.created_at,
        updatedAt: etiqueta.updated_at,
        createdBy: etiqueta.users
      }
    }
  } catch (error) {
    console.error('Erro no handler de etiquetas POST:', error)
    throw error
  }
})