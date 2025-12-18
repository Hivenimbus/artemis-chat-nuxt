import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    const client = serverSupabaseServiceRole(event)
    const contactId = event.context.params.id

    // Get user data to find empresa_id
    const { data: userData, error: userError } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Usuário sem empresa vinculada' })
    }

    // 1. Fetch Contact Details (created_at)
    const { data: contact, error: contactError } = await client
      .from('contatos')
      .select('created_at')
      .eq('id', contactId)
      .eq('empresa_id', userData.empresa_id)
      .single()

    if (contactError) {
      throw createError({ statusCode: 404, statusMessage: 'Contato não encontrado' })
    }

    // 2. Count Total Tickets (atendimentos)
    const { count: totalTickets, error: ticketsError } = await client
      .from('atendimentos')
      .select('*', { count: 'exact', head: true })
      .eq('contato_id', contactId)

    if (ticketsError) {
      console.error('Error counting tickets:', ticketsError)
    }

    // 3. Fetch Recent Interactions (atendimentos)
    const { data: recentInteractions, error: interactionsError } = await client
      .from('atendimentos')
      .select(`
        id,
        status,
        created_at,
        ultimo_mensagem,
        users!atendimentos_usuario_responsavel_id_fkey (
          name
        ),
        inboxes (
          name
        )
      `)
      .eq('contato_id', contactId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (interactionsError) {
      console.error('Error fetching interactions:', interactionsError)
    }

    return {
      success: true,
      stats: {
        totalTickets: totalTickets || 0,
        createdAt: contact.created_at
      },
      history: recentInteractions?.map(interaction => ({
        id: interaction.id,
        type: 'ticket', // ticket, message, note, etc.
        status: interaction.status,
        date: interaction.created_at,
        description: interaction.ultimo_mensagem || 'Novo atendimento iniciado',
        agent: interaction.users?.name || 'Sistema',
        channel: interaction.inboxes?.name || 'N/A'
      })) || []
    }

  } catch (error) {
    console.error('API contatos/[id]/stats.get:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erro ao buscar estatísticas do contato'
    })
  }
})

