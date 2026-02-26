<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, contatos, etiquetas, contatoEtiquetas } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/contatos/[id] (GET): Iniciando requisição')

    const contatoId = getRouterParam(event, 'id')

    if (!contatoId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do contato não fornecido'
      })
    }

    const uuidRegex = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i
    if (!uuidRegex.test(contatoId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do contato inválido'
      })
    }

    console.log('API /api/contatos/[id] (GET): Buscando contato:', contatoId)

=======
import { eq, and } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
>>>>>>> Stashed changes
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const contatoId = getRouterParam(event, 'id')
    if (!contatoId) throw createError({ statusCode: 400, statusMessage: 'ID do contato não fornecido' })

<<<<<<< Updated upstream
    // Buscar dados completos do usuário na tabela users
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData) {
      console.error('API /api/contatos/[id] (GET): Erro ao buscar dados do usuário')
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar dados do usuário'
      })
    }

    if (!userData.empresa_id) {
      console.error('API /api/contatos/[id] (GET): Usuário não possui empresa vinculada')
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Buscar contato verificando que pertence à empresa do usuário
    const contato = await db
      .select()
      .from(contatos)
      .where(and(eq(contatos.id, contatoId), eq(contatos.empresa_id, userData.empresa_id)))
      .limit(1)
      .then(r => r[0])

    if (!contato) {
      console.error('API /api/contatos/[id] (GET): Contato não encontrado')
      throw createError({
        statusCode: 404,
        statusMessage: 'Contato não encontrado'
      })
    }

    console.log('API /api/contatos/[id] (GET): Contato encontrado:', contato.id)

    // Buscar etiquetas do contato
    const tagsLinks = await db
      .select({
        etiqueta_id: contatoEtiquetas.etiqueta_id,
        nome: etiquetas.nome,
        cor: etiquetas.cor
      })
      .from(contatoEtiquetas)
      .innerJoin(etiquetas, eq(contatoEtiquetas.etiqueta_id, etiquetas.id))
      .where(eq(contatoEtiquetas.contato_id, contatoId))

    const contatoFormatado = {
      ...contato,
      tags: tagsLinks.map(t => t.nome),
      name: contato.nome,
      lastName: contato.sobrenome || '',
      phone: contato.telefone,
      country: contato.pais || '',
      company: contato.empresa || '',
      address: contato.endereco || '',
      city: contato.cidade || '',
      biography: contato.biografia || '',
      profilePictureUrl: contato.profile_picture_url || '',
      lastContact: contato.created_at
    }

    console.log('API /api/contatos/[id] (GET): Retornando contato com sucesso')
=======
    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário não está associado a nenhuma empresa' })

    const contato = await db.query.contatos.findFirst({
      where: and(eq(schema.contatos.id, contatoId), eq(schema.contatos.empresa_id, userData.empresa_id)),
      with: { etiqueta: true }
    })

    if (!contato) throw createError({ statusCode: 404, statusMessage: 'Contato não encontrado' })
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
    console.error('API /api/contatos/[id] (GET): Erro no handler:', error)

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
