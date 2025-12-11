import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    
    const id = event.context.params?.id
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID não fornecido' })

    const client = serverSupabaseServiceRole(event)

    // Verificar permissões (se é da mesma empresa)
    const { data: team, error: fetchError } = await client
      .from('equipes')
      .select('empresa_id')
      .eq('id', id)
      .single()

    if (fetchError || !team) {
       throw createError({ statusCode: 404, statusMessage: 'Equipe não encontrada' })
    }

    const { data: userData } = await client
      .from('users')
      .select('empresa_id, role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'superadmin' && userData?.empresa_id !== team.empresa_id) {
      throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })
    }

    const { error } = await client
      .from('equipes')
      .delete()
      .eq('id', id)

    if (error) throw createError({ statusCode: 500, statusMessage: 'Erro ao excluir equipe' })

    return { success: true }

  } catch (error) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})

