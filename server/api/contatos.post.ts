<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, contatos, etiquetas, contatoEtiquetas, inboxes } from '~/server/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
=======
import { eq, inArray } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes
import { checkWhatsAppNumber } from '~/server/lib/evolution'

export default defineEventHandler(async (event) => {
  try {
<<<<<<< Updated upstream
    console.log('API /api/contatos (POST): Iniciando requisição')

=======
>>>>>>> Stashed changes
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

<<<<<<< Updated upstream
    // Buscar dados completos do usuário na tabela users
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData) {
      console.error('API /api/contatos (POST): Erro ao buscar dados do usuário')
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar dados do usuário'
      })
    }

    if (!userData.empresa_id) {
      console.error('API /api/contatos (POST): Usuário não possui empresa vinculada')
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Obter corpo da requisição
=======
    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário não está associado a nenhuma empresa' })

>>>>>>> Stashed changes
    const body = await readBody(event)
    const { nome, email, telefone, tags = [] } = body

    if (!nome || !telefone) throw createError({ statusCode: 400, statusMessage: 'Campos obrigatórios: nome, telefone' })

    if (email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) throw createError({ statusCode: 400, statusMessage: 'Email inválido' })
    }

    let cleanPhone = telefone.replace(/\D/g, '')
    if (!cleanPhone.startsWith('55')) cleanPhone = '55' + cleanPhone
    if (cleanPhone.length < 12 || cleanPhone.length > 13) {
      throw createError({ statusCode: 400, statusMessage: 'Telefone inválido (deve ter 12-13 dígitos com código do país 55)' })
    }

    // Buscar primeira inbox da empresa para validar WhatsApp
<<<<<<< Updated upstream
    console.log('API /api/contatos (POST): Buscando inbox para validação WhatsApp')
    const inbox = await db
      .select({ id: inboxes.id })
      .from(inboxes)
      .where(eq(inboxes.empresa_id, userData.empresa_id))
      .limit(1)
      .then(r => r[0])

    if (!inbox) {
      console.error('API /api/contatos (POST): Nenhuma inbox encontrada')
      throw createError({
        statusCode: 400,
        statusMessage: 'Nenhuma caixa de entrada configurada. Configure uma caixa de entrada antes de criar contatos.'
      })
    }
=======
    const [inbox] = await db.select({ id: schema.inboxes.id })
      .from(schema.inboxes).where(eq(schema.inboxes.empresa_id, userData.empresa_id)).limit(1)

    if (!inbox) throw createError({ statusCode: 400, statusMessage: 'Nenhuma caixa de entrada configurada.' })
>>>>>>> Stashed changes

    const whatsappCheck = await checkWhatsAppNumber(inbox.id, cleanPhone)
    if (whatsappCheck.error) throw createError({ statusCode: 500, statusMessage: `Erro ao verificar WhatsApp: ${whatsappCheck.error}` })
    if (!whatsappCheck.exists) throw createError({ statusCode: 400, statusMessage: `O número ${cleanPhone} não possui WhatsApp ativo.` })

    const [novoContato] = await db.insert(schema.contatos).values({
      nome: nome.trim(),
      telefone: cleanPhone,
      empresa_id: userData.empresa_id,
    }).returning()

    // Associar etiquetas pelo nome
    if (tags.length > 0) {
      const etiquetas = await db.select({ id: schema.etiquetas.id })
        .from(schema.etiquetas)
        .where(eq(schema.etiquetas.empresa_id, userData.empresa_id))

<<<<<<< Updated upstream
    console.log('API /api/contatos (POST): Número validado com WhatsApp, criando contato')

    // Inserir contato
    const novoContato = await db
      .insert(contatos)
      .values({
        nome: nome.trim(),
        sobrenome: body.sobrenome?.trim() || null,
        email: email?.trim().toLowerCase() || null,
        telefone: cleanPhone,
        cidade: body.cidade?.trim() || null,
        pais: body.pais?.trim() || null,
        biografia: body.biografia?.trim() || null,
        empresa: body.empresa?.trim() || null,
        endereco: body.endereco?.trim() || null,
        empresa_id: userData.empresa_id
      })
      .returning()
      .then(r => r[0])

    if (!novoContato) {
      console.error('API /api/contatos (POST): Erro ao criar contato')
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao criar contato'
      })
    }

    console.log('API /api/contatos (POST): Contato criado:', novoContato.id)

    // Associar etiquetas se fornecidas
    if (tags && tags.length > 0) {
      console.log('API /api/contatos (POST): Associando etiquetas:', tags)

      try {
        const etiquetasExistentes = await db
          .select({ id: etiquetas.id, nome: etiquetas.nome })
          .from(etiquetas)
          .where(and(eq(etiquetas.empresa_id, userData.empresa_id), inArray(etiquetas.nome, tags)))

        if (etiquetasExistentes.length > 0) {
          const associacoes = etiquetasExistentes.map(etiqueta => ({
            contato_id: novoContato.id,
            etiqueta_id: etiqueta.id
          }))

          await db.insert(contatoEtiquetas).values(associacoes)
          console.log('API /api/contatos (POST): Etiquetas associadas com sucesso')
        }
      } catch (etiquetaErr) {
        console.error('API /api/contatos (POST): Erro ao associar etiquetas:', etiquetaErr)
        // Não falhar a criação do contato se der erro nas etiquetas
      }
    }

    // Buscar contato completo com etiquetas para retornar
    const tagsLinks = await db
      .select({
        etiqueta_id: contatoEtiquetas.etiqueta_id,
        nome: etiquetas.nome,
        cor: etiquetas.cor
      })
      .from(contatoEtiquetas)
      .innerJoin(etiquetas, eq(contatoEtiquetas.etiqueta_id, etiquetas.id))
      .where(eq(contatoEtiquetas.contato_id, novoContato.id))

    const contatoFormatado = {
      ...novoContato,
      tags: tagsLinks.map(t => t.nome),
      name: novoContato.nome,
      lastName: novoContato.sobrenome || '',
      phone: novoContato.telefone,
      country: novoContato.pais || '',
      company: novoContato.empresa || '',
      address: novoContato.endereco || '',
      city: novoContato.cidade || '',
      biography: novoContato.biografia || '',
      lastContact: novoContato.created_at
    }

    console.log('API /api/contatos (POST): Contato criado com sucesso')
=======
      const matchingEtiquetas = etiquetas.filter((e: any) => tags.includes(e.nome))
      if (matchingEtiquetas.length > 0) {
        await db.insert(schema.contatoEtiquetas).values(
          matchingEtiquetas.map((e: any) => ({ contato_id: novoContato.id, etiqueta_id: e.id }))
        ).onConflictDoNothing()
      }
    }

    const contatoCompleto = await db.query.contatos.findFirst({
      where: eq(schema.contatos.id, novoContato.id),
      with: { etiqueta: true }
    })
>>>>>>> Stashed changes

    return {
      success: true,
      data: {
        ...contatoCompleto,
        tags: contatoCompleto?.etiqueta ? [{ name: (contatoCompleto.etiqueta as any).nome }] : [],
        name: contatoCompleto?.nome, phone: contatoCompleto?.telefone,
        lastContact: contatoCompleto?.created_at
      }
    }

  } catch (error: any) {
<<<<<<< Updated upstream
    console.error('API /api/contatos (POST): Erro no handler:', error)

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
