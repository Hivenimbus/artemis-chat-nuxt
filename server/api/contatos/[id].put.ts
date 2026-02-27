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

    const body = await readBody(event)
    const { nome, email, telefone, tags = [] } = body

    if (!nome || !telefone) throw createError({ statusCode: 400, statusMessage: 'Campos obrigatórios: nome, telefone' })

    let cleanPhone = telefone.replace(/\D/g, '')
    if (!cleanPhone.startsWith('55')) cleanPhone = '55' + cleanPhone

    // Verificar se contato pertence à empresa
    const [contatoExistente] = await db.select({ id: schema.contatos.id })
      .from(schema.contatos)
      .where(and(eq(schema.contatos.id, contatoId), eq(schema.contatos.empresa_id, userData.empresa_id)))
      .limit(1)

    if (!contatoExistente) throw createError({ statusCode: 404, statusMessage: 'Contato não encontrado' })

    // Atualizar contato
    await db.update(schema.contatos)
      .set({
        nome: nome.trim(),
        telefone: cleanPhone,
        updated_at: new Date()
      })
      .where(eq(schema.contatos.id, contatoId))

    // Atualizar etiquetas
    await db.delete(schema.contatoEtiquetas).where(eq(schema.contatoEtiquetas.contato_id, contatoId))

    if (tags.length > 0) {
      const etiquetas = await db.select({ id: schema.etiquetas.id, nome: schema.etiquetas.nome })
        .from(schema.etiquetas).where(eq(schema.etiquetas.empresa_id, userData.empresa_id))

      const matching = etiquetas.filter((e: any) => tags.includes(e.nome))
      if (matching.length > 0) {
        await db.insert(schema.contatoEtiquetas).values(
          matching.map((e: any) => ({ contato_id: contatoId, etiqueta_id: e.id }))
        ).onConflictDoNothing()
      }
    }

    const contatoCompleto = await db.query.contatos.findFirst({
      where: eq(schema.contatos.id, contatoId),
      with: { etiqueta: true }
    })

    return {
      success: true,
      data: {
        ...contatoCompleto,
        tags: contatoCompleto?.etiqueta ? [{ id: (contatoCompleto.etiqueta as any).id, name: (contatoCompleto.etiqueta as any).nome, color: (contatoCompleto.etiqueta as any).cor }] : [],
        name: contatoCompleto?.nome, phone: contatoCompleto?.telefone
      }
    }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno do servidor' })
  }
})
