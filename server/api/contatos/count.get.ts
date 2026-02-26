<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, contatos, contatoEtiquetas } from '~/server/db/schema'
import { eq, and, inArray, count } from 'drizzle-orm'
=======
import { eq, inArray } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

<<<<<<< Updated upstream
    // Buscar dados do usuário para obter empresa_id
    const userData = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
    }
=======
    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
>>>>>>> Stashed changes

    const query = getQuery(event)
    const type = query.type as string
    const tagsParam = query.tags
    const tags = tagsParam
      ? (Array.isArray(tagsParam) ? tagsParam : [tagsParam]) as string[]
      : []

    let total = 0

    if (type === 'all') {
<<<<<<< Updated upstream
      total = await db
        .select({ total: count() })
        .from(contatos)
        .where(eq(contatos.empresa_id, userData.empresa_id))
        .then(r => Number(r[0]?.total ?? 0))

    } else if (type === 'tags' && tags.length > 0) {
      // Buscar IDs de contatos que possuem as tags informadas
      const taggedContacts = await db
        .select({ contato_id: contatoEtiquetas.contato_id })
        .from(contatoEtiquetas)
        .where(inArray(contatoEtiquetas.etiqueta_id, tags))

      const contactIds = [...new Set(taggedContacts.map(tc => tc.contato_id!).filter(Boolean))]

      if (contactIds.length > 0) {
        total = await db
          .select({ total: count() })
          .from(contatos)
          .where(and(eq(contatos.empresa_id, userData.empresa_id), inArray(contatos.id, contactIds)))
          .then(r => Number(r[0]?.total ?? 0))
      }
    }

    return {
      success: true,
      count: total
    }

  } catch (error: any) {
    console.error('API contatos/count.get:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro interno ao contar contatos'
    })
=======
      const rows = await db.select({ id: schema.contatos.id }).from(schema.contatos)
        .where(eq(schema.contatos.empresa_id, userData.empresa_id))
      count = rows.length
    } else if (type === 'tags' && tags.length > 0) {
      const tagged = await db.select({ contato_id: schema.contatoEtiquetas.contato_id })
        .from(schema.contatoEtiquetas).where(inArray(schema.contatoEtiquetas.etiqueta_id, tags as string[]))
      const ids = [...new Set(tagged.map(t => t.contato_id).filter(Boolean))] as string[]
      if (ids.length > 0) {
        const rows = await db.select({ id: schema.contatos.id }).from(schema.contatos)
          .where(inArray(schema.contatos.id, ids))
        count = rows.length
      }
    }

    return { success: true, count }

  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro interno ao contar contatos' })
>>>>>>> Stashed changes
  }
})
