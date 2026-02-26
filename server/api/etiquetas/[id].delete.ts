<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, etiquetas } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/etiquetas DELETE: Iniciando requisição')

    const user = event.context.user
    console.log('API /api/etiquetas DELETE: Usuário do contexto:', user?.id)

    if (!user) {
      console.error('API /api/etiquetas DELETE: Usuário não autenticado')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    console.log('API /api/etiquetas DELETE: Usuário autenticado confirmado:', user.id)
=======
import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
>>>>>>> Stashed changes

    const etiquetaId = getRouterParam(event, 'id')
    if (!etiquetaId) throw createError({ statusCode: 400, statusMessage: 'ID da etiqueta é obrigatório' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1)
    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa' })

<<<<<<< Updated upstream
    // Buscar dados completos do usuário na tabela users
    console.log('API /api/etiquetas DELETE: Buscando dados na tabela users para ID:', user.id)
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData) {
      console.error('API /api/etiquetas DELETE: Usuário não encontrado no banco:', user.id)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar dados do usuário'
      })
    }
=======
    const [existingEtiqueta] = await db.select({ id: schema.etiquetas.id, empresa_id: schema.etiquetas.empresa_id, nome: schema.etiquetas.nome })
      .from(schema.etiquetas).where(eq(schema.etiquetas.id, etiquetaId)).limit(1)

    if (!existingEtiqueta) throw createError({ statusCode: 404, statusMessage: 'Etiqueta não encontrada' })
    if (existingEtiqueta.empresa_id !== userData.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })
>>>>>>> Stashed changes

    await db.delete(schema.etiquetas).where(eq(schema.etiquetas.id, etiquetaId))

<<<<<<< Updated upstream
    if (!userData.empresa_id) {
      console.error('API /api/etiquetas DELETE: Usuário não possui empresa vinculada:', {
        userId: userData.id
      })
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    console.log('API /api/etiquetas DELETE: Dados do usuário validados:', {
      userId: userData.id,
      empresaId: userData.empresa_id,
      role: userData.role
    })

    // Verificar se a etiqueta existe e pertence à empresa do usuário
    console.log('API /api/etiquetas DELETE: Verificando existência da etiqueta:', etiquetaId)
    const existingEtiqueta = await db
      .select({ id: etiquetas.id, empresa_id: etiquetas.empresa_id, nome: etiquetas.nome })
      .from(etiquetas)
      .where(eq(etiquetas.id, etiquetaId))
      .limit(1)
      .then(r => r[0])

    if (!existingEtiqueta) {
      console.error('API /api/etiquetas DELETE: Etiqueta não encontrada:', etiquetaId)
      throw createError({
        statusCode: 404,
        statusMessage: 'Etiqueta não encontrada'
      })
    }

    if (existingEtiqueta.empresa_id !== userData.empresa_id) {
      console.error('API /api/etiquetas DELETE: Permissão negada:', {
        etiquetaId,
        etiquetaEmpresa: existingEtiqueta.empresa_id,
        userEmpresa: userData.empresa_id
      })
      throw createError({
        statusCode: 403,
        statusMessage: 'Sem permissão para excluir esta etiqueta'
      })
    }

    // Excluir etiqueta
    console.log('API /api/etiquetas DELETE: Excluindo etiqueta:', existingEtiqueta.nome)
    await db
      .delete(etiquetas)
      .where(eq(etiquetas.id, etiquetaId))

    console.log('API /api/etiquetas DELETE: Etiqueta excluída com sucesso:', etiquetaId)

    console.log('API /api/etiquetas DELETE: Retornando resposta com sucesso')
    return {
      success: true,
      message: `Etiqueta "${existingEtiqueta.nome}" excluída com sucesso`
    }

  } catch (error: any) {
    console.error('API /api/etiquetas DELETE: Erro no handler:', {
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
    return { success: true, message: `Etiqueta "${existingEtiqueta.nome}" excluída com sucesso` }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
>>>>>>> Stashed changes
  }
})
