import { eq, ilike, inArray, desc, and, or } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário não está associado a nenhuma empresa' })

    const query = getQuery(event)
    const searchTerm = (query.search as string) || ''
    const tagsParam = (query.tags as string) || ''
    const tags = tagsParam ? tagsParam.split(',') : []
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const offset = (page - 1) * limit

    // Filtro por tags via contato_etiquetas
    let contactIdsFromTags: string[] | null = null
    if (tags.length > 0) {
      const taggedContacts = await db.select({ contato_id: schema.contatoEtiquetas.contato_id })
        .from(schema.contatoEtiquetas).where(inArray(schema.contatoEtiquetas.etiqueta_id, tags))

      const ids = [...new Set(taggedContacts.map(tc => tc.contato_id).filter(Boolean))] as string[]
      if (ids.length === 0) {
        return { success: true, data: { contatos: [], pagination: { page, limit, totalItems: 0, totalPages: 0, startItem: 0, endItem: 0, hasNextPage: false, hasPreviousPage: false } } }
      }
      contactIdsFromTags = ids
    }

    // Build conditions
    const conditions: any[] = [eq(schema.contatos.empresa_id, userData.empresa_id)]
    if (searchTerm) {
      conditions.push(or(
        ilike(schema.contatos.nome, `%${searchTerm}%`),
        ilike(schema.contatos.sobrenome as any, `%${searchTerm}%`),
        ilike(schema.contatos.telefone, `%${searchTerm}%`)
      ))
    }
    if (contactIdsFromTags) {
      conditions.push(inArray(schema.contatos.id, contactIdsFromTags))
    }

    const [totalResult, contatos] = await Promise.all([
      db.select({ id: schema.contatos.id }).from(schema.contatos).where(and(...conditions)),
      db.query.contatos.findMany({
        where: and(...conditions),
        orderBy: [desc(schema.contatos.created_at)],
        limit,
        offset,
        with: { etiqueta: true }
      })
    ])

    const totalItems = totalResult.length
    const totalPages = Math.ceil(totalItems / limit)

    const contatosFormatados = contatos.map(contato => ({
      ...contato,
      tags: contato.etiqueta ? [{ name: contato.etiqueta.nome, color: contato.etiqueta.cor || '#6B7280' }] : [],
      name: contato.nome,
      lastName: (contato as any).sobrenome || '',
      phone: contato.telefone,
      company: (contato as any).empresa || '',
      city: (contato as any).cidade || '',
      profilePictureUrl: contato.profile_picture_url || '',
      lastContact: contato.created_at
    }))

    return {
      success: true,
      data: {
        contatos: contatosFormatados,
        pagination: {
          page, limit, totalItems, totalPages,
          startItem: totalItems === 0 ? 0 : offset + 1,
          endItem: Math.min(offset + limit, totalItems),
          hasNextPage: page < totalPages, hasPreviousPage: page > 1
        }
      }
    }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
