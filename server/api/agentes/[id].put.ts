import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID não fornecido' })

    const body = await readBody(event)
    const { name, email, role, inbox_ids } = body

    // Verificar permissão (mesma empresa)
    const [requestorData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    const [targetUserData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, id)).limit(1)

    if (!requestorData?.empresa_id || requestorData.empresa_id !== targetUserData?.empresa_id) {
      throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })
    }

    await db.update(schema.users).set({ name, email, role, updated_at: new Date() }).where(eq(schema.users.id, id))

    // Atualizar associações de inboxes
    if (inbox_ids && Array.isArray(inbox_ids)) {
      await db.delete(schema.inboxAgents).where(eq(schema.inboxAgents.user_id, id))
      if (inbox_ids.length > 0) {
        await db.insert(schema.inboxAgents).values(
          inbox_ids.map((inboxId: string) => ({ user_id: id, inbox_id: inboxId }))
        ).onConflictDoNothing()
      }
    }

    return { success: true }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})
