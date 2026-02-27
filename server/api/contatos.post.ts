import { eq, inArray } from 'drizzle-orm'
import { db, schema } from '~/server/database'
import { checkWhatsAppNumber } from '~/server/lib/evolution'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário não está associado a nenhuma empresa' })

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
    const [inbox] = await db.select({ id: schema.inboxes.id })
      .from(schema.inboxes).where(eq(schema.inboxes.empresa_id, userData.empresa_id)).limit(1)

    if (!inbox) throw createError({ statusCode: 400, statusMessage: 'Nenhuma caixa de entrada configurada.' })

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
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
