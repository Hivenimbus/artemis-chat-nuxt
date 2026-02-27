import { eq, and, ne } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const etiquetaId = getRouterParam(event, 'id')
    if (!etiquetaId) throw createError({ statusCode: 400, statusMessage: 'ID da etiqueta é obrigatório' })

    const body = await readBody(event)
    const { nome, cor } = body

    if (!nome || !cor) throw createError({ statusCode: 400, statusMessage: 'Nome e cor são obrigatórios' })
    if (!/^#[0-9A-Fa-f]{6}$/.test(cor)) throw createError({ statusCode: 400, statusMessage: 'Cor inválida' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1)
    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa' })

    const [existingEtiqueta] = await db.select({ id: schema.etiquetas.id, empresa_id: schema.etiquetas.empresa_id })
      .from(schema.etiquetas).where(eq(schema.etiquetas.id, etiquetaId)).limit(1)

    if (!existingEtiqueta) throw createError({ statusCode: 404, statusMessage: 'Etiqueta não encontrada' })
    if (existingEtiqueta.empresa_id !== userData.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })

    // Check for duplicate name (excluding self)
    const [duplicate] = await db.select({ id: schema.etiquetas.id }).from(schema.etiquetas)
      .where(and(eq(schema.etiquetas.empresa_id, userData.empresa_id), eq(schema.etiquetas.nome, nome.trim()), ne(schema.etiquetas.id, etiquetaId)))
      .limit(1)

    if (duplicate) throw createError({ statusCode: 400, statusMessage: 'Já existe outra etiqueta com este nome' })

    const [etiqueta] = await db.update(schema.etiquetas)
      .set({ nome: nome.trim(), cor: cor.toUpperCase(), updated_at: new Date() })
      .where(eq(schema.etiquetas.id, etiquetaId))
      .returning()

    if (!etiqueta) throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar etiqueta' })

    return { success: true, data: { ...etiqueta, usageCount: 0, createdAt: etiqueta.created_at, updatedAt: etiqueta.updated_at } }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
