import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('API /api/contatos/[id] (DELETE): Iniciando requisição')

    // Obter ID do contato dos parâmetros da rota
    const contatoId = getRouterParam(event, 'id')

    if (!contatoId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do contato não fornecido'
      })
    }

    // Validar formato do UUID
    const uuidRegex = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i
    if (!uuidRegex.test(contatoId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID do contato inválido'
      })
    }

    console.log('API /api/contatos/[id] (DELETE): Excluindo contato:', contatoId)

    // Obter usuário autenticado do contexto
    const user = event.context.user

    if (!user) {
      console.error('API /api/contatos/[id] (DELETE): Usuário não autenticado no contexto')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    const client = serverSupabaseServiceRole(event)

    // Buscar dados completos do usuário na tabela users
    const { data: userData, error } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('API /api/contatos/[id] (DELETE): Erro ao buscar dados do usuário:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar dados do usuário'
      })
    }

    if (!userData || !userData.empresa_id) {
      console.error('API /api/contatos/[id] (DELETE): Usuário não possui empresa vinculada')
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário não está associado a nenhuma empresa'
      })
    }

    // Verificar se o contato existe e pertence à empresa do usuário
    const { data: contatoExistente, error: contatoExistenteError } = await client
      .from('contatos')
      .select('id, nome')
      .eq('id', contatoId)
      .eq('empresa_id', userData.empresa_id)
      .single()

    if (contatoExistenteError) {
      console.error('API /api/contatos/[id] (DELETE): Erro ao verificar contato:', contatoExistenteError)

      if (contatoExistenteError.code === 'PGRST116') {
        throw createError({
          statusCode: 404,
          statusMessage: 'Contato não encontrado'
        })
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao verificar contato'
      })
    }

    if (!contatoExistente) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Contato não encontrado'
      })
    }

    console.log('API /api/contatos/[id] (DELETE): Contato encontrado, iniciando exclusão:', contatoExistente.nome)

    // Excluir o contato (as associações com etiquetas serão excluídas em cascata devido ao ON DELETE CASCADE)
    const { error: exclusaoError } = await client
      .from('contatos')
      .delete()
      .eq('id', contatoId)
      .eq('empresa_id', userData.empresa_id)

    if (exclusaoError) {
      console.error('API /api/contatos/[id] (DELETE): Erro ao excluir contato:', exclusaoError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao excluir contato'
      })
    }

    console.log('API /api/contatos/[id] (DELETE): Contato excluído com sucesso:', contatoId)

    return {
      success: true,
      message: 'Contato excluído com sucesso',
      data: {
        id: contatoId,
        nome: contatoExistente.nome
      }
    }

  } catch (error: any) {
    console.error('API /api/contatos/[id] (DELETE): Erro no handler:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})
