import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const client = serverSupabaseServiceRole(event)
    const query = getQuery(event)

    // Get user data to find empresa_id
    const { data: userData, error: userError } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
    }

    // Build query
    let campaignsQuery = client
      .from('campanhas')
      .select('*')
      .eq('empresa_id', userData.empresa_id)
      .order('created_at', { ascending: false })

    // Optional status filter
    if (query.status && query.status !== 'all') {
      // Handle grouped statuses
      if (query.status === 'in_progress') {
        campaignsQuery = campaignsQuery.in('status', ['processing', 'sending'])
      } else {
        campaignsQuery = campaignsQuery.eq('status', query.status)
      }
    }

    const { data: campaigns, error: campaignsError } = await campaignsQuery

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao buscar campanhas' })
    }

    return {
      success: true,
      data: campaigns || []
    }

  } catch (error: any) {
    console.error('API campanhas/index.get:', error)
    throw createError({ 
      statusCode: error.statusCode || 500, 
      statusMessage: error.statusMessage || 'Erro interno ao buscar campanhas' 
    })
  }
})

