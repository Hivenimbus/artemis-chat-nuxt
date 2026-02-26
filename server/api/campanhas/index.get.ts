<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, campanhas } from '~/server/db/schema'
import { eq, and, inArray, desc } from 'drizzle-orm'
=======
import { eq, and, desc, inArray } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const query = getQuery(event)

<<<<<<< Updated upstream
    // Get user data to find empresa_id
    const userData = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
    }

    // Build conditions
    const conditions = [eq(campanhas.empresa_id, userData.empresa_id)]

    // Optional status filter
    if (query.status && query.status !== 'all') {
      if (query.status === 'in_progress') {
        conditions.push(inArray(campanhas.status, ['processing', 'sending']))
      } else {
        conditions.push(eq(campanhas.status, query.status as string))
      }
    }

    const result = await db
      .select()
      .from(campanhas)
      .where(and(...conditions))
      .orderBy(desc(campanhas.created_at))

    return {
      success: true,
      data: result
    }

  } catch (error: any) {
    console.error('API campanhas/index.get:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro interno ao buscar campanhas'
    })
=======
    const [userData] = await db.select({ empresa_id: schema.users.empresa_id }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1)
    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })

    let conditions: any[] = [eq(schema.campanhas.empresa_id, userData.empresa_id)]

    if (query.status && query.status !== 'all') {
      if (query.status === 'in_progress') {
        conditions.push(inArray(schema.campanhas.status, ['processing', 'sending']))
      } else {
        conditions.push(eq(schema.campanhas.status, query.status as string))
      }
    }

    const campaigns = await db.select().from(schema.campanhas)
      .where(and(...conditions))
      .orderBy(desc(schema.campanhas.created_at))

    return { success: true, data: campaigns || [] }

  } catch (error: any) {
    console.error('API campanhas/index.get:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro interno ao buscar campanhas' })
>>>>>>> Stashed changes
  }
})
