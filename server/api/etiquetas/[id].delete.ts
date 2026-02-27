import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const etiquetaId = getRouterParam(event, 'id')
    if (!etiquetaId) throw createError({ statusCode: 400, statusMessage: 'ID da etiqueta é obrigatório' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1)
    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa' })

    const [existingEtiqueta] = await db.select({ id: schema.etiquetas.id, empresa_id: schema.etiquetas.empresa_id, nome: schema.etiquetas.nome })
      .from(schema.etiquetas).where(eq(schema.etiquetas.id, etiquetaId)).limit(1)

    if (!existingEtiqueta) throw createError({ statusCode: 404, statusMessage: 'Etiqueta não encontrada' })
    if (existingEtiqueta.empresa_id !== userData.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })

    await db.delete(schema.etiquetas).where(eq(schema.etiquetas.id, etiquetaId))

    return { success: true, message: `Etiqueta "${existingEtiqueta.nome}" excluída com sucesso` }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
