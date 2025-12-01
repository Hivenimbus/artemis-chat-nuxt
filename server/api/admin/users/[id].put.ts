import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

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
      throw createError({ statusCode: 403, statusMessage: 'Apenas superadmins podem editar usuários.' })
    }

    // 2. Validar dados de entrada
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.role !== undefined) updateData.role = body.role
    if (body.status !== undefined) updateData.status = body.status
    if (body.empresa_id !== undefined) updateData.empresa_id = body.empresa_id // Pode ser null

    // Se não houver nada para atualizar
    if (Object.keys(updateData).length === 0) {
      return { success: true, message: 'Nenhum dado para atualizar' }
    }

    // 3. Atualizar usuário na tabela 'users' (tabela pública)
    const { data: updatedUser, error: updateError } = await client
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Erro ao atualizar usuário: ${updateError.message}`
      })
    }

    // 4. Se o email foi alterado, precisaríamos atualizar no Auth do Supabase também.
    // Por enquanto, o plano especificou dados básicos. A alteração de email no Auth requer admin API do Supabase (service role), 
    // mas vamos manter o foco na tabela pública 'users' conforme padrão atual do projeto onde 'users' espelha dados.
    // Nota: Alterar email geralmente requer re-confirmação, então por segurança vamos alterar apenas na tabela users por enquanto
    // ou assumir que o email é imutável via essa interface simples para evitar inconsistências de auth.
    // Se o body contiver email e for diferente, vamos tentar atualizar.
    
    // Como o plano mencionou "Nome, Email, Função, Empresa", vamos assumir atualização na tabela users.

    if (body.email !== undefined) {
        // Atualiza email apenas na tabela users por enquanto para refletir na UI
        // Atualização real de auth requereria service role client e admin.updateUserById
        const { error: emailError } = await client
            .from('users')
            .update({ email: body.email })
            .eq('id', id)
        
        if (emailError) {
             console.error('Erro ao atualizar email na tabela users', emailError)
        }
    }


    return {
      success: true,
      data: updatedUser
    }

  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro interno do servidor'
    })
  }
})

