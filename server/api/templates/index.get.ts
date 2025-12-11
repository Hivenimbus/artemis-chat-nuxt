import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const client = serverSupabaseServiceRole(event)

    // Get user's template (draft)
    const { data: template, error } = await client
      .from('message_templates')
      .select('content')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching template:', error)
      // Don't throw error, just return null if fetch failed (might be no template)
    }

    return {
      success: true,
      data: template
    }

  } catch (error: any) {
    console.error('API templates/index.get:', error)
    // Return empty success to not break the page load
    return {
      success: true,
      data: null
    }
  }
})

