import { db } from '~/server/db'
import { users, inboxes } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { findEvolutionInstanceId } from '../lib/evolution'

export default defineEventHandler(async (event) => {
  console.log('[inboxes.post] Iniciando criação de inbox...')

  const config = useRuntimeConfig()

  if (!config.evolutionApiUrl || !config.evolutionApiKey) {
    console.error('[inboxes.post] Configurações da Evolution API não encontradas:', {
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
    let body
    try {
      body = await readBody(event)
      console.log('[inboxes.post] Body lido:', { name: body?.name, description: body?.description })
    } catch (bodyError: any) {
      console.error('[inboxes.post] Erro ao ler body:', bodyError)
      throw createError({
        statusCode: 400,
        statusMessage: 'Erro ao ler dados da requisição: ' + (bodyError.message || 'Body inválido')
      })
    }

    const { name, description } = body || {}

    // 2. Validação dos campos obrigatórios
    if (!name?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'O nome da caixa de entrada é obrigatório'
      })
    }

    // 3. Verificar autenticação
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário não autenticado'
      })
    }

    // 4. Buscar empresa do usuário
    const userData = await db
      .select({ empresa_id: users.empresa_id })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
      .then(r => r[0])

    if (!userData?.empresa_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Usuário não possui empresa vinculada'
      })
    }

    console.log('[inboxes.post] Empresa encontrada:', userData.empresa_id)

    // 5. Criar inbox no banco
    console.log('[inboxes.post] Criando inbox no banco de dados...')
    const inboxData = await db
      .insert(inboxes)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        empresa_id: userData.empresa_id,
        status: 'disconnected'
      })
      .returning()
      .then(r => r[0])

    if (!inboxData) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Erro ao criar caixa de entrada'
      })
    }

    console.log('[inboxes.post] Inbox criado no banco:', inboxData.id)

    // 6. Criar instância na Evolution API
    console.log('[inboxes.post] Criando instância na Evolution API...')
    const webhookUrl = `${config.public.siteUrl}/api/webhook/whatsapp`

    let evolutionResponse = null
    try {
      evolutionResponse = await $fetch(`${config.evolutionApiUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': config.evolutionApiKey as string,
          'Content-Type': 'application/json'
        },
        body: {
          name: inboxData.id,
          token: inboxData.id,
          webhook: webhookUrl,
          webhookEvents: ['messages.upsert', 'connection.update']
        }
      })
      console.log('[inboxes.post] Instância criada na Evolution:', evolutionResponse)
    } catch (evolutionError: any) {
      console.error('[inboxes.post] Erro ao criar instância na Evolution (não crítico):', evolutionError.message || evolutionError)
    }

    // 7. Configurar settings da instância (se criada com sucesso)
    if (evolutionResponse) {
      try {
        let evolutionInstanceId = (evolutionResponse as any)?.data?.id || (evolutionResponse as any)?.id || (evolutionResponse as any)?.instance?.id

        if (!evolutionInstanceId) {
          console.log('[inboxes.post] Buscando ID da instância via lookup...')
          evolutionInstanceId = await findEvolutionInstanceId(config, inboxData.id)
        }

        const settingsTarget = evolutionInstanceId || inboxData.id

        console.log(`[inboxes.post] Configurando Advanced Settings para instância ${settingsTarget}`)
        await $fetch(`${config.evolutionApiUrl}/instance/${settingsTarget}/advanced-settings`, {
          method: 'PUT',
          headers: {
            'apikey': config.evolutionApiKey as string,
            'Content-Type': 'application/json'
          },
          body: {
            rejectCall: false,
            msgCall: 'Por favor, envie mensagem',
            ignoreGroups: true,
            alwaysOnline: true,
            readMessages: true,
            syncFullHistory: false,
            readStatus: false
          }
        })
        console.log('[inboxes.post] Settings configurados com sucesso')
      } catch (settingsError: any) {
        console.error('[inboxes.post] Erro ao configurar settings (não crítico):', settingsError.message || settingsError)
      }
    }

    console.log('[inboxes.post] Inbox criado com sucesso!')
    return {
      success: true,
      data: {
        ...inboxData,
        evolutionCreated: !!evolutionResponse
      }
    }

  } catch (error: any) {
    console.error('[inboxes.post] Erro no handler:', error)

    if (error.statusCode) {
      throw error
    }

    const errorMessage = error.message || error.data?.message || 'Erro interno do servidor'
    throw createError({
      statusCode: 500,
      statusMessage: errorMessage
    })
  }
})
