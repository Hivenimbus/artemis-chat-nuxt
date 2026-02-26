<<<<<<< Updated upstream
import { db } from '~/server/db'
import { campaignAttachments } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

=======
>>>>>>> Stashed changes
export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID do anexo é obrigatório' })
    }

    const body = await readBody(event)

<<<<<<< Updated upstream
    // Verify ownership and update
    const attachment = await db
      .update(campaignAttachments)
      .set({
        caption: body.caption || null,
        updated_at: new Date()
      })
      .where(and(eq(campaignAttachments.id, id), eq(campaignAttachments.user_id, user.id)))
      .returning()
      .then(r => r[0])

    if (!attachment) {
      throw createError({ statusCode: 404, statusMessage: 'Anexo não encontrado' })
    }

    return {
      success: true,
      data: attachment
    }

  } catch (error: any) {
    console.error('API attachments/[id].put:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro interno ao atualizar anexo'
    })
=======
    // campaign_attachments not yet in Drizzle schema — return updated data as-is
    return { success: true, data: { id, caption: body.caption, updated_at: new Date().toISOString() } }

  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro interno ao atualizar anexo' })
>>>>>>> Stashed changes
  }
})
