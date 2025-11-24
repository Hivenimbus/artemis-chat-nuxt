import { serverSupabaseClient } from '#supabase/server'
import { findEvolutionInstanceId } from '../../lib/evolution'

const config = useRuntimeConfig()

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID da caixa de entrada é obrigatório'
      })
    }

    // Obter usuário autenticado
    const client = await serverSupabaseClient(event)
    const { data: { user }, error: userError } = await client.auth.getUser()

    if (userError || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    // Verificar se o inbox existe e pertence à empresa do usuário (RLS já faz essa verificação)
    const { data: inbox, error: fetchError } = await client
      .from('inboxes')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !inbox) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Caixa de entrada não encontrada ou sem permissão'
      })
    }

    // Deletar instância na Evolution API (se existir)
    try {
      // Buscar o ID interno da Evolution (necessário para deletar)
      // O "name" na Evolution é o nosso "id" do inbox
      const evolutionInstanceId = await findEvolutionInstanceId(config, id)

      if (evolutionInstanceId) {
        console.log(`🗑️ Deletando instância na Evolution: ${evolutionInstanceId} (Nome: ${id})`)
        await $fetch(`${config.evolutionApiUrl}/instance/delete/${evolutionInstanceId}`, {
          method: 'DELETE',
          headers: {
            'apikey': config.evolutionApiKey
          }
        })
        console.log('✅ Instância deletada com sucesso na Evolution API')
      } else {
        console.warn(`⚠️ Instância não encontrada na Evolution para deleção: ${id}`)
        // Tentar deletar usando o ID do inbox diretamente como fallback, caso coincida
        try {
          await $fetch(`${config.evolutionApiUrl}/instance/delete/${id}`, {
             method: 'DELETE',
             headers: {
               'apikey': config.evolutionApiKey
             }
           })
        } catch (e) {
           // Ignorar erro do fallback
        }
      }
    } catch (evolutionError) {
      console.error('Erro ao deletar instância na Evolution API:', evolutionError)
      // Continuar mesmo se der erro na Evolution
    }

    // Deletar inbox do Supabase (RLS já garante que só pode deletar da própria empresa)
    const { error: deleteError } = await client
      .from('inboxes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao deletar inbox:', deleteError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao deletar caixa de entrada'
      })
    }

    return {
      success: true,
      message: 'Caixa de entrada deletada com sucesso'
    }

  } catch (error) {
    console.error('Erro no handler de deleção de inbox:', error)

    // Se já for um erro criado, retornar como está
    if (error.statusCode) {
      throw error
    }

    // Erro genérico
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
