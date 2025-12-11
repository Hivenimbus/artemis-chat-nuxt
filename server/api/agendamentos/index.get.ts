import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const client = serverSupabaseServiceRole(event)

    // Get user data to find empresa_id
    const { data: userData, error: userError } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
    }

    // Get query params
    const query = getQuery(event)
    const startDate = query.start_date as string
    const endDate = query.end_date as string
    const type = query.type as string
    const status = query.status as string

    // Build query
    let queryBuilder = client
      .from('agendamentos')
      .select(`
        *,
        agendamento_contatos (
          contato_id,
          contatos (
            id,
            nome,
            sobrenome,
            telefone,
            email
          )
        )
      `)
      .eq('empresa_id', userData.empresa_id)

    if (startDate) {
      queryBuilder = queryBuilder.gte('start_time', startDate)
    }
    if (endDate) {
      queryBuilder = queryBuilder.lte('start_time', endDate)
    }
    if (type) {
      queryBuilder = queryBuilder.eq('type', type)
    }
    if (status) {
      queryBuilder = queryBuilder.eq('status', status)
    }

    const { data: agendamentos, error } = await queryBuilder.order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching agendamentos:', error)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao buscar agendamentos' })
    }

    return {
      success: true,
      data: agendamentos
    }

  } catch (error) {
    console.error('API agendamentos/index.get:', error)
    throw error
  }
})

