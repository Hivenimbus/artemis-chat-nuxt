import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const client = serverSupabaseServiceRole(event)

    // Get user's attachments
    // Assuming we want to show the latest attachments uploaded by this user for the current campaign context
    // We might want to limit this or filter by a specific campaign ID if that existed, 
    // but based on the request, we just want to "persist" data for the user's current session/draft.
    const { data: attachments, error } = await client
      .from('campaign_attachments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching attachments:', error)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao buscar anexos' })
    }

    return {
      success: true,
      data: attachments
    }

  } catch (error: any) {
    console.error('API attachments/index.get:', error)
    throw createError({ 
      statusCode: error.statusCode || 500, 
      statusMessage: error.statusMessage || 'Erro interno ao buscar anexos' 
    })
  }
})
