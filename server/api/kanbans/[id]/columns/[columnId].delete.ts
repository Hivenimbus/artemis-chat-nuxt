import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

// Delete a column
export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })

    const columnId = getRouterParam(event, 'columnId')
    if (!columnId) throw createError({ statusCode: 400, statusMessage: 'ID da coluna inválido' })

    await db.delete(schema.kanbanColunas).where(eq(schema.kanbanColunas.id, columnId))

    return { success: true }
})
