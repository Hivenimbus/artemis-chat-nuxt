import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const body = await readBody(event)
    const { id, all } = body

    const client = serverSupabaseServiceRole(event)

    let query = client.from('notifications').update({ read: true }).eq('user_id', user.id)

    if (!all) {
      if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID da notificação é obrigatório' })
      }
      query = query.eq('id', id)
    } else {
        query = query.eq('read', false)
    }

    const { error } = await query

    if (error) {
      console.error('Error marking notification as read:', error)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar notificação' })
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('API notifications/mark-read error:', error)
    throw error
  }
})

