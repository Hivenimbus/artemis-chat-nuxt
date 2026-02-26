<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, kanbans, kanbanColumns } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    const body = await readBody(event)

    if (!body.title) {
      throw createError({
        statusCode: 400,
        statusMessage: 'O título do kanban é obrigatório'
      })
    }

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!dbUser || !dbUser.empresa_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário sem empresa associada'
      })
    }

    const [kanban] = await db
      .insert(kanbans)
      .values({
        empresa_id: dbUser.empresa_id,
        created_by: user.id,
        title: body.title,
        description: body.description || null
      })
      .returning()

    let columns: typeof kanbanColumns.$inferSelect[] = []

    if (body.columns && Array.isArray(body.columns) && body.columns.length > 0) {
      columns = await db
        .insert(kanbanColumns)
        .values(
          body.columns.map((col: { title: string; icon?: string; color?: string; position?: number }) => ({
            kanban_id: kanban.id,
            title: col.title,
            icon: col.icon || null,
            color: col.color || null,
            position: col.position ?? 0
          }))
        )
        .returning()
    }

    return {
      success: true,
      data: { kanban, columns }
    }

  } catch (error: any) {
    console.error('Erro ao criar kanban:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro interno do servidor'
    })
  }
=======
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
            cor: c.color || 'blue',
            icone: c.icon || 'clipboard',
            ordem: i,
        }))
        if (cols.length > 0) {
            await db.insert(schema.kanbanColunas).values(cols)
        }
    }

    return { success: true, data: { ...kanban, title: kanban.nome } }
>>>>>>> Stashed changes
})
