import { eq, asc } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
        .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Sem empresa' })

    const kanbans = await db.select().from(schema.kanbans)
        .where(eq(schema.kanbans.empresa_id, userData.empresa_id))
        .orderBy(asc(schema.kanbans.created_at))

    return { success: true, data: kanbans.map(k => ({ ...k, title: k.nome })) }
})
