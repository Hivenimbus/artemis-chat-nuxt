import { eq, desc } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id, role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1)

    if (!userData) throw createError({ statusCode: 401, statusMessage: 'Usuário inválido' })

    const teams = await db.query.equipes.findMany({
      with: {
        empresas: { columns: { id: true, nome: true } },
        inbox_teams: { columns: { inbox_id: true } }
      },
      orderBy: [desc(schema.equipes.created_at)],
      where: userData.role !== 'superadmin' && userData.empresa_id
        ? eq(schema.equipes.empresa_id, userData.empresa_id)
        : undefined
    })

    return { success: true, data: teams || [] }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})
