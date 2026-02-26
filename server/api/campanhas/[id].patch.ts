<<<<<<< Updated upstream
import { db } from '~/server/db'
import { users, campanhas } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'
=======
import { eq, and } from 'drizzle-orm'
import { db, schema } from '~/server/database'
>>>>>>> Stashed changes

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID da campanha é obrigatório' })

    const body = await readBody(event)
    const { action } = body

    if (!action || !['cancel', 'pause', 'resume'].includes(action)) {
      throw createError({ statusCode: 400, statusMessage: 'Ação inválida. Use: cancel, pause ou resume' })
    }

<<<<<<< Updated upstream
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
=======
    const [userData] = await db.select({ empresa_id: schema.users.empresa_id }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1)
    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })

    const [campaign] = await db.select({ id: schema.campanhas.id, status: schema.campanhas.status })
      .from(schema.campanhas)
      .where(and(eq(schema.campanhas.id, id), eq(schema.campanhas.empresa_id, userData.empresa_id)))
      .limit(1)

    if (!campaign) throw createError({ statusCode: 404, statusMessage: 'Campanha não encontrada' })

>>>>>>> Stashed changes
    let newStatus: string
    switch (action) {
      case 'cancel':
<<<<<<< Updated upstream
        // Can cancel from: scheduled, processing, sending, paused
        if (!['scheduled', 'processing', 'sending', 'paused'].includes(campaign.status)) {
          throw createError({
            statusCode: 400,
            statusMessage: `Não é possível cancelar uma campanha com status "${campaign.status}"`
          })
=======
        if (!['scheduled', 'running', 'paused'].includes(campaign.status)) {
          throw createError({ statusCode: 400, statusMessage: `Não é possível cancelar uma campanha com status "${campaign.status}"` })
>>>>>>> Stashed changes
        }
        newStatus = 'cancelled'
        break
      case 'pause':
<<<<<<< Updated upstream
        // Can pause from: processing, sending
        if (!['processing', 'sending'].includes(campaign.status)) {
          throw createError({
            statusCode: 400,
            statusMessage: `Não é possível pausar uma campanha com status "${campaign.status}"`
          })
=======
        if (!['running'].includes(campaign.status)) {
          throw createError({ statusCode: 400, statusMessage: `Não é possível pausar uma campanha com status "${campaign.status}"` })
>>>>>>> Stashed changes
        }
        newStatus = 'paused'
        break
      case 'resume':
        if (campaign.status !== 'paused') {
<<<<<<< Updated upstream
          throw createError({
            statusCode: 400,
            statusMessage: `Não é possível retomar uma campanha com status "${campaign.status}"`
          })
=======
          throw createError({ statusCode: 400, statusMessage: `Não é possível retomar uma campanha com status "${campaign.status}"` })
>>>>>>> Stashed changes
        }
        newStatus = 'running'
        break
      default:
        throw createError({ statusCode: 400, statusMessage: 'Ação não reconhecida' })
    }

<<<<<<< Updated upstream
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
=======
    const [updatedCampaign] = await db.update(schema.campanhas)
      .set({ status: newStatus, updated_at: new Date() })
      .where(eq(schema.campanhas.id, id))
      .returning()

    return { success: true, data: updatedCampaign }

  } catch (error: any) {
    console.error('API campanhas/[id].patch:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro interno ao atualizar campanha' })
>>>>>>> Stashed changes
  }
})
