import { db } from '~/server/db'
import { users, kanbans } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!dbUser || !dbUser.empresa_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário sem empresa associada'
      })
    }

    const result = await db
      .select()
      .from(kanbans)
      .where(eq(kanbans.empresa_id, dbUser.empresa_id))

    return {
      success: true,
      data: result
    }

  } catch (error: any) {
    console.error('Erro ao listar kanbans:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro interno do servidor'
    })
  }
})
