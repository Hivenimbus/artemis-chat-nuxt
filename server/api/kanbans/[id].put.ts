import { eq, and } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID inválido' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
        .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Sem empresa' })

    const body = await readBody(event)
    if (!body.title?.trim()) throw createError({ statusCode: 400, statusMessage: 'Nome é obrigatório' })

    const [updated] = await db.update(schema.kanbans)
        .set({ nome: body.title.trim(), updated_at: new Date() })
        .where(and(eq(schema.kanbans.id, id), eq(schema.kanbans.empresa_id, userData.empresa_id)))
        .returning()

    if (!updated) throw createError({ statusCode: 404, statusMessage: 'Kanban não encontrado' })

    return { success: true, data: { ...updated, title: updated.nome } }
})
