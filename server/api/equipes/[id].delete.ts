import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const id = event.context.params?.id
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID não fornecido' })

    const [team] = await db.select({ empresa_id: schema.equipes.empresa_id }).from(schema.equipes).where(eq(schema.equipes.id, id)).limit(1)
    if (!team) throw createError({ statusCode: 404, statusMessage: 'Equipe não encontrada' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id, role: schema.users.role }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1)
    if (userData?.role !== 'superadmin' && userData?.empresa_id !== team.empresa_id) {
      throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })
    }

    await db.delete(schema.equipes).where(eq(schema.equipes.id, id))

    return { success: true }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})
