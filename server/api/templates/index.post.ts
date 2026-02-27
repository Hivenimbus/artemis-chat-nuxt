import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const body = await readBody(event)

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
    if (!body.content) throw createError({ statusCode: 400, statusMessage: 'Conteúdo é obrigatório' })

    // Check if user already has a template
    const [existingTemplate] = await db.select({ id: schema.messageTemplates.id })
      .from(schema.messageTemplates).where(eq(schema.messageTemplates.created_by, user.id)).limit(1)

    let templateData: any
    if (existingTemplate) {
      const [updated] = await db.update(schema.messageTemplates)
        .set({ content: body.content, updated_at: new Date() })
        .where(eq(schema.messageTemplates.id, existingTemplate.id))
        .returning()
      templateData = updated
    } else {
      const [inserted] = await db.insert(schema.messageTemplates).values({
        created_by: user.id,
        empresa_id: userData.empresa_id,
        content: body.content,
        name: 'Draft'
      }).returning()
      templateData = inserted
    }

    return { success: true, data: templateData }

  } catch (error: any) {
    console.error('API templates/index.post:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro interno ao salvar modelo' })
  }
})
