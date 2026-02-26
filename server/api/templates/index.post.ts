<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, messageTemplates } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
=======
import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const body = await readBody(event)

<<<<<<< Updated upstream
    // Get user data to verify empresa_id
    const userRows = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    const userData = userRows[0]
    if (!userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
    }

    if (!body.content) {
      throw createError({ statusCode: 400, statusMessage: 'Conteúdo é obrigatório' })
    }

    // Check if a template already exists for this user
    const existingRows = await db
      .select({ id: messageTemplates.id })
      .from(messageTemplates)
      .where(eq(messageTemplates.user_id, user.id))
      .limit(1)

    const existingTemplate = existingRows[0]

    let templateData
=======
    const [userData] = await db.select({ empresa_id: schema.users.empresa_id }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
    if (!body.content) throw createError({ statusCode: 400, statusMessage: 'Conteúdo é obrigatório' })

    // Check if user already has a template
    const [existingTemplate] = await db.select({ id: schema.messageTemplates.id })
      .from(schema.messageTemplates).where(eq(schema.messageTemplates.created_by, user.id)).limit(1)
>>>>>>> Stashed changes

    let templateData: any
    if (existingTemplate) {
<<<<<<< Updated upstream
      // Update existing
      const updated = await db
        .update(messageTemplates)
        .set({
          content: body.content,
          updated_at: new Date()
        })
        .where(eq(messageTemplates.id, existingTemplate.id))
        .returning()

      templateData = updated[0]
    } else {
      // Insert new
      const inserted = await db
        .insert(messageTemplates)
        .values({
          user_id: user.id,
          content: body.content
        })
        .returning()

      templateData = inserted[0]
    }

    return {
      success: true,
      data: templateData
    }

  } catch (error: any) {
    console.error('API templates/index.post:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro interno ao salvar modelo'
    })
=======
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
>>>>>>> Stashed changes
  }
})
