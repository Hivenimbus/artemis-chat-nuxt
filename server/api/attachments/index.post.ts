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

    if (!body.fileUrl) {
      throw createError({ statusCode: 400, statusMessage: 'URL do arquivo é obrigatória' })
    }

    // Insert attachment metadata
    const { data: attachment, error: insertError } = await client
      .from('campaign_attachments')
      .insert({
        empresa_id: userData.empresa_id,
        user_id: user.id,
        file_url: body.fileUrl,
        file_type: body.fileType,
        file_name: body.fileName,
        caption: body.caption
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving attachment:', insertError)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao salvar anexo' })
    }

    return {
      success: true,
      data: attachment
    }

  } catch (error: any) {
    console.error('API attachments/index.post:', error)
    throw createError({ 
      statusCode: error.statusCode || 500, 
      statusMessage: error.statusMessage || 'Erro interno ao salvar anexo' 
    })
  }
})

