<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, agendamentos } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'
=======
import { eq, and } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID inválido' })

<<<<<<< Updated upstream
    // Check ownership/permissions
    const userData = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])
=======
    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Erro de permissão' })
>>>>>>> Stashed changes

    await db.delete(schema.agendamentos)
      .where(and(eq(schema.agendamentos.id, id), eq(schema.agendamentos.empresa_id, userData.empresa_id)))

<<<<<<< Updated upstream
    await db
      .delete(agendamentos)
      .where(and(eq(agendamentos.id, id), eq(agendamentos.empresa_id, userData.empresa_id)))

    return {
      success: true
    }

  } catch (error) {
=======
    return { success: true }

  } catch (error: any) {
>>>>>>> Stashed changes
    console.error('API agendamentos/[id].delete:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro ao excluir agendamento' })
  }
})
