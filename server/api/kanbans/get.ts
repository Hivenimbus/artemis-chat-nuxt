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

    // Buscar todos os kanbans da empresa do usuário
    const { data: kanbans, error: kanbansError } = await supabase
      .from('kanbans')
      .select(`
        id,
        title,
        description,
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

    if (kanbansError) {
      console.error('Erro ao buscar kanbans:', kanbansError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar kanbans'
      })
    }

    // Formatar dados para retorno
    const formattedKanbans = kanbans.map(kanban => ({
      id: kanban.id,
      title: kanban.title,
      description: kanban.description,
      createdAt: kanban.created_at,
      updatedAt: kanban.updated_at,
      createdBy: kanban.users
    }))

    return {
      success: true,
      data: formattedKanbans
    }
  } catch (error) {
    console.error('Erro no handler de kanbans GET:', error)
    throw error
  }
})