import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const id = event.context.params?.id
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID inválido' })
    }

    const body = await readBody(event)
    const client = serverSupabaseServiceRole(event)

    // Check ownership/permissions (ensure user belongs to same company)
    const { data: userData } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (!userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Erro de permissão' })
    }

    // Update fields
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.start_time !== undefined) updateData.start_time = body.start_time
    if (body.end_time !== undefined) updateData.end_time = body.end_time
    if (body.status !== undefined) updateData.status = body.status
    if (body.message_text !== undefined) updateData.message_text = body.message_text
    if (body.inbox_id !== undefined) updateData.inbox_id = body.inbox_id
    if (body.color !== undefined) updateData.color = body.color
    updateData.updated_at = new Date().toISOString()

    const { data: updatedAgendamento, error: updateError } = await client
      .from('agendamentos')
      .update(updateData)
      .eq('id', id)
      .eq('empresa_id', userData.empresa_id) // Security check
      .select()
      .single()

    if (updateError) {
      console.error('Error updating agendamento:', updateError)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar agendamento' })
    }

    // Update contacts if provided
    if (body.contact_ids && Array.isArray(body.contact_ids)) {
      // First delete existing links
      await client
        .from('agendamento_contatos')
        .delete()
        .eq('agendamento_id', id)

      // Then insert new ones
      if (body.contact_ids.length > 0) {
        const contactLinks = body.contact_ids.map((contactId: string) => ({
          agendamento_id: id,
          contato_id: contactId
        }))

        await client
          .from('agendamento_contatos')
          .insert(contactLinks)
      }
    }

    return {
      success: true,
      data: updatedAgendamento
    }

  } catch (error) {
    console.error('API agendamentos/[id].put:', error)
    throw error
  }
})

