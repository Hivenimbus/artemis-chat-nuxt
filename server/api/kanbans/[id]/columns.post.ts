<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, kanbans, kanbanColumns, kanbanCards } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    try {
        const user = event.context.user

        if (!user) {
            throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
        }

        const kanbanId = getRouterParam(event, 'id')
        if (!kanbanId) {
            throw createError({ statusCode: 400, statusMessage: 'ID do kanban é obrigatório' })
        }

        const [dbUser] = await db.select({ empresa_id: users.empresa_id })
            .from(users).where(eq(users.id, user.id)).limit(1)

        if (!dbUser?.empresa_id) {
            throw createError({ statusCode: 403, statusMessage: 'Usuário sem empresa associada' })
        }

        // Verificar se o kanban pertence à empresa
        const [kanban] = await db.select({ id: kanbans.id, empresa_id: kanbans.empresa_id })
            .from(kanbans).where(eq(kanbans.id, kanbanId)).limit(1)

        if (!kanban || kanban.empresa_id !== dbUser.empresa_id) {
            throw createError({ statusCode: 404, statusMessage: 'Kanban não encontrado' })
        }

        const body = await readBody(event)

        if (!body.title) {
            throw createError({ statusCode: 400, statusMessage: 'Título da coluna é obrigatório' })
        }

        // Calcular posição
        const existingColumns = await db.select({ position: kanbanColumns.position })
            .from(kanbanColumns)
            .where(eq(kanbanColumns.kanban_id, kanbanId))

        const maxPosition = existingColumns.reduce((max, col) => Math.max(max, col.position || 0), -1)

        const [newColumn] = await db.insert(kanbanColumns)
            .values({
                kanban_id: kanbanId,
                title: body.title,
                icon: body.icon || null,
                color: body.color || null,
                position: maxPosition + 1
            })
            .returning()

        return { success: true, data: newColumn }

    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Erro interno do servidor'
        })
    }
=======
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
>>>>>>> Stashed changes
})
