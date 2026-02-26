<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, etiquetas } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/etiquetas POST: Iniciando requisição')

    const user = event.context.user
    console.log('API /api/etiquetas POST: Usuário do contexto:', user?.id)

    if (!user) {
      console.error('API /api/etiquetas POST: Usuário não autenticado')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    console.log('API /api/etiquetas POST: Usuário autenticado confirmado:', user.id)
=======
import { eq, and } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
>>>>>>> Stashed changes

    const body = await readBody(event)
    const { nome, cor } = body

<<<<<<< Updated upstream
    if (!nome || !cor) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nome e cor são obrigatórios'
      })
    }
=======
    if (!nome || !cor) throw createError({ statusCode: 400, statusMessage: 'Nome e cor são obrigatórios' })
>>>>>>> Stashed changes

    if (!/^#[0-9A-Fa-f]{6}$/.test(cor)) {
      throw createError({ statusCode: 400, statusMessage: 'Cor deve estar em formato hexadecimal válido (ex: #FF0000)' })
    }

<<<<<<< Updated upstream
    // Buscar dados completos do usuário na tabela users
    console.log('API /api/etiquetas POST: Buscando dados na tabela users para ID:', user.id)
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData) {
      console.error('API /api/etiquetas POST: Usuário não encontrado no banco:', user.id)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar dados do usuário'
      })
    }

    console.log('API /api/etiquetas POST: Dados encontrados com sucesso:', {
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      empresa_id: userData.empresa_id
    })

    if (!userData.empresa_id) {
      console.error('API /api/etiquetas POST: Usuário não possui empresa vinculada:', {
        userId: userData.id
      })
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    console.log('API /api/etiquetas POST: Dados do usuário validados:', {
      userId: userData.id,
      empresaId: userData.empresa_id,
      role: userData.role
    })

    // Verificar se já existe uma etiqueta com o mesmo nome na empresa
    console.log('API /api/etiquetas POST: Verificando etiqueta duplicada:', nome.trim())
    const existingEtiqueta = await db
      .select({ id: etiquetas.id })
      .from(etiquetas)
      .where(and(
        eq(etiquetas.empresa_id, userData.empresa_id),
        eq(etiquetas.nome, nome.trim())
      ))
      .limit(1)
      .then(r => r[0])
=======
    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Usuário não está associado a nenhuma empresa' })
    }

    // Check for duplicate
    const [existingEtiqueta] = await db.select({ id: schema.etiquetas.id })
      .from(schema.etiquetas)
      .where(and(eq(schema.etiquetas.empresa_id, userData.empresa_id), eq(schema.etiquetas.nome, nome.trim())))
      .limit(1)
>>>>>>> Stashed changes

    if (existingEtiqueta) {
      throw createError({ statusCode: 400, statusMessage: 'Já existe uma etiqueta com este nome' })
    }

    const [etiqueta] = await db.insert(schema.etiquetas).values({
      nome: nome.trim(),
<<<<<<< Updated upstream
      empresaId: userData.empresa_id
    })
    const etiqueta = await db
      .insert(etiquetas)
      .values({
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        cor: cor.toUpperCase(),
        empresa_id: userData.empresa_id
      })
      .returning()
      .then(r => r[0])

    if (!etiqueta) {
      console.error('API /api/etiquetas POST: Erro ao criar etiqueta')
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao criar etiqueta'
      })
    }
=======
      cor: cor.toUpperCase(),
      empresa_id: userData.empresa_id
    }).returning()

    if (!etiqueta) throw createError({ statusCode: 500, statusMessage: 'Erro ao criar etiqueta' })
>>>>>>> Stashed changes

    return {
      success: true,
      data: { ...etiqueta, usageCount: 0, createdAt: etiqueta.created_at, updatedAt: etiqueta.updated_at }
    }

  } catch (error: any) {
<<<<<<< Updated upstream
    console.error('API /api/etiquetas POST: Erro no handler:', {
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
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
>>>>>>> Stashed changes
  }
})
