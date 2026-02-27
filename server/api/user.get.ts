import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/user: Iniciando requisição')

    const user = event.context.user

    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    console.log('API /api/user: Usuário autenticado:', user.id)

    const uuidRegex = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i
    if (!uuidRegex.test(user.id)) {
      throw createError({ statusCode: 400, statusMessage: 'ID de usuário inválido' })
    }

    const [userData] = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData) {
      throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado' })
    }

    console.log('API /api/user: Dados encontrados com sucesso:', {
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      empresa_id: userData.empresa_id
    })

    return { success: true, data: userData }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
