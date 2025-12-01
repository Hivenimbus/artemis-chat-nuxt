import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID do usuário é obrigatório'
    })
  }

  try {
    const client = await serverSupabaseClient(event)

    // 1. Verificar autenticação e permissão (Superadmin)
    const { data: { user }, error: userError } = await client.auth.getUser()
    if (userError || !user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const { data: requestUserRole, error: roleCheckError } = await client
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleCheckError || requestUserRole?.role !== 'superadmin') {
      throw createError({ statusCode: 403, statusMessage: 'Apenas superadmins podem excluir usuários.' })
    }

    // Impedir auto-exclusão
    if (id === user.id) {
      throw createError({ statusCode: 400, statusMessage: 'Você não pode excluir a si mesmo.' })
    }

    // 2. Excluir da tabela pública 'users'
    const { error: deleteError } = await client
      .from('users')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Erro ao excluir usuário da tabela pública: ${deleteError.message}`
      })
    }

    // 3. Excluir do Auth (Requer Service Role)
    // É boa prática remover do Auth também para revogar acesso imediatamente
    const serviceClient = serverSupabaseServiceRole(event)
    const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(id)

    if (authDeleteError) {
      console.warn('Usuário removido da tabela users, mas erro ao remover do Auth:', authDeleteError)
      // Não vamos falhar a request inteira se falhar no auth, pois o registro principal já foi
    }

    return {
      success: true,
      message: 'Usuário excluído com sucesso'
    }

  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro interno do servidor'
    })
  }
})

