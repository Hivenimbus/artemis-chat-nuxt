import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    
    const client = serverSupabaseServiceRole(event)

    // Buscar info do usuário
    const { data: userData, error: userError } = await client
      .from('users')
      .select('empresa_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário inválido' })
    }

    let query = client
      .from('equipes')
      .select(`
        *,
        empresas (
          id,
          nome
        ),
        inbox_teams (
          inbox_id
        )
      `)
      .order('created_at', { ascending: false })

    // Se não for superadmin, filtrar pela empresa
    if (userData.role !== 'superadmin') {
      if (!userData.empresa_id) {
         return { success: true, data: [] }
      }
      query = query.eq('empresa_id', userData.empresa_id)
    }

    const { data: teams, error } = await query

    if (error) {
      console.error('Erro ao buscar equipes:', error)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao buscar equipes' })
    }

    return {
      success: true,
      data: teams || []
    }

  } catch (error) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})

