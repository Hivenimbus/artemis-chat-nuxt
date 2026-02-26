<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, etiquetas } from '~/server/db/schema'
import { eq, and, ne } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/etiquetas PUT: Iniciando requisição')

    const user = event.context.user
    console.log('API /api/etiquetas PUT: Usuário do contexto:', user?.id)

    if (!user) {
      console.error('API /api/etiquetas PUT: Usuário não autenticado')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    console.log('API /api/etiquetas PUT: Usuário autenticado confirmado:', user.id)
=======
import { eq, and, ne } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
>>>>>>> Stashed changes

    const etiquetaId = getRouterParam(event, 'id')
    if (!etiquetaId) throw createError({ statusCode: 400, statusMessage: 'ID da etiqueta é obrigatório' })

    const body = await readBody(event)
    const { nome, cor } = body

<<<<<<< Updated upstream
    if (!nome || !cor) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nome e cor são obrigatórios'
      })
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(cor)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cor deve estar em formato hexadecimal válido (ex: #FF0000)'
      })
    }

    // Buscar dados completos do usuário na tabela users
    console.log('API /api/etiquetas PUT: Buscando dados na tabela users para ID:', user.id)
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData) {
      console.error('API /api/etiquetas PUT: Usuário não encontrado no banco:', user.id)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar dados do usuário'
      })
    }
=======
    if (!nome || !cor) throw createError({ statusCode: 400, statusMessage: 'Nome e cor são obrigatórios' })
    if (!/^#[0-9A-Fa-f]{6}$/.test(cor)) throw createError({ statusCode: 400, statusMessage: 'Cor inválida' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1)
    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa' })

    const [existingEtiqueta] = await db.select({ id: schema.etiquetas.id, empresa_id: schema.etiquetas.empresa_id })
      .from(schema.etiquetas).where(eq(schema.etiquetas.id, etiquetaId)).limit(1)

    if (!existingEtiqueta) throw createError({ statusCode: 404, statusMessage: 'Etiqueta não encontrada' })
    if (existingEtiqueta.empresa_id !== userData.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })
>>>>>>> Stashed changes

    // Check for duplicate name (excluding self)
    const [duplicate] = await db.select({ id: schema.etiquetas.id }).from(schema.etiquetas)
      .where(and(eq(schema.etiquetas.empresa_id, userData.empresa_id), eq(schema.etiquetas.nome, nome.trim()), ne(schema.etiquetas.id, etiquetaId)))
      .limit(1)

<<<<<<< Updated upstream
    if (!userData.empresa_id) {
      console.error('API /api/etiquetas PUT: Usuário não possui empresa vinculada:', {
        userId: userData.id
      })
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }
=======
    if (duplicate) throw createError({ statusCode: 400, statusMessage: 'Já existe outra etiqueta com este nome' })
>>>>>>> Stashed changes

    const [etiqueta] = await db.update(schema.etiquetas)
      .set({ nome: nome.trim(), cor: cor.toUpperCase(), updated_at: new Date() })
      .where(eq(schema.etiquetas.id, etiquetaId))
      .returning()

<<<<<<< Updated upstream
    // Verificar se a etiqueta existe e pertence à empresa do usuário
    console.log('API /api/etiquetas PUT: Verificando existência da etiqueta:', etiquetaId)
    const existingEtiqueta = await db
      .select({ id: etiquetas.id, empresa_id: etiquetas.empresa_id })
      .from(etiquetas)
      .where(eq(etiquetas.id, etiquetaId))
      .limit(1)
      .then(r => r[0])

    if (!existingEtiqueta) {
      console.error('API /api/etiquetas PUT: Etiqueta não encontrada:', etiquetaId)
      throw createError({
        statusCode: 404,
        statusMessage: 'Etiqueta não encontrada'
      })
    }

    if (existingEtiqueta.empresa_id !== userData.empresa_id) {
      console.error('API /api/etiquetas PUT: Permissão negada:', {
        etiquetaId,
        etiquetaEmpresa: existingEtiqueta.empresa_id,
        userEmpresa: userData.empresa_id
      })
      throw createError({
        statusCode: 403,
        statusMessage: 'Sem permissão para editar esta etiqueta'
      })
    }

    // Verificar se já existe outra etiqueta com o mesmo nome na empresa
    if (nome) {
      console.log('API /api/etiquetas PUT: Verificando duplicata:', nome.trim())
      const duplicateEtiqueta = await db
        .select({ id: etiquetas.id })
        .from(etiquetas)
        .where(and(
          eq(etiquetas.empresa_id, userData.empresa_id),
          eq(etiquetas.nome, nome.trim()),
          ne(etiquetas.id, etiquetaId)
        ))
        .limit(1)
        .then(r => r[0])

      if (duplicateEtiqueta) {
        console.error('API /api/etiquetas PUT: Etiqueta duplicada encontrada:', duplicateEtiqueta.id)
        throw createError({
          statusCode: 400,
          statusMessage: 'Já existe outra etiqueta com este nome'
        })
      }
    }

    // Atualizar etiqueta
    console.log('API /api/etiquetas PUT: Atualizando etiqueta:', etiquetaId)
    const etiqueta = await db
      .update(etiquetas)
      .set({
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        cor: cor.toUpperCase()
      })
      .where(eq(etiquetas.id, etiquetaId))
      .returning()
      .then(r => r[0])

    if (!etiqueta) {
      console.error('API /api/etiquetas PUT: Erro ao atualizar etiqueta:', etiquetaId)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao atualizar etiqueta'
      })
    }

    console.log('API /api/etiquetas PUT: Etiqueta atualizada com sucesso:', etiqueta.id)

    console.log('API /api/etiquetas PUT: Retornando dados com sucesso')
    return {
      success: true,
      data: {
        ...etiqueta,
        usageCount: 0,
        createdAt: etiqueta.created_at,
        updatedAt: etiqueta.updated_at
      }
    }

  } catch (error: any) {
    console.error('API /api/etiquetas PUT: Erro no handler:', {
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
    if (!etiqueta) throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar etiqueta' })

    return { success: true, data: { ...etiqueta, usageCount: 0, createdAt: etiqueta.created_at, updatedAt: etiqueta.updated_at } }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
>>>>>>> Stashed changes
  }
})
