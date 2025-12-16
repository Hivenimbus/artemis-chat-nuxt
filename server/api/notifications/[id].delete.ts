import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
    }

    const client = serverSupabaseServiceRole(event)

    const { error } = await client
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting notification:', error)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao excluir notificação' })
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('API notifications/[id].delete error:', error)
    throw error
  }
})

