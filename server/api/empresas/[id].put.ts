import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    if (user.role !== 'superadmin') throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas superadmins podem editar empresas.' })

    const empresaId = getRouterParam(event, 'id')
    if (!empresaId) throw createError({ statusCode: 400, statusMessage: 'ID da empresa não fornecido' })

    const body = await readBody(event)
    if (!body.nome || !body.vencimento) throw createError({ statusCode: 400, statusMessage: 'Nome e data de vencimento são obrigatórios' })

    let maxUsers: number | undefined
    if (body.max_usuarios !== undefined) {
      maxUsers = parseInt(body.max_usuarios)
      if (isNaN(maxUsers) || maxUsers < 1) throw createError({ statusCode: 400, statusMessage: 'Número máximo de usuários deve ser pelo menos 1' })
    }

    const dataVencimento = new Date(body.vencimento)
    if (isNaN(dataVencimento.getTime())) throw createError({ statusCode: 400, statusMessage: 'Data de vencimento inválida' })

    const [empresaExistente] = await db.select({ id: schema.empresas.id })
      .from(schema.empresas).where(eq(schema.empresas.id, empresaId)).limit(1)

    if (!empresaExistente) throw createError({ statusCode: 404, statusMessage: 'Empresa não encontrada' })

    const updateData: any = { nome: body.nome.trim(), updated_at: new Date() }
    if (maxUsers !== undefined) updateData.max_usuarios = maxUsers

    const [empresaAtualizada] = await db.update(schema.empresas)
      .set(updateData)
      .where(eq(schema.empresas.id, empresaId))
      .returning()

    return {
      success: true,
      data: { id: empresaAtualizada.id, nome: empresaAtualizada.nome, maxUsuarios: (empresaAtualizada as any).max_usuarios, updated_at: empresaAtualizada.updated_at }
    }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
