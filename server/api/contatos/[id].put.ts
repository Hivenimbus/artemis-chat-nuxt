import { db } from '~/server/db'
import { users, contatos, etiquetas, contatoEtiquetas } from '~/server/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/contatos/[id] (PUT): Iniciando requisição')

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

    const user = event.context.user

    if (!user) {
      console.error('API /api/contatos/[id] (PUT): Usuário não autenticado no contexto')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    // Buscar dados completos do usuário na tabela users
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData || !userData.empresa_id) {
      console.error('API /api/contatos/[id] (PUT): Usuário não possui empresa vinculada')
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Obter corpo da requisição
    const body = await readBody(event)

    const { nome, email, telefone, tags = [] } = body

    if (!nome || !telefone) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Campos obrigatórios: nome, telefone'
      })
    }

    // Validar formato do email apenas se fornecido
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Email inválido'
        })
      }
    }

    // Validar e normalizar telefone
    let cleanPhone = telefone.replace(/\D/g, '')

    if (!cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone
    }

    if (cleanPhone.length < 12 || cleanPhone.length > 13) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Telefone inválido (deve ter 12-13 dígitos com código do país 55)'
      })
    }

    console.log('API /api/contatos/[id] (PUT): Dados validados, verificando contato:', contatoId)

    // Verificar se o contato existe e pertence à empresa do usuário
    const contatoExistente = await db
      .select({ id: contatos.id, email: contatos.email })
      .from(contatos)
      .where(and(eq(contatos.id, contatoId), eq(contatos.empresa_id, userData.empresa_id)))
      .limit(1)
      .then(r => r[0])

    if (!contatoExistente) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Contato não encontrado'
      })
    }

    // Atualizar dados do contato
    await db
      .update(contatos)
      .set({
        nome: nome.trim(),
        sobrenome: body.sobrenome?.trim() || null,
        email: email?.trim().toLowerCase() || null,
        telefone: cleanPhone,
        cidade: body.cidade?.trim() || null,
        pais: body.pais?.trim() || null,
        biografia: body.biografia?.trim() || null,
        empresa: body.empresa?.trim() || null,
        endereco: body.endereco?.trim() || null,
        updated_at: new Date()
      })
      .where(and(eq(contatos.id, contatoId), eq(contatos.empresa_id, userData.empresa_id)))

    console.log('API /api/contatos/[id] (PUT): Contato atualizado:', contatoId)

    // Atualizar etiquetas: remover todas e reinserir
    await db
      .delete(contatoEtiquetas)
      .where(eq(contatoEtiquetas.contato_id, contatoId))

    if (tags && tags.length > 0) {
      console.log('API /api/contatos/[id] (PUT): Associando novas etiquetas:', tags)

      try {
        const etiquetasExistentes = await db
          .select({ id: etiquetas.id, nome: etiquetas.nome })
          .from(etiquetas)
          .where(and(eq(etiquetas.empresa_id, userData.empresa_id), inArray(etiquetas.nome, tags)))

        if (etiquetasExistentes.length > 0) {
          const associacoes = etiquetasExistentes.map(etiqueta => ({
            contato_id: contatoId,
            etiqueta_id: etiqueta.id
          }))

          await db.insert(contatoEtiquetas).values(associacoes)
          console.log('API /api/contatos/[id] (PUT): Etiquetas associadas com sucesso')
        }
      } catch (etiquetaErr) {
        console.error('API /api/contatos/[id] (PUT): Erro ao associar etiquetas:', etiquetaErr)
      }
    }

    // Buscar contato completo atualizado com etiquetas
    const contatoAtualizado = await db
      .select()
      .from(contatos)
      .where(eq(contatos.id, contatoId))
      .limit(1)
      .then(r => r[0])

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
      ...contatoAtualizado,
      tags: tagsLinks.map(t => ({
        id: t.etiqueta_id,
        name: t.nome,
        color: t.cor
      })),
      name: contatoAtualizado?.nome,
      lastName: contatoAtualizado?.sobrenome || '',
      phone: contatoAtualizado?.telefone,
      country: contatoAtualizado?.pais || '',
      company: contatoAtualizado?.empresa || '',
      address: contatoAtualizado?.endereco || '',
      city: contatoAtualizado?.cidade || '',
      biography: contatoAtualizado?.biografia || '',
      lastContact: contatoAtualizado?.created_at
    }

    console.log('API /api/contatos/[id] (PUT): Contato atualizado com sucesso')

    return {
      success: true,
      data: contatoFormatado
    }

  } catch (error: any) {
    console.error('API /api/contatos/[id] (PUT): Erro no handler:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
