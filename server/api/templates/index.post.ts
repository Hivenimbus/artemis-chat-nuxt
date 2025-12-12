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

    if (!body.content) {
      throw createError({ statusCode: 400, statusMessage: 'Conteúdo é obrigatório' })
    }

    // Check if template exists for user
    const { data: existingTemplate } = await client
      .from('message_templates')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let templateData
    let operationError

    if (existingTemplate) {
      // Update existing
      const { data, error } = await client
        .from('message_templates')
        .update({
          content: body.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTemplate.id)
        .select()
        .single()
      
      templateData = data
      operationError = error
    } else {
      // Insert new
      const { data, error } = await client
        .from('message_templates')
        .insert({
          user_id: user.id,
          empresa_id: userData.empresa_id,
          content: body.content,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      templateData = data
      operationError = error
    }

    if (operationError) {
      console.error('Error saving template:', operationError)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao salvar modelo de mensagem' })
    }

    return {
      success: true,
      data: templateData
    }

  } catch (error: any) {
    console.error('API templates/index.post:', error)
    throw createError({ 
      statusCode: error.statusCode || 500, 
      statusMessage: error.statusMessage || 'Erro interno ao salvar modelo' 
    })
  }
})
