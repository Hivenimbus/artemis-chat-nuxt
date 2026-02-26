import { db } from '~/server/db'
import { users, campanhas } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID da campanha é obrigatório' })
    }

    const body = await readBody(event)
    const { action } = body

    if (!action || !['cancel', 'pause', 'resume'].includes(action)) {
      throw createError({ statusCode: 400, statusMessage: 'Ação inválida. Use: cancel, pause ou resume' })
    }

    // Get user's empresa_id
    const userData = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
    }

    // Get current campaign
    const campaign = await db
      .select({ id: campanhas.id, status: campanhas.status, empresa_id: campanhas.empresa_id })
      .from(campanhas)
      .where(and(eq(campanhas.id, id), eq(campanhas.empresa_id, userData.empresa_id)))
      .limit(1)
      .then(r => r[0])

    if (!campaign) {
      throw createError({ statusCode: 404, statusMessage: 'Campanha não encontrada' })
    }

    // Validate action based on current status
    let newStatus: string

    switch (action) {
      case 'cancel':
        // Can cancel from: scheduled, processing, sending, paused
        if (!['scheduled', 'processing', 'sending', 'paused'].includes(campaign.status)) {
          throw createError({
            statusCode: 400,
            statusMessage: `Não é possível cancelar uma campanha com status "${campaign.status}"`
          })
        }
        newStatus = 'cancelled'
        break

      case 'pause':
        // Can pause from: processing, sending
        if (!['processing', 'sending'].includes(campaign.status)) {
          throw createError({
            statusCode: 400,
            statusMessage: `Não é possível pausar uma campanha com status "${campaign.status}"`
          })
        }
        newStatus = 'paused'
        break

      case 'resume':
        // Can resume from: paused
        if (campaign.status !== 'paused') {
          throw createError({
            statusCode: 400,
            statusMessage: `Não é possível retomar uma campanha com status "${campaign.status}"`
          })
        }
        newStatus = 'processing'
        break

      default:
        throw createError({ statusCode: 400, statusMessage: 'Ação não reconhecida' })
    }

    // Update campaign status
    const updatedCampaign = await db
      .update(campanhas)
      .set({
        status: newStatus,
        updated_at: new Date()
      })
      .where(eq(campanhas.id, id))
      .returning()
      .then(r => r[0])

    return {
      success: true,
      data: updatedCampaign
    }

  } catch (error: any) {
    console.error('API campanhas/[id].patch:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro interno ao atualizar campanha'
    })
  }
})
