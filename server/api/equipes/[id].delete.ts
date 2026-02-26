import { db } from '~/server/db'
import { users, equipes } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const id = event.context.params?.id
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID não fornecido' })

    // Verificar permissões (se é da mesma empresa)
    const team = await db
      .select({ empresa_id: equipes.empresa_id })
      .from(equipes)
      .where(eq(equipes.id, id))
      .limit(1)
      .then(r => r[0])

    if (!team) {
      throw createError({ statusCode: 404, statusMessage: 'Equipe não encontrada' })
    }

    // Buscar dados do usuário solicitante
    const userData = await db
      .select({ empresa_id: users.empresa_id, role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (userData?.role !== 'superadmin' && userData?.empresa_id !== team.empresa_id) {
      throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })
    }

    // Excluir equipe
    await db
      .delete(equipes)
      .where(eq(equipes.id, id))

    return { success: true }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})
