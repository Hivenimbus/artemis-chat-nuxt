import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const id = event.context.params?.id
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID não fornecido' })

    const body = await readBody(event)
    const { name, email, role } = body

    const client = serverSupabaseServiceRole(event)

    // Verificar permissão (mesma empresa)
    const { data: requestorData } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    const { data: targetUser } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', id)
      .single()

    if (!requestorData?.empresa_id || requestorData.empresa_id !== targetUser?.empresa_id) {
      throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })
    }

    // Atualizar
    const { error } = await client
      .from('users')
      .update({ name, email, role })
      .eq('id', id)

    if (error) throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar' })

    return { success: true }

  } catch (error) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})

