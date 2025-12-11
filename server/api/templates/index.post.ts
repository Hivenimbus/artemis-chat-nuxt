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

    // Insert template
    const { data: template, error: insertError } = await client
      .from('message_templates')
      .insert({
        empresa_id: userData.empresa_id,
        user_id: user.id,
        content: body.content
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating template:', insertError)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao criar modelo de mensagem' })
    }

    return {
      success: true,
      data: template
    }

  } catch (error: any) {
    console.error('API templates/index.post:', error)
    throw createError({ 
      statusCode: error.statusCode || 500, 
      statusMessage: error.statusMessage || 'Erro interno ao criar modelo' 
    })
  }
})
