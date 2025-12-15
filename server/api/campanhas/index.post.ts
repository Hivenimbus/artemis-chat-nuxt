import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const body = await readBody(event)
    const client = serverSupabaseServiceRole(event)

    // Get user data to find empresa_id
    const { data: userData, error: userError } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
    }

    // Validate body
    if (!body.messageText && !body.attachment) {
      throw createError({ statusCode: 400, statusMessage: 'Mensagem ou anexo é obrigatório' })
    }

    if (!body.inboxId) {
      throw createError({ statusCode: 400, statusMessage: 'Caixa de entrada é obrigatória' })
    }

    // Prepare campaign data
    const campaignData = {
      empresa_id: userData.empresa_id,
      user_id: user.id,
      message_text: body.messageText,
      attachment_url: body.attachment?.path || body.attachmentUrl, // Legacy: Keep populating for now
      attachment_type: body.attachment?.type || body.attachmentType, // Legacy
      attachments: body.attachments || [], // New JSONB column
      recipient_type: body.recipientType || 'all',
      target_tags: body.selectedTags || [],
      scheduled_at: body.sendType === 'scheduled' ? body.scheduledDateTime : null,
      status: body.sendType === 'scheduled' ? 'scheduled' : 'processing', // If now, start processing (or queue for it)
      inbox_id: body.inboxId
    }

    // Insert campaign
    const { data: campaign, error: insertError } = await client
      .from('campanhas')
      .insert(campaignData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating campaign:', insertError)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao criar campanha' })
    }

    return {
      success: true,
      data: campaign
    }

  } catch (error: any) {
    console.error('API campanhas/index.post:', error)
    throw createError({ 
      statusCode: error.statusCode || 500, 
      statusMessage: error.statusMessage || 'Erro interno ao criar campanha' 
    })
  }
})

