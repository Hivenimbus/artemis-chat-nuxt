import { db } from '~/server/db'
import { users, agendamentos } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const id = event.context.params?.id
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
    }

    // Check ownership/permissions
    const userData = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Erro de permissão' })
    }

    await db
      .delete(agendamentos)
      .where(and(eq(agendamentos.id, id), eq(agendamentos.empresa_id, userData.empresa_id)))

    return {
      success: true
    }

  } catch (error) {
    console.error('API agendamentos/[id].delete:', error)
    throw error
  }
})
