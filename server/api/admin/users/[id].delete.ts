import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID do usuário é obrigatório'
    })
  }

  try {
    // Obter usuário do contexto (injetado pelo middleware 01-auth-check)
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    // Verificar se o usuário é superadmin
    if (user.role !== 'superadmin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Acesso negado. Apenas superadmins podem excluir usuários.'
      })
    }

    // Usar Service Role já que não estamos usando Supabase Auth
    const client = serverSupabaseServiceRole(event)

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
    // No sistema customizado, o token é apenas um JWT, não gerenciamos Auth do Supabase diretamente aqui.
    // Mas mantemos a lógica se necessário para remover outros dados ou se houver integração futura.
    const serviceClient = serverSupabaseServiceRole(event)
    // ... restante da lógica omitida ou adaptada ...

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

