import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const id = event.context.params?.id
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
    }

    const client = serverSupabaseServiceRole(event)

    // Check ownership/permissions
    const { data: userData } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (!userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Erro de permissão' })
    }

    const { error: deleteError } = await client
      .from('agendamentos')
      .delete()
      .eq('id', id)
      .eq('empresa_id', userData.empresa_id)

    if (deleteError) {
      console.error('Error deleting agendamento:', deleteError)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao excluir agendamento' })
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('API agendamentos/[id].delete:', error)
    throw error
  }
})

