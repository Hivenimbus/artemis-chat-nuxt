import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const body = await readBody(event)
    const { nome, descricao, empresa_id, inbox_ids } = body

    if (!nome || !empresa_id) {
      throw createError({ statusCode: 400, statusMessage: 'Dados incompletos' })
    }

    const client = serverSupabaseServiceRole(event)

    // Verificar permissão
    const { data: requestorData } = await client
      .from('users')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (requestorData?.empresa_id !== empresa_id) {
       // Se for superadmin pode tudo, mas aqui vamos assumir validação básica
       // TODO: Melhorar validação de superadmin se necessário
       if (user.role !== 'superadmin') {
         throw createError({ statusCode: 403, statusMessage: 'Sem permissão para esta empresa' })
       }
    }

    // Criar equipe
    const { data: newTeam, error } = await client
      .from('equipes')
      .insert({
        nome,
        descricao,
        empresa_id
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar equipe:', error)
      throw createError({ statusCode: 500, statusMessage: 'Erro ao criar equipe' })
    }

    // Associar caixas de entrada se fornecidas
    if (inbox_ids && Array.isArray(inbox_ids) && inbox_ids.length > 0) {
      const inboxTeams = inbox_ids.map((inboxId: string) => ({
        equipe_id: newTeam.id,
        inbox_id: inboxId
      }))
      
      const { error: inboxError } = await client
        .from('inbox_teams')
        .insert(inboxTeams)

      if (inboxError) {
        console.error('Erro ao associar inboxes à equipe:', inboxError)
      }
    }

    return { success: true, data: newTeam }

  } catch (error) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})

