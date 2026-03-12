import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'

export default defineEventHandler(async (event) => {
  console.log('📥 [inboxes.post] Iniciando criação de inbox...')

  const config = useRuntimeConfig()

  if (!config.meowApiUrl || !config.meowApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Configuração do servidor incompleta: API-MEOW não configurada' })
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

    // Criar instância na API-MEOW
    const webhookUrl = `${config.public.siteUrl}/api/webhook/whatsapp`
    let meowResponse = null

    try {
      meowResponse = await $fetch(`${config.meowApiUrl}/api/instances`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.meowApiKey}`,
          'Content-Type': 'application/json'
        },
        body: {
          name: inboxData.id,
          webhookUrl,
          ignoreGroups: true,
          receiveMessages: true
        }
      })
    } catch (meowError: any) {
      console.error('⚠️ [inboxes.post] Erro ao criar instância na API-MEOW (não crítico):', meowError.message || meowError)
    }

    return { success: true, data: { ...inboxData, meowCreated: !!meowResponse } }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message || 'Erro interno do servidor' })
  }
})
