import { eq, and } from 'drizzle-orm'
import { db, schema } from '~/server/database'

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

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1)
    if (!userData?.empresa_id) throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })

    const [campaign] = await db.select({ id: schema.campanhas.id, status: schema.campanhas.status })
      .from(schema.campanhas)
      .where(and(eq(schema.campanhas.id, id), eq(schema.campanhas.empresa_id, userData.empresa_id)))
      .limit(1)

    if (!campaign) throw createError({ statusCode: 404, statusMessage: 'Campanha não encontrada' })

    let newStatus: string
    switch (action) {
      case 'cancel':
        if (!['scheduled', 'running', 'paused'].includes(campaign.status)) {
          throw createError({ statusCode: 400, statusMessage: `Não é possível cancelar uma campanha com status "${campaign.status}"` })
        }
        newStatus = 'cancelled'
        break
      case 'pause':
        if (!['running'].includes(campaign.status)) {
          throw createError({ statusCode: 400, statusMessage: `Não é possível pausar uma campanha com status "${campaign.status}"` })
        }
        newStatus = 'paused'
        break
      case 'resume':
        if (campaign.status !== 'paused') {
          throw createError({ statusCode: 400, statusMessage: `Não é possível retomar uma campanha com status "${campaign.status}"` })
        }
        newStatus = 'running'
        break
      default:
        throw createError({ statusCode: 400, statusMessage: 'Ação não reconhecida' })
    }

    const [updatedCampaign] = await db.update(schema.campanhas)
      .set({ status: newStatus, updated_at: new Date() })
      .where(eq(schema.campanhas.id, id))
      .returning()

    return { success: true, data: updatedCampaign }

  } catch (error: any) {
    console.error('API campanhas/[id].patch:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Erro interno ao atualizar campanha' })
  }
})
