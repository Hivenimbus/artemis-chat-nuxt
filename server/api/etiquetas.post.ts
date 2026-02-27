import { eq, and } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const body = await readBody(event)
    const { nome, cor } = body

    if (!nome || !cor) throw createError({ statusCode: 400, statusMessage: 'Nome e cor são obrigatórios' })

    if (!/^#[0-9A-Fa-f]{6}$/.test(cor)) {
      throw createError({ statusCode: 400, statusMessage: 'Cor deve estar em formato hexadecimal válido (ex: #FF0000)' })
    }

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

    if (existingEtiqueta) {
      throw createError({ statusCode: 400, statusMessage: 'Já existe uma etiqueta com este nome' })
    }

    const [etiqueta] = await db.insert(schema.etiquetas).values({
      nome: nome.trim(),
      cor: cor.toUpperCase(),
      empresa_id: userData.empresa_id
    }).returning()

    if (!etiqueta) throw createError({ statusCode: 500, statusMessage: 'Erro ao criar etiqueta' })

    return {
      success: true,
      data: { ...etiqueta, usageCount: 0, createdAt: etiqueta.created_at, updatedAt: etiqueta.updated_at }
    }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
