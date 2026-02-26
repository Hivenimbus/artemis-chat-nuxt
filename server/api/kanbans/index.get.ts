<<<<<<< Updated upstream
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
=======
import { eq, asc } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
        .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Sem empresa' })

    const kanbans = await db.select().from(schema.kanbans)
        .where(eq(schema.kanbans.empresa_id, userData.empresa_id))
        .orderBy(asc(schema.kanbans.created_at))

    return { success: true, data: kanbans.map(k => ({ ...k, title: k.nome })) }
>>>>>>> Stashed changes
})
