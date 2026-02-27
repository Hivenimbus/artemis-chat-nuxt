import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID do usuário é obrigatório' })

  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    if (user.role !== 'superadmin') throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas superadmins podem excluir usuários.' })

    if (id === user.id) throw createError({ statusCode: 400, statusMessage: 'Você não pode excluir a si mesmo.' })

    await db.delete(schema.users).where(eq(schema.users.id, id))

    return { success: true, message: 'Usuário excluído com sucesso' }

  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro interno do servidor' })
  }
})
