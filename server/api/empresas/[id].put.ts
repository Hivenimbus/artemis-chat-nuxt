import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
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
        statusMessage: 'Acesso negado. Apenas superadmins podem editar empresas.'
      })
    }

    // Usar Service Role já que não estamos usando Supabase Auth
    const client = serverSupabaseServiceRole(event)

    // Obter ID da empresa dos parâmetros da rota
    const empresaId = getRouterParam(event, 'id')
    if (!empresaId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID da empresa não fornecido'
      })
    }

    // Obter corpo da requisição
    const body = await readBody(event)

    // Validar dados obrigatórios
    if (!body.nome || !body.vencimento) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nome e data de vencimento são obrigatórios'
      })
    }

    // Validar max_usuarios se fornecido
    let maxUsers = undefined
    if (body.max_usuarios !== undefined) {
      maxUsers = parseInt(body.max_usuarios)
      if (isNaN(maxUsers) || maxUsers < 1) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Número máximo de usuários deve ser pelo menos 1'
        })
      }
    }

    // Validar formato da data
    const dataVencimento = new Date(body.vencimento)
    if (isNaN(dataVencimento.getTime())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Data de vencimento inválida'
      })
    }

    // Verificar se empresa existe
    const { data: empresaExistente, error: checkError } = await client
      .from('empresas')
      .select('id')
      .eq('id', empresaId)
      .single()

    if (checkError || !empresaExistente) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Empresa não encontrada'
      })
    }

    // Atualizar empresa
    const updateData: any = {
      nome: body.nome.trim(),
      vencimento: dataVencimento.toISOString().split('T')[0], // Formato YYYY-MM-DD
      updated_at: new Date().toISOString()
    }
    
    if (maxUsers !== undefined) {
      updateData.max_usuarios = maxUsers
    }

    const { data: empresaAtualizada, error: updateError } = await client
      .from('empresas')
      .update(updateData)
      .eq('id', empresaId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar empresa:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao atualizar empresa'
      })
    }

    return {
      success: true,
      data: {
        id: empresaAtualizada.id,
        nome: empresaAtualizada.nome,
        vencimento: empresaAtualizada.vencimento,
        maxUsuarios: empresaAtualizada.max_usuarios,
        updated_at: empresaAtualizada.updated_at
      }
    }

  } catch (error) {
    console.error('Erro no handler de atualização de empresa:', error)

    // Se já for um erro criado, retornar como está
    if (error.statusCode) {
      throw error
    }

    // Erro genérico
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})