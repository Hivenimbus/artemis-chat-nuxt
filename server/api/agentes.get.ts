import { eq, desc, inArray } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Usuário não possui empresa vinculada' })

    const agentes = await db.query.users.findMany({
      where: eq(schema.users.empresa_id, userData.empresa_id),
      orderBy: [desc(schema.users.created_at)],
      with: {
        empresa: { columns: { id: true, nome: true } },
        equipesAgentes: { with: { equipe: { columns: { id: true, nome: true } } } },
        inboxAgents: { columns: { inbox_id: true } }
      }
    })

    return { success: true, data: agentes }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
