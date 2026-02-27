import { eq, desc } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Usuário não está associado a nenhuma empresa' })
    }

    const etiquetasList = await db.select({
      id: schema.etiquetas.id,
      nome: schema.etiquetas.nome,
      cor: schema.etiquetas.cor,
      created_at: schema.etiquetas.created_at,
      updated_at: schema.etiquetas.updated_at,
    }).from(schema.etiquetas)
      .where(eq(schema.etiquetas.empresa_id, userData.empresa_id))
      .orderBy(desc(schema.etiquetas.created_at))

    const data = etiquetasList.map(e => ({ ...e, usageCount: 0, createdAt: e.created_at, updatedAt: e.updated_at }))

    return { success: true, data }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
