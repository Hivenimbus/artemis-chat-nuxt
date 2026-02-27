import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
import { findEvolutionInstanceId } from '../lib/evolution'

export default defineEventHandler(async (event) => {
  console.log('📥 [inboxes.post] Iniciando criação de inbox...')

  const config = useRuntimeConfig()

  if (!config.evolutionApiUrl || !config.evolutionApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Configuração do servidor incompleta: Evolution API não configurada' })
  }

  try {
    const body = await readBody(event)
    const { name, description } = body || {}

    if (!name?.trim()) throw createError({ statusCode: 400, statusMessage: 'O nome da caixa de entrada é obrigatório' })

    const user = event.context.user
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })

    const [userData] = await db.select({ empresa_id: schema.users.empresa_id })
      .from(schema.users).where(eq(schema.users.id, user.id)).limit(1)

    if (!userData?.empresa_id) throw createError({ statusCode: 403, statusMessage: 'Usuário não possui empresa vinculada' })

    const [inboxData] = await db.insert(schema.inboxes).values({
      name: name.trim(),
      description: description?.trim() || null,
      empresa_id: userData.empresa_id,
      status: 'disconnected'
    }).returning()

    if (!inboxData) throw createError({ statusCode: 500, statusMessage: 'Erro ao criar caixa de entrada' })

    // Create Evolution API instance
    const webhookUrl = `${config.public.siteUrl}/api/webhook/whatsapp`
    let evolutionResponse = null

    try {
      evolutionResponse = await $fetch(`${config.evolutionApiUrl}/instance/create`, {
        method: 'POST',
        headers: { 'apikey': config.evolutionApiKey as string, 'Content-Type': 'application/json' },
        body: {
          name: inboxData.id,
          token: inboxData.id,
          webhook: webhookUrl,
          webhookEvents: ['messages.upsert', 'connection.update']
        }
      })
    } catch (evolutionError: any) {
      console.error('⚠️ [inboxes.post] Erro ao criar instância na Evolution (não crítico):', evolutionError.message || evolutionError)
    }

    if (evolutionResponse) {
      try {
        let evolutionInstanceId = (evolutionResponse as any)?.data?.id || (evolutionResponse as any)?.id || (evolutionResponse as any)?.instance?.id
        if (!evolutionInstanceId) {
          evolutionInstanceId = await findEvolutionInstanceId(config, inboxData.id)
        }
        const instanceTarget = evolutionInstanceId || inboxData.id
        await $fetch(`${config.evolutionApiUrl}/instance/${instanceTarget}/advanced-settings`, {
          method: 'PUT',
          headers: { 'apikey': config.evolutionApiKey as string, 'Content-Type': 'application/json' },
          body: { rejectCall: false, msgCall: 'Por favor, envie mensagem', ignoreGroups: true, alwaysOnline: true, readMessages: true, syncFullHistory: false, readStatus: false }
        })
      } catch (settingsError: any) {
        console.error('[inboxes.post] Erro ao configurar settings (não crítico):', settingsError.message || settingsError)
      }
    }

    return { success: true, data: { ...inboxData, evolutionCreated: !!evolutionResponse } }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message || 'Erro interno do servidor' })
  }
})
