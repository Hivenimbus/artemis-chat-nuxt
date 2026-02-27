import { eq, and } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const contatoId = getRouterParam(event, 'id')
    if (!contatoId) throw createError({ statusCode: 400, statusMessage: 'ID do contato não fornecido' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário não está associado a nenhuma empresa' })

    const contato = await db.query.contatos.findFirst({
      where: and(eq(schema.contatos.id, contatoId), eq(schema.contatos.empresa_id, userData.empresa_id)),
      with: { etiqueta: true }
    })

    if (!contato) throw createError({ statusCode: 404, statusMessage: 'Contato não encontrado' })

    return {
      success: true,
      data: {
        ...contato,
        tags: contato.etiqueta ? [(contato.etiqueta as any).nome] : [],
        name: contato.nome,
        phone: contato.telefone,
        profilePictureUrl: contato.profile_picture_url || '',
        lastContact: contato.created_at
      }
    }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
