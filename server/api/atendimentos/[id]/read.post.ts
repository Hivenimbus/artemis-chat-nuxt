import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/atendimentos/[id]/read: Iniciando marcação de mensagens como lidas')

    // Obter usuário do contexto (injetado pelo middleware 01-auth-check)
    const user = event.context.user

    if (!user) {
      console.error('API /api/atendimentos/[id]/read: Usuário não autenticado no contexto')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    // Obter ID do atendimento
    const atendimentoId = getRouterParam(event, 'id')
    if (!atendimentoId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do atendimento é obrigatório'
      })
    }

    const client = serverSupabaseServiceRole(event)

    // Obter dados do usuário
    const { data: userData, error: userDataError } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData?.empresa_id) {
      console.error('API /api/atendimentos/[id]/read: Usuário sem empresa:', userDataError)
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Verificar se atendimento existe e pertence à empresa
    const { data: atendimento, error: atendimentoError } = await client
      .from('atendimentos')
      .select(`
        id,
        inboxes!inner (
          empresa_id
        )
      `)
      .eq('id', atendimentoId)
      .single()

    if (atendimentoError || !atendimento || atendimento.inboxes.empresa_id !== userData.empresa_id) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Atendimento não encontrado ou não pertence à sua empresa'
      })
    }

    // Marcar mensagens não lidas como lidas
    // Filtramos por remetente 'contact' (mensagens recebidas) que ainda não foram lidas
    const { error: updateMessagesError } = await client
      .from('mensagens')
      .update({ lida: true })
      .eq('atendimento_id', atendimentoId)
      .eq('lida', false)
      .eq('remetente', 'contact')

    if (updateMessagesError) {
      console.error('API /api/atendimentos/[id]/read: Erro ao atualizar mensagens:', updateMessagesError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao marcar mensagens como lidas'
      })
    }

    // Atualizar contador de mensagens não lidas no atendimento
    const { error: updateAtendimentoError } = await client
      .from('atendimentos')
      .update({ unread_count: 0 })
      .eq('id', atendimentoId)

    if (updateAtendimentoError) {
      console.error('API /api/atendimentos/[id]/read: Erro ao atualizar contador do atendimento:', updateAtendimentoError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao atualizar contador do atendimento'
      })
    }

    console.log('API /api/atendimentos/[id]/read: Mensagens marcadas como lidas com sucesso')

    return {
      success: true,
      message: 'Mensagens marcadas como lidas'
    }

  } catch (error) {
    console.error('API /api/atendimentos/[id]/read: Erro no handler:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})

