import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    // Obter usuário do contexto
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    const client = serverSupabaseServiceRole(event)

    // Buscar empresa do usuário logado
    const { data: userData, error: userError } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.empresa_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não possui empresa vinculada'
      })
    }

    // Buscar agentes da mesma empresa
    const { data: agentes, error } = await client
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        created_at,
        empresas (
          id,
          nome
        ),
        inbox_agents (
          inbox_id
        ),
        equipes_agentes (
          equipe_id,
          equipes (
            id,
            nome
          )
        )
      `)
      .in('role', ['user', 'admin', 'superadmin'])
      .eq('empresa_id', userData.empresa_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar agentes:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar agentes'
      })
    }

    return {
      success: true,
      data: agentes || []
    }

  } catch (error) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})

