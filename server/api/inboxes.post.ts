import { eq } from 'drizzle-orm'
import { db, schema } from '~/server/database'
import { getHivePanelHeaders } from '~/server/lib/hive'

export default defineEventHandler(async (event) => {
  console.log('📥 [inboxes.post] Iniciando criação de inbox...')

  const config = useRuntimeConfig()

  if (!config.hiveApiUrl || !config.hiveApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Configuração do servidor incompleta: Hive API não configurada' })
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

    // Criar instância na Hive API
    const webhookUrl = `${config.public.siteUrl}/api/webhook/whatsapp`
    let hiveResponse = null

    try {
      const panelHeaders = await getHivePanelHeaders()
      hiveResponse = await $fetch(`${config.hiveApiUrl}/api/instances`, {
        method: 'POST',
        headers: panelHeaders,
        body: {
          name: inboxData.id,
          webhook_url: webhookUrl,
          ignore_groups: true,
          api_key: inboxData.id  // chave única por instância = inbox UUID
        }
      }) as any

      // Salvar o ID gerado pela Hive API
      const hiveInstanceId = (hiveResponse as any)?.id ?? null
      if (hiveInstanceId) {
        await db.update(schema.inboxes)
          .set({ hive_instance_id: hiveInstanceId, updated_at: new Date() })
          .where(eq(schema.inboxes.id, inboxData.id))
        inboxData.hive_instance_id = hiveInstanceId
      }
    } catch (hiveError: any) {
      console.error('⚠️ [inboxes.post] Erro ao criar instância na Hive API (não crítico):', hiveError.message || hiveError)
    }

    return { success: true, data: { ...inboxData, hiveCreated: !!hiveResponse } }

  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message || 'Erro interno do servidor' })
  }
})
