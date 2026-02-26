<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
=======
import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
    // Buscar dados completos do usuário na tabela users
    console.log('API /api/user: Buscando dados na tabela users para ID:', user.id)
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData) {
      console.error('API /api/user: Usuário não encontrado no banco:', user.id)
      throw createError({
        statusCode: 404,
        statusMessage: 'Usuário não encontrado'
      })
=======
    const [userData] = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData) {
      throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado' })
>>>>>>> Stashed changes
    }

    console.log('API /api/user: Dados encontrados com sucesso:', {
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      empresa_id: userData.empresa_id
    })

    return { success: true, data: userData }

  } catch (error: any) {
<<<<<<< Updated upstream
    console.error('API /api/user: Erro no handler:', {
      error: error,
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      stack: error.stack
    })

    // Se já for um erro criado, retornar como está
    if (error.statusCode) {
      throw error
    }

    // Erro genérico
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
=======
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
>>>>>>> Stashed changes
  }
})
