import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const client = serverSupabaseServiceRole(event)

    const { error } = await client
      .from('notifications')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Error clearing notifications:', error)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao limpar notificações' })
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('API notifications/clear error:', error)
    throw error
  }
})

