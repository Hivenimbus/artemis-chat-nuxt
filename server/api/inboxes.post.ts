import { serverSupabaseClient } from '#supabase/server'
import { findEvolutionInstanceId } from '../lib/evolution'

// Importar serverSupabaseUser do módulo do Supabase se não estiver disponível globalmente
// Mas parece que serverSupabaseUser não está disponível no módulo que estamos usando ou está com nome diferente
// Vamos remover o uso de serverSupabaseUser e confiar no middleware de autenticação
// ou usar serverSupabaseClient para obter o usuário se necessário

export default defineEventHandler(async (event) => {
  console.log('📥 [inboxes.post] Iniciando criação de inbox...')
  
  // Obter config dentro do handler para garantir que está disponível
  const config = useRuntimeConfig()
  
  // Verificar se as configurações da Evolution estão disponíveis
  if (!config.evolutionApiUrl || !config.evolutionApiKey) {
    console.error('❌ [inboxes.post] Configurações da Evolution API não encontradas:', {
      evolutionApiUrl: config.evolutionApiUrl ? 'Configurado' : 'FALTANDO',
      evolutionApiKey: config.evolutionApiKey ? 'Configurado' : 'FALTANDO'
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Configuração do servidor incompleta: Evolution API não configurada'
    })
  }
  
  try {
    // 1. Ler body da requisição
    console.log('📥 [inboxes.post] Lendo body da requisição...')
    let body
    try {
      body = await readBody(event)
      console.log('✅ [inboxes.post] Body lido:', { name: body?.name, description: body?.description })
    } catch (bodyError: any) {
      console.error('❌ [inboxes.post] Erro ao ler body:', bodyError)
      throw createError({
        statusCode: 400,
        statusMessage: 'Erro ao ler dados da requisição: ' + (bodyError.message || 'Body inválido')
      })
    }
    
    const { name, description } = body || {}

    // 2. Validação dos campos obrigatórios
    if (!name?.trim()) {
      console.error('❌ [inboxes.post] Nome não fornecido')
      throw createError({
        statusCode: 400,
        statusMessage: 'O nome da caixa de entrada é obrigatório'
      })
    }

    // 3. Obter cliente Supabase
    console.log('📥 [inboxes.post] Obtendo cliente Supabase...')
    let client
    try {
      client = await serverSupabaseClient(event)
      console.log('✅ [inboxes.post] Cliente Supabase obtido')
    } catch (clientError: any) {
      console.error('❌ [inboxes.post] Erro ao obter cliente Supabase:', clientError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao conectar com banco de dados: ' + (clientError.message || 'Falha na conexão')
      })
    }

    // 4. Obter usuário autenticado
    console.log('📥 [inboxes.post] Verificando autenticação do usuário...')
    const user = event.context.user

    if (!user) {
      console.error('❌ [inboxes.post] Usuário não autenticado no contexto')
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }
    console.log('✅ [inboxes.post] Usuário autenticado:', user.id)

    // 5. Buscar empresa do usuário
    console.log('📥 [inboxes.post] Buscando empresa do usuário...')
    let userData: { empresa_id: string } | null = null
    try {
      const { data, error: userDataError } = await client
        .from('users')
        .select('empresa_id')
        .eq('id', user.id)
        .single()

      if (userDataError) {
        console.error('❌ [inboxes.post] Erro ao buscar dados do usuário:', userDataError)
        throw createError({
          statusCode: 403,
          statusMessage: 'Erro ao buscar dados do usuário: ' + (userDataError.message || 'Usuário não encontrado')
        })
      }
      
      if (!(data as any)?.empresa_id) {
        console.error('❌ [inboxes.post] Usuário sem empresa vinculada:', user.id)
        throw createError({
          statusCode: 403,
          statusMessage: 'Usuário não possui empresa vinculada'
        })
      }
      
      userData = data as { empresa_id: string }
      console.log('✅ [inboxes.post] Empresa encontrada:', userData.empresa_id)
    } catch (userDataError: any) {
      if (userDataError.statusCode) throw userDataError
      console.error('❌ [inboxes.post] Erro inesperado ao buscar empresa:', userDataError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao buscar empresa: ' + (userDataError.message || 'Erro desconhecido')
      })
    }

    // 6. Criar inbox no Supabase
    console.log('📥 [inboxes.post] Criando inbox no banco de dados...')
    let inboxData: { id: string; name: string; description: string | null; empresa_id: string; status: string } | null = null
    try {
      const { data, error: inboxError } = await client
        .from('inboxes')
        .insert({
          name: name.trim(),
          description: description?.trim() || null,
          empresa_id: userData.empresa_id,
          status: 'disconnected'
        } as any)
        .select()
        .single()

      if (inboxError) {
        console.error('❌ [inboxes.post] Erro ao criar inbox no banco:', inboxError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Erro ao criar caixa de entrada: ' + (inboxError.message || 'Falha no insert')
        })
      }
      
      inboxData = data as any
      console.log('✅ [inboxes.post] Inbox criado no banco:', inboxData!.id)
    } catch (inboxCreateError: any) {
      if (inboxCreateError.statusCode) throw inboxCreateError
      console.error('❌ [inboxes.post] Erro inesperado ao criar inbox:', inboxCreateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao criar inbox: ' + (inboxCreateError.message || 'Erro desconhecido')
      })
    }

    // 7. Criar instância na Evolution API
    console.log('📥 [inboxes.post] Criando instância na Evolution API...')
    console.log('📥 [inboxes.post] Evolution URL:', config.evolutionApiUrl)
    
    // Construir URL do webhook
    const webhookUrl = `${config.public.siteUrl}/api/webhook/whatsapp`
    console.log('📥 [inboxes.post] Webhook URL:', webhookUrl)

    let evolutionResponse = null
    try {
      evolutionResponse = await $fetch(`${config.evolutionApiUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': config.evolutionApiKey as string,
          'Content-Type': 'application/json'
        },
        body: {
          name: inboxData!.id,
          token: inboxData!.id,
          webhook: webhookUrl,
          webhookEvents: ["messages.upsert", "connection.update"]
        }
      })
      console.log('✅ [inboxes.post] Instância criada na Evolution:', evolutionResponse)
    } catch (evolutionError: any) {
      console.error('⚠️ [inboxes.post] Erro ao criar instância na Evolution (não crítico):', evolutionError.message || evolutionError)
      // Continuar mesmo se der erro na Evolution, pois o inbox já foi criado
    }

    // 8. Configurar settings da instância (se criada com sucesso)
    if (evolutionResponse) {
      try {
        let evolutionInstanceId = (evolutionResponse as any)?.data?.id || (evolutionResponse as any)?.id || (evolutionResponse as any)?.instance?.id

        if (!evolutionInstanceId) {
          console.log('📥 [inboxes.post] Buscando ID da instância via lookup...')
          evolutionInstanceId = await findEvolutionInstanceId(config, inboxData!.id)
        }

        if (evolutionInstanceId) {
          console.log(`⚙️ [inboxes.post] Configurando Advanced Settings para instância ${evolutionInstanceId}`)
          await $fetch(`${config.evolutionApiUrl}/instance/${evolutionInstanceId}/advanced-settings`, {
            method: 'PUT',
            headers: {
              'apikey': config.evolutionApiKey as string,
              'Content-Type': 'application/json'
            },
            body: {
              rejectCall: false,
              msgCall: "Por favor, envie mensagem",
              groupsIgnore: true,
              alwaysOnline: true,
              readMessages: true,
              syncFullHistory: false,
              readStatus: true
            }
          })
          console.log('✅ [inboxes.post] Settings configurados com sucesso')
        } else {
          console.warn(`⚠️ [inboxes.post] Não foi possível obter ID da instância para configurar settings`)
          // Fallback
          await $fetch(`${config.evolutionApiUrl}/instance/${inboxData!.id}/advanced-settings`, {
            method: 'PUT',
            headers: {
              'apikey': config.evolutionApiKey as string,
              'Content-Type': 'application/json'
            },
            body: {
              rejectCall: false,
              msgCall: "Por favor, envie mensagem",
              groupsIgnore: true,
              alwaysOnline: true,
              readMessages: true,
              syncFullHistory: false,
              readStatus: true
            }
          })
        }
      } catch (settingsError: any) {
        console.error('⚠️ [inboxes.post] Erro ao configurar settings (não crítico):', settingsError.message || settingsError)
      }
    }

    console.log('✅ [inboxes.post] Inbox criado com sucesso!')
    return {
      success: true,
      data: {
        ...inboxData,
        evolutionCreated: !!evolutionResponse
      }
    }

  } catch (error: any) {
    console.error('❌ [inboxes.post] Erro no handler:', error)

    // Se já for um erro criado com statusCode, retornar como está
    if (error.statusCode) {
      throw error
    }

    // Erro genérico - tentar extrair mais informações
    const errorMessage = error.message || error.data?.message || 'Erro interno do servidor'
    throw createError({
      statusCode: 500,
      statusMessage: errorMessage
    })
  }
})
