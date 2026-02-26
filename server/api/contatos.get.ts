import { db } from '~/server/db'
import { users, contatos, etiquetas, contatoEtiquetas } from '~/server/db/schema'
import { eq, and, or, inArray, desc, ilike, count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/contatos: Iniciando requisição')

    const user = event.context.user

    if (!user) {
      console.error('API /api/contatos: Usuário não autenticado no contexto')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    console.log('API /api/contatos: Usuário autenticado:', user.id)

    // Buscar dados completos do usuário na tabela users
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData) {
      console.error('API /api/contatos: Erro ao buscar dados do usuário')
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar dados do usuário'
      })
    }

    if (!userData.empresa_id) {
      console.error('API /api/contatos: Usuário não possui empresa vinculada')
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    console.log('API /api/contatos: Empresa do usuário:', userData.empresa_id)

    // Obter query parameters para busca e paginação
    const query = getQuery(event)
    const searchTerm = (query.search as string) || ''
    const tagsParam = (query.tags as string) || ''
    const tags = tagsParam ? tagsParam.split(',') : []
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const offset = (page - 1) * limit

    // Se houver tags selecionadas, buscar IDs dos contatos vinculados
    let contactIdsToFilter: string[] | null = null

    if (tags.length > 0) {
      const taggedContacts = await db
        .select({ contato_id: contatoEtiquetas.contato_id })
        .from(contatoEtiquetas)
        .where(inArray(contatoEtiquetas.etiqueta_id, tags))

      contactIdsToFilter = [...new Set(taggedContacts.map(tc => tc.contato_id!).filter(Boolean))]

      if (contactIdsToFilter.length === 0) {
        return {
          success: true,
          data: {
            contatos: [],
            pagination: {
              page,
              limit,
              totalItems: 0,
              totalPages: 0,
              startItem: 0,
              endItem: 0,
              hasNextPage: false,
              hasPreviousPage: false
            }
          }
        }
      }
    }

    // Construir condições WHERE
    const conditions = [eq(contatos.empresa_id, userData.empresa_id)]

    if (searchTerm) {
      conditions.push(
        or(
          ilike(contatos.nome, `%${searchTerm}%`),
          ilike(contatos.sobrenome, `%${searchTerm}%`),
          ilike(contatos.email, `%${searchTerm}%`),
          ilike(contatos.telefone, `%${searchTerm}%`),
          ilike(contatos.empresa, `%${searchTerm}%`),
          ilike(contatos.cidade, `%${searchTerm}%`)
        )!
      )
    }

    if (contactIdsToFilter !== null) {
      conditions.push(inArray(contatos.id, contactIdsToFilter))
    }

    const whereClause = and(...conditions)

    // Contar total de registros
    const totalItems = await db
      .select({ total: count() })
      .from(contatos)
      .where(whereClause)
      .then(r => r[0]?.total ?? 0)

    // Buscar contatos com paginação
    const contatosRows = await db
      .select()
      .from(contatos)
      .where(whereClause)
      .orderBy(desc(contatos.created_at))
      .limit(limit)
      .offset(offset)

    // Buscar etiquetas dos contatos encontrados
    let tagsByContato: Record<string, any[]> = {}

    if (contatosRows.length > 0) {
      const contatoIds = contatosRows.map(c => c.id)

      const tagsLinks = await db
        .select({
          contato_id: contatoEtiquetas.contato_id,
          etiqueta_id: contatoEtiquetas.etiqueta_id,
          nome: etiquetas.nome,
          cor: etiquetas.cor
        })
        .from(contatoEtiquetas)
        .innerJoin(etiquetas, eq(contatoEtiquetas.etiqueta_id, etiquetas.id))
        .where(inArray(contatoEtiquetas.contato_id, contatoIds))

      tagsByContato = tagsLinks.reduce((acc, t) => {
        if (!acc[t.contato_id!]) acc[t.contato_id!] = []
        acc[t.contato_id!].push({ id: t.etiqueta_id, nome: t.nome, cor: t.cor })
        return acc
      }, {} as Record<string, any[]>)
    }

    console.log('API /api/contatos: Contatos encontrados:', contatosRows.length)

    // Formatar dados para o frontend
    const contatosFormatados = contatosRows.map(contato => {
      const etiquetasContato = (tagsByContato[contato.id] || []).map(e => ({
        name: e.nome,
        color: e.cor || '#6B7280'
      }))

      return {
        ...contato,
        tags: etiquetasContato,
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
    })

    // Calcular informações de paginação
    const totalPages = Math.ceil(Number(totalItems) / limit)
    const startItem = Number(totalItems) === 0 ? 0 : offset + 1
    const endItem = Math.min(offset + limit, Number(totalItems))

    console.log('API /api/contatos: Retornando dados com sucesso')

    return {
      success: true,
      data: {
        contatos: contatosFormatados,
        pagination: {
          page,
          limit,
          totalItems: Number(totalItems),
          totalPages,
          startItem,
          endItem,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    }

  } catch (error: any) {
    console.error('API /api/contatos: Erro no handler:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
