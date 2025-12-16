import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const client = serverSupabaseServiceRole(event)

    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching notifications:', error)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao buscar notificações' })
    }

    return {
      success: true,
      data: data || []
    }

  } catch (error) {
    console.error('API notifications error:', error)
    throw error
  }
})

