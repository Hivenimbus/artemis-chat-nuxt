<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
=======
import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID não fornecido' })

<<<<<<< Updated upstream
    // Verificar permissão (mesma empresa)
    const requestorData = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    const targetUser = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
      .then(r => r[0])

    if (!requestorData?.empresa_id || requestorData.empresa_id !== targetUser?.empresa_id) {
      throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })
    }

    // Remover usuário
    await db
      .delete(users)
      .where(eq(users.id, id))
=======
    const [requestorData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)
    const [targetUserData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, id)).limit(1)

    if (!requestorData?.empresa_id || requestorData.empresa_id !== targetUserData?.empresa_id) {
      throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })
    }

    await db.delete(schema.users).where(eq(schema.users.id, id))
>>>>>>> Stashed changes

    return { success: true }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})
