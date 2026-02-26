<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, etiquetas } from '~/server/db/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/etiquetas: Iniciando requisição')

=======
import { eq, desc } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
>>>>>>> Stashed changes
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

<<<<<<< Updated upstream
    if (!user) {
      console.error('API /api/etiquetas: Usuário não autenticado no contexto')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    console.log('API /api/etiquetas: Usuário autenticado:', user.id)

    // Buscar dados completos do usuário na tabela users
    console.log('API /api/etiquetas: Buscando dados na tabela users para ID:', user.id)
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData) {
      console.error('API /api/etiquetas: Usuário não encontrado no banco:', user.id)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar dados do usuário'
      })
    }

    console.log('API /api/etiquetas: Dados encontrados com sucesso:', {
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      empresa_id: userData.empresa_id
    })

    if (!userData.empresa_id) {
      console.error('API /api/etiquetas: Usuário não possui empresa vinculada:', {
        userId: userData.id
      })
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
=======
    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Usuário não está associado a nenhuma empresa' })
>>>>>>> Stashed changes
    }

    const etiquetasList = await db.select({
      id: schema.etiquetas.id,
      nome: schema.etiquetas.nome,
      cor: schema.etiquetas.cor,
      created_at: schema.etiquetas.created_at,
      updated_at: schema.etiquetas.updated_at,
    }).from(schema.etiquetas)
      .where(eq(schema.etiquetas.empresa_id, userData.empresa_id))
      .orderBy(desc(schema.etiquetas.created_at))

<<<<<<< Updated upstream
    // Buscar etiquetas da empresa
    console.log('API /api/etiquetas: Buscando etiquetas da empresa:', userData.empresa_id)
    const etiquetasData = await db
      .select({
        id: etiquetas.id,
        nome: etiquetas.nome,
        descricao: etiquetas.descricao,
        cor: etiquetas.cor,
        created_at: etiquetas.created_at,
        updated_at: etiquetas.updated_at
      })
      .from(etiquetas)
      .where(eq(etiquetas.empresa_id, userData.empresa_id))
      .orderBy(desc(etiquetas.created_at))

    console.log('API /api/etiquetas: Etiquetas encontradas:', etiquetasData.length)

    const etiquetasWithCount = etiquetasData.map(etiqueta => ({
      ...etiqueta,
      usageCount: 0,
      createdAt: etiqueta.created_at,
      updatedAt: etiqueta.updated_at
    }))

    console.log('API /api/etiquetas: Retornando dados com sucesso')
    return {
      success: true,
      data: etiquetasWithCount
    }

  } catch (error: any) {
    console.error('API /api/etiquetas: Erro no handler:', {
      error: error,
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      stack: error.stack
    })

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
=======
    const data = etiquetasList.map(e => ({ ...e, usageCount: 0, createdAt: e.created_at, updatedAt: e.updated_at }))

    return { success: true, data }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
>>>>>>> Stashed changes
  }
})
