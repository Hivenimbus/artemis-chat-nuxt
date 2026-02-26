<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, campanhas } from '~/server/db/schema'
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
=======
    const [userData] = await db.select({ empresa_id: schema.users.empresa_id }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })

    if (!body.messageText && !body.attachment) throw createError({ statusCode: 400, statusMessage: 'Mensagem ou anexo é obrigatório' })
    if (!body.inboxId) throw createError({ statusCode: 400, statusMessage: 'Caixa de entrada é obrigatória' })
>>>>>>> Stashed changes

    const campaignData = {
      empresa_id: userData.empresa_id,
<<<<<<< Updated upstream
      user_id: user.id,
      message_text: body.messageText,
      attachment_url: body.attachment?.path || body.attachmentUrl || null, // Legacy: Keep populating for now
      attachment_type: body.attachment?.type || body.attachmentType || null, // Legacy
      attachments: body.attachments || [], // New JSONB column
      recipient_type: body.recipientType || 'all',
      target_tags: body.selectedTags || [],
      scheduled_at: body.sendType === 'scheduled' ? new Date(body.scheduledDateTime) : null,
      status: body.sendType === 'scheduled' ? 'scheduled' : 'processing',
      inbox_id: body.inboxId
    }

    // Insert campaign
    const campaign = await db
      .insert(campanhas)
      .values(campaignData)
      .returning()
      .then(r => r[0])
=======
      created_by: user.id,
      message: body.messageText,
      media_url: body.attachment?.path || body.attachmentUrl || null,
      settings: {
        recipient_type: body.recipientType || 'all',
        target_tags: body.selectedTags || [],
        attachments: body.attachments || [],
        attachment_type: body.attachment?.type || body.attachmentType || null,
      },
      scheduled_at: body.sendType === 'scheduled' ? new Date(body.scheduledDateTime) : null,
      status: body.sendType === 'scheduled' ? 'scheduled' : 'running',
      inbox_id: body.inboxId,
      nome: body.nome || 'Campanha',
    }

    const [campaign] = await db.insert(schema.campanhas).values(campaignData).returning()

    if (!campaign) throw createError({ statusCode: 500, statusMessage: 'Erro ao criar campanha' })
>>>>>>> Stashed changes

    return { success: true, data: campaign }

  } catch (error: any) {
    console.error('API campanhas/index.post:', error)
<<<<<<< Updated upstream
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro interno ao criar campanha'
    })
=======
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro interno ao criar campanha' })
>>>>>>> Stashed changes
  }
})
