import { db } from '~/server/db'
import { users, campaignAttachments } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const body = await readBody(event)

    // Get user data to find empresa_id
    const userData = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
    }

    if (!body.fileUrl) {
      throw createError({ statusCode: 400, statusMessage: 'URL do arquivo é obrigatória' })
    }

    let attachmentData

    // Check if we are updating an existing attachment (if ID provided)
    if (body.id) {
      attachmentData = await db
        .update(campaignAttachments)
        .set({
          file_url: body.fileUrl,
          file_type: body.fileType || null,
          file_name: body.fileName || null,
          caption: body.caption || null,
          updated_at: new Date()
        })
        .where(and(eq(campaignAttachments.id, body.id), eq(campaignAttachments.user_id, user.id)))
        .returning()
        .then(r => r[0])
    } else {
      // Create new
      attachmentData = await db
        .insert(campaignAttachments)
        .values({
          empresa_id: userData.empresa_id,
          user_id: user.id,
          file_url: body.fileUrl,
          file_type: body.fileType || null,
          file_name: body.fileName || null,
          caption: body.caption || null
        })
        .returning()
        .then(r => r[0])
    }

    if (!attachmentData) {
      throw createError({ statusCode: 500, statusMessage: 'Erro ao salvar anexo' })
    }

    return {
      success: true,
      data: attachmentData
    }

  } catch (error: any) {
    console.error('API attachments/index.post:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro interno ao salvar anexo'
    })
  }
})
