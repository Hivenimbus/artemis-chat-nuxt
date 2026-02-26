<<<<<<< Updated upstream
import { db } from '~/server/db'
import { empresas } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
=======
import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    if (user.role !== 'superadmin') throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas superadmins podem editar empresas.' })

<<<<<<< Updated upstream
    // Verificar se o usuário é superadmin
    if (user.role !== 'superadmin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Acesso negado. Apenas superadmins podem editar empresas.'
      })
    }

    // Obter ID da empresa dos parâmetros da rota
=======
>>>>>>> Stashed changes
    const empresaId = getRouterParam(event, 'id')
    if (!empresaId) throw createError({ statusCode: 400, statusMessage: 'ID da empresa não fornecido' })

    const body = await readBody(event)
    if (!body.nome || !body.vencimento) throw createError({ statusCode: 400, statusMessage: 'Nome e data de vencimento são obrigatórios' })

<<<<<<< Updated upstream
    // Validar dados obrigatórios
    if (!body.nome || !body.vencimento) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nome e data de vencimento são obrigatórios'
      })
    }

    // Validar max_usuarios se fornecido
    let maxUsers: number | undefined = undefined
=======
    let maxUsers: number | undefined
>>>>>>> Stashed changes
    if (body.max_usuarios !== undefined) {
      maxUsers = parseInt(body.max_usuarios)
      if (isNaN(maxUsers) || maxUsers < 1) throw createError({ statusCode: 400, statusMessage: 'Número máximo de usuários deve ser pelo menos 1' })
    }

    const dataVencimento = new Date(body.vencimento)
    if (isNaN(dataVencimento.getTime())) throw createError({ statusCode: 400, statusMessage: 'Data de vencimento inválida' })

<<<<<<< Updated upstream
    // Verificar se empresa existe
    const empresaExistente = await db
      .select({ id: empresas.id })
      .from(empresas)
      .where(eq(empresas.id, empresaId))
      .limit(1)
      .then(r => r[0])

    if (!empresaExistente) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Empresa não encontrada'
      })
    }

    // Montar dados de atualização
    const updateData: Record<string, any> = {
      nome: body.nome.trim(),
      vencimento: dataVencimento.toISOString().split('T')[0],
      updated_at: new Date()
    }

    if (maxUsers !== undefined) {
      updateData.max_usuarios = maxUsers
    }

    // Atualizar empresa
    const empresaAtualizada = await db
      .update(empresas)
      .set(updateData)
      .where(eq(empresas.id, empresaId))
      .returning()
      .then(r => r[0])

    if (!empresaAtualizada) {
      console.error('Erro ao atualizar empresa: nenhum registro retornado')
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao atualizar empresa'
      })
    }
=======
    const [empresaExistente] = await db.select({ id: schema.empresas.id })
      .from(schema.empresas).where(eq(schema.empresas.id, empresaId)).limit(1)

    if (!empresaExistente) throw createError({ statusCode: 404, statusMessage: 'Empresa não encontrada' })

    const updateData: any = { nome: body.nome.trim(), updated_at: new Date() }
    if (maxUsers !== undefined) updateData.max_usuarios = maxUsers

    const [empresaAtualizada] = await db.update(schema.empresas)
      .set(updateData)
      .where(eq(schema.empresas.id, empresaId))
      .returning()
>>>>>>> Stashed changes

    return {
      success: true,
      data: { id: empresaAtualizada.id, nome: empresaAtualizada.nome, maxUsuarios: (empresaAtualizada as any).max_usuarios, updated_at: empresaAtualizada.updated_at }
    }

  } catch (error: any) {
<<<<<<< Updated upstream
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
=======
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
>>>>>>> Stashed changes
  }
})
