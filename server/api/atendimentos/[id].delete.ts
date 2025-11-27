import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/atendimentos/[id].delete: Iniciando exclusão de atendimento')

    // Obter usuário autenticado
    const client = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await client.auth.getUser()

    if (userError || !user) {
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

    // Obter dados do usuário (para verificar empresa)
    const { data: userData, error: userDataError } = await client
      .from('users')
      .select('empresa_id, role')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData?.empresa_id) {
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

    // 1. Buscar mensagens com mídia para exclusão do storage
    const { data: mensagensComMidia, error: midiaError } = await client
      .from('mensagens')
      .select('media_url')
      .eq('atendimento_id', atendimentoId)
      .not('media_url', 'is', null)

    if (midiaError) {
      console.error('Erro ao buscar mídias do atendimento:', midiaError)
      // Não paramos aqui, tentamos excluir o resto
    }

    // 2. Excluir arquivos do Storage
    if (mensagensComMidia && mensagensComMidia.length > 0) {
      const pathsToDelete: string[] = []
      
      mensagensComMidia.forEach(msg => {
        if (msg.media_url) {
          try {
            // URL típica: .../storage/v1/object/public/midias/EMPRESA_ID/ARQUIVO
            // Queremos extrair tudo depois de "midias/"
            const urlParts = msg.media_url.split('/midias/')
            if (urlParts.length > 1) {
              // O path é a segunda parte
              // Decode URI component para lidar com espaços e caracteres especiais
              const path = decodeURIComponent(urlParts[1])
              pathsToDelete.push(path)
            }
          } catch (e) {
            console.error('Erro ao extrair path da mídia:', msg.media_url, e)
          }
        }
      })

      if (pathsToDelete.length > 0) {
        console.log(`🗑️ Excluindo ${pathsToDelete.length} arquivos do storage midias`)
        const { error: storageError } = await client.storage
          .from('midias')
          .remove(pathsToDelete)

        if (storageError) {
          console.error('Erro ao excluir arquivos do storage:', storageError)
        }
      }
    }

    // 3. Desvincular contato (limpar ultimo_atendimento_id)
    // Isso evita erro de FK na tabela contatos
    const { error: updateContactError } = await client
      .from('contatos')
      .update({ ultimo_atendimento_id: null })
      .eq('ultimo_atendimento_id', atendimentoId)

    if (updateContactError) {
      console.error('Erro ao desvincular contato:', updateContactError)
      // Se der erro aqui, provavelmente vai dar erro no delete do atendimento, mas seguimos
    }

    // 4. Excluir mensagens vinculadas
    const { error: deleteMessagesError } = await client
      .from('mensagens')
      .delete()
      .eq('atendimento_id', atendimentoId)

    if (deleteMessagesError) {
      console.error('Erro ao excluir mensagens do atendimento:', deleteMessagesError)
    }

    // 5. Excluir o atendimento
    const { error: deleteError } = await client
      .from('atendimentos')
      .delete()
      .eq('id', atendimentoId)

    if (deleteError) {
      console.error('Erro ao excluir atendimento:', deleteError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao excluir atendimento do banco de dados: ' + deleteError.message
      })
    }

    console.log(`✅ Atendimento ${atendimentoId} excluído com sucesso`)

    return {
      success: true,
      message: 'Atendimento excluído com sucesso'
    }

  } catch (error) {
    console.error('API /api/atendimentos/[id].delete: Erro:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
