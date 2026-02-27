import { eq, asc } from 'drizzle-orm'
import { db, schema } from '~/server/database'

// Get columns for a given kanban
export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

    const kanbanId = getRouterParam(event, 'id')
    if (!kanbanId) throw createError({ statusCode: 400, statusMessage: 'ID do kanban inválido' })

    const colunas = await db.select().from(schema.kanbanColunas)
        .where(eq(schema.kanbanColunas.kanban_id, kanbanId))
        .orderBy(asc(schema.kanbanColunas.ordem))

    return { success: true, data: colunas.map(c => ({ ...c, title: c.nome, position: c.ordem, icon: c.icone, color: c.cor })) }
})
