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

    // Buscar etiquetas da empresa com informações do criador
    const { data: etiquetas, error } = await supabase
      .from('etiquetas')
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
      .eq('empresa_id', userData.empresa_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar etiquetas:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar etiquetas'
      })
    }

    // Calcular usage count (placeholder - futuro: implementar contagem real)
    const etiquetasWithCount = etiquetas?.map(etiqueta => ({
      ...etiqueta,
      usageCount: 0, // Placeholder - implementar contagem real futuramente
      createdAt: etiqueta.created_at,
      updatedAt: etiqueta.updated_at,
      createdBy: etiqueta.users
    })) || []

    return {
      success: true,
      data: etiquetasWithCount
    }
  } catch (error) {
    console.error('Erro no handler de etiquetas GET:', error)
    throw error
  }
})