import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const id = event.context.params?.id
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID não fornecido' })

    const body = await readBody(event)
    const { nome, descricao, inbox_ids } = body

    const client = serverSupabaseServiceRole(event)

    // Verificar se equipe existe e pertence à empresa do usuário
    const { data: teamData, error: fetchError } = await client
      .from('equipes')
      .select('empresa_id')
      .eq('id', id)
      .single()
      
    if (fetchError || !teamData) {
       throw createError({ statusCode: 404, statusMessage: 'Equipe não encontrada' })
    }

    const { data: userData } = await client
      .from('users')
      .select('empresa_id, role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'superadmin' && userData?.empresa_id !== teamData.empresa_id) {
      throw createError({ statusCode: 403, statusMessage: 'Sem permissão' })
    }

    // Atualizar equipe
    const { error } = await client
      .from('equipes')
      .update({ 
        nome, 
        descricao,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar equipe' })

    // Atualizar associações de inboxes se fornecido
    if (inbox_ids && Array.isArray(inbox_ids)) {
      // Remover associações existentes
      const { error: deleteError } = await client
        .from('inbox_teams')
        .delete()
        .eq('equipe_id', id)

      if (deleteError) {
        console.error('Erro ao limpar inboxes da equipe:', deleteError)
        throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar associações de inboxes' })
      }

      // Inserir novas
      if (inbox_ids.length > 0) {
        const inboxTeams = inbox_ids.map((inboxId: string) => ({
          equipe_id: id,
          inbox_id: inboxId
        }))
        
        const { error: insertError } = await client
          .from('inbox_teams')
          .insert(inboxTeams)

        if (insertError) {
          console.error('Erro ao adicionar inboxes à equipe:', insertError)
          throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar associações de inboxes' })
        }
      }
    }

    return { success: true }

  } catch (error) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Erro interno' })
  }
})

