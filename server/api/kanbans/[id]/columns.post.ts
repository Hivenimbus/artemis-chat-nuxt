import { eq, asc } from 'drizzle-orm'
import { db, schema } from '~/server/database'

// Add column to a kanban
export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

    const kanbanId = getRouterParam(event, 'id')
    if (!kanbanId) throw createError({ statusCode: 400, statusMessage: 'ID do kanban inválido' })

    const body = await readBody(event)
    if (!body.name?.trim()) throw createError({ statusCode: 400, statusMessage: 'Nome da coluna é obrigatório' })

    // Get current max order
    const existing = await db.select({ ordem: schema.kanbanColunas.ordem })
        .from(schema.kanbanColunas).where(eq(schema.kanbanColunas.kanban_id, kanbanId))

    const maxOrdem = existing.length > 0 ? Math.max(...existing.map(e => e.ordem)) + 1 : 0

    const [col] = await db.insert(schema.kanbanColunas).values({
        kanban_id: kanbanId,
        nome: body.name.trim(),
        cor: body.color || 'blue',
        icone: body.icon || 'clipboard',
        ordem: maxOrdem,
    }).returning()

    return { success: true, data: { ...col, title: col.nome, position: col.ordem } }
})
