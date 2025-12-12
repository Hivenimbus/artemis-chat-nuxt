import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const client = serverSupabaseServiceRole(event)

    // Verify ownership and update
    const { data: attachment, error: updateError } = await client
      .from('campaign_attachments')
      .update({
        caption: body.caption,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns it
      .select()
      .single()

    if (updateError) {
      console.error('Error updating attachment:', updateError)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar anexo' })
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
  }
})

