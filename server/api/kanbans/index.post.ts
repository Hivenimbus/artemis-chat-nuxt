import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
        .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Sem empresa' })

    const body = await readBody(event)
    if (!body.title?.trim()) throw createError({ statusCode: 400, statusMessage: 'Nome do kanban é obrigatório' })

    const [kanban] = await db.insert(schema.kanbans).values({
        nome: body.title.trim(),
        empresa_id: userData.empresa_id,
    }).returning()

    // Create default columns if provided
    if (body.columns?.length > 0) {
        const cols = body.columns.filter((c: any) => c.name?.trim()).map((c: any, i: number) => ({
            kanban_id: kanban.id,
            nome: c.name.trim(),
            ordem: i,
        }))
        if (cols.length > 0) {
            await db.insert(schema.kanbanColunas).values(cols)
        }
    }

    return { success: true, data: { ...kanban, title: kanban.nome } }
})
