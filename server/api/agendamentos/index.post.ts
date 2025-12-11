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

    // Prepare agendamento data
    const agendamentoData = {
      empresa_id: userData.empresa_id,
      user_id: user.id,
      title: body.title,
      description: body.description,
      start_time: body.start_time,
      end_time: body.end_time,
      type: body.type,
      status: body.status || 'scheduled',
      message_text: body.message_text,
      inbox_id: body.inbox_id || null,
      color: body.color
    }

    // Insert agendamento
    const { data: agendamento, error: insertError } = await client
      .from('agendamentos')
      .insert(agendamentoData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating agendamento:', insertError)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao criar agendamento' })
    }

    // Link contacts if provided
    if (body.contact_ids && Array.isArray(body.contact_ids) && body.contact_ids.length > 0) {
      const contactLinks = body.contact_ids.map((contactId: string) => ({
        agendamento_id: agendamento.id,
        contato_id: contactId
      }))

      const { error: linksError } = await client
        .from('agendamento_contatos')
        .insert(contactLinks)

      if (linksError) {
        console.error('Error linking contacts:', linksError)
        // Note: The agendamento was created, but contacts failed.
        // We could delete the agendamento here or just return a warning.
      }
    }

    return {
      success: true,
      data: agendamento
    }

  } catch (error) {
    console.error('API agendamentos/index.post:', error)
    throw error
  }
})

