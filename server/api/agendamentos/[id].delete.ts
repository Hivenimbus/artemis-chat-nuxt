import { eq, and } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID inválido' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Erro de permissão' })

    await db.delete(schema.agendamentos)
      .where(and(eq(schema.agendamentos.id, id), eq(schema.agendamentos.empresa_id, userData.empresa_id)))

    return { success: true }

  } catch (error: any) {
    console.error('API agendamentos/[id].delete:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro ao excluir agendamento' })
  }
})
