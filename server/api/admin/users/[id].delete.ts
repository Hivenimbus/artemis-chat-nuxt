<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
=======
import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID do usuário é obrigatório' })

  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    if (user.role !== 'superadmin') throw createError({ statusCode: 403, statusMessage: 'Acesso negado. Apenas superadmins podem excluir usuários.' })

<<<<<<< Updated upstream
    if (user.role !== 'superadmin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Acesso negado. Apenas superadmins podem excluir usuários.'
      })
    }

    if (id === user.id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Você não pode excluir a si mesmo.'
      })
    }

    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id })

    if (!deleted) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Usuário não encontrado'
      })
    }

    return {
      success: true,
      message: 'Usuário excluído com sucesso'
    }
=======
    if (id === user.id) throw createError({ statusCode: 400, statusMessage: 'Você não pode excluir a si mesmo.' })

    await db.delete(schema.users).where(eq(schema.users.id, id))

    return { success: true, message: 'Usuário excluído com sucesso' }
>>>>>>> Stashed changes

  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro interno do servidor' })
  }
})
