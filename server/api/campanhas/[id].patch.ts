import { serverSupabaseServiceRole } from '#supabase/server'

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

    const client = serverSupabaseServiceRole(event)

    // Get user's empresa_id
    const { data: userData, error: userError } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
    }

    // Get current campaign
    const { data: campaign, error: campaignError } = await client
      .from('campanhas')
      .select('id, status, empresa_id')
      .eq('id', id)
      .eq('empresa_id', userData.empresa_id)
      .single()

    if (campaignError || !campaign) {
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
    const { data: updatedCampaign, error: updateError } = await client
      .from('campanhas')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating campaign:', updateError)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar campanha' })
    }

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

