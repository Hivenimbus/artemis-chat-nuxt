import { eq, inArray, and } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })

    const query = getQuery(event)
    const type = query.type as string
    const tagsParam = query.tags
    const tags = tagsParam
      ? (Array.isArray(tagsParam) ? tagsParam : [tagsParam]) as string[]
      : []

    let count = 0

    if (type === 'all') {
      const rows = await db.select({ id: schema.contatos.id }).from(schema.contatos)
        .where(eq(schema.contatos.empresa_id, userData.empresa_id))
      count = rows.length
    } else if (type === 'tags' && tags.length > 0) {
      const rows = await db.select({ id: schema.contatos.id }).from(schema.contatos)
        .where(
          and(
            eq(schema.contatos.empresa_id, userData.empresa_id),
            inArray(schema.contatos.etiqueta_id, tags as string[])
          )
        )
      count = rows.length
    }

    return { success: true, count }

  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro interno ao contar contatos' })
  }
})
